# Payment & Enrollment Integration Testing Guide

## Prerequisites

1. MongoDB running
2. Server running on port 5000
3. Client running on port 3000
4. bKash sandbox credentials configured

## Test Scenario: Complete Payment Flow

### Step 1: Create a Test User

```bash
# Ensure you have a user in your database
# User ID will be needed for enrollment
```

### Step 2: Create a Test Course

```bash
# Ensure you have a published course with price > 0
# Example:
{
  "_id": "course_id_here",
  "title": "Test Course",
  "price": 1500,
  "published": true
}
```

### Step 3: Enroll in Course

**Request:**

```bash
POST http://localhost:5000/api/enrollments/enroll/COURSE_ID
Content-Type: application/json

{
  "userId": "USER_ID_HERE"
}
```

**Expected Response:**

```json
{
    "success": true,
    "message": "Successfully enrolled in course",
    "enrollment": {
        "_id": "enrollment_id",
        "user": "user_id",
        "course": "course_id",
        "paymentStatus": "pending", // ← Should be pending for paid courses
        "paymentAmount": 1500,
        "status": "active"
    }
}
```

**Verify in MongoDB:**

```javascript
db.enrollments.findOne({ user: ObjectId("USER_ID") });
// Should show: paymentStatus: "pending"
```

### Step 4: Initiate Payment

**Request:**

```bash
POST http://localhost:5000/api/payments/initiate
Content-Type: application/json

{
  "userId": "USER_ID_HERE",
  "userEmail": "user@example.com",
  "courseId": "COURSE_ID_HERE",
  "courseName": "Test Course",
  "amount": 1500,
  "paymentMethod": "bkash"
}
```

**Expected Response:**

```json
{
    "success": true,
    "message": "Payment initiated successfully",
    "data": {
        "orderId": "ORD-1699999999-XXXXXX",
        "paymentID": "TR00XXX",
        "bkashURL": "https://tokenized.sandbox.bka.sh/...",
        "amount": 1500
    }
}
```

**Save for later:**

-   `orderId`
-   `paymentID`

**Verify in MongoDB:**

```javascript
db.payments.findOne({ orderId: "ORD-XXXXX" });
// Should show: status: "processing", transactionStatus: "Initiated"
```

### Step 5: Complete Payment (Simulate bKash Success)

**Request:**

```bash
POST http://localhost:5000/api/payments/complete
Content-Type: application/json

{
  "paymentID": "PAYMENT_ID_FROM_STEP_4",
  "orderId": "ORDER_ID_FROM_STEP_4"
}
```

**Expected Response:**

```json
{
    "success": true,
    "message": "Payment completed successfully",
    "data": {
        "orderId": "ORD-XXXXX",
        "paymentID": "TR00XXX",
        "trxID": "ABC123XYZ",
        "amount": 1500,
        "status": "completed",
        "enrollmentUpdated": true // ← This confirms enrollment was updated
    }
}
```

### Step 6: Verify Database Updates

**Check Payment Collection:**

```javascript
db.payments.findOne({ orderId: "ORD-XXXXX" })

// Should show:
{
  status: "completed",
  transactionStatus: "Completed",
  paymentID: "TR00XXX",
  trxID: "ABC123XYZ",
  completedAt: ISODate("...")
}
```

**Check Enrollment Collection:**

```javascript
db.enrollments.findOne({
  user: ObjectId("USER_ID"),
  course: ObjectId("COURSE_ID")
})

// Should show:
{
  paymentStatus: "completed",  // ← Updated from "pending"
  paymentAmount: 1500,
  status: "active"
}
```

### Step 7: Verify User Can Access Course

**Request:**

```bash
GET http://localhost:5000/api/enrollments/my-courses?userId=USER_ID
```

**Expected Response:**

```json
{
    "success": true,
    "enrollments": [
        {
            "paymentStatus": "completed",
            "status": "active",
            "course": {
                "title": "Test Course"
                // ... course details
            }
        }
    ]
}
```

## Frontend Testing

### Test in Browser

1. **Navigate to course page:**

    ```
    http://localhost:3000/courses/COURSE_ID
    ```

2. **Click "Enroll Now" button**

    - Should redirect to checkout page

3. **Click "Pay" button**

    - Should redirect to bKash payment page
    - Complete payment on bKash (use sandbox credentials)

4. **After payment:**

    - Should redirect to `/payment/success?paymentID=XXX`
    - Page should show "Verifying Payment..."
    - Then show success message with payment details

5. **Check console logs:**

    ```
    Payment completed successfully!
    ```

6. **Navigate to dashboard:**
    ```
    http://localhost:3000/dashboard
    ```
    - Course should appear in "My Courses"
    - Payment status should be "completed"

## Error Scenarios

### Scenario 1: Payment Fails

**Simulate failed payment:**

```bash
# Modify bKash execute response to return failed status
# Or cancel payment on bKash page
```

**Expected:**

-   Payment status: "failed"
-   Enrollment status: still "pending"
-   User can retry payment

### Scenario 2: Enrollment Doesn't Exist

**Steps:**

1. Create payment without enrollment
2. Complete payment

**Expected:**

-   Payment completes successfully
-   Warning in server console: "Enrollment not found"
-   Response includes: `enrollmentUpdated: false`

### Scenario 3: Duplicate Enrollment

**Request:**

```bash
POST /api/enrollments/enroll/COURSE_ID
{
  "userId": "SAME_USER_ID"
}
```

**Expected Response:**

```json
{
    "error": "Already enrolled in this course",
    "enrollment": {
        /* existing enrollment */
    }
}
```

## Integration Test Script

Create a test file `test-payment-flow.js`:

```javascript
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
const userId = "YOUR_USER_ID";
const courseId = "YOUR_COURSE_ID";

async function testPaymentFlow() {
    try {
        // 1. Enroll
        console.log("1. Enrolling in course...");
        const enrollRes = await axios.post(
            `${BASE_URL}/enrollments/enroll/${courseId}`,
            { userId }
        );
        console.log("✓ Enrolled:", enrollRes.data.enrollment.paymentStatus);

        // 2. Initiate payment
        console.log("2. Initiating payment...");
        const paymentRes = await axios.post(`${BASE_URL}/payments/initiate`, {
            userId,
            userEmail: "test@example.com",
            courseId,
            courseName: "Test Course",
            amount: 1500,
            paymentMethod: "bkash",
        });
        const { orderId, paymentID } = paymentRes.data.data;
        console.log("✓ Payment initiated:", orderId);

        // 3. Complete payment (manual step - use bKash sandbox)
        console.log("3. Complete payment on bKash...");
        console.log("   PaymentID:", paymentID);
        console.log("   OrderID:", orderId);
        console.log("   Then call: POST /api/payments/complete");
    } catch (error) {
        console.error("✗ Error:", error.response?.data || error.message);
    }
}

testPaymentFlow();
```

## Monitoring Logs

**Server logs to watch:**

```bash
# On successful payment completion:
Enrollment payment status updated for user USER_ID and course COURSE_ID

# If enrollment not found:
Enrollment not found for user USER_ID and course COURSE_ID
```

## Common Issues

### Issue 1: "Enrollment not found"

**Cause:** User didn't enroll before payment
**Solution:** Always enroll first, then initiate payment

### Issue 2: Payment status stays "pending"

**Cause:** Payment completion endpoint not called
**Solution:** Ensure callback redirects to success page

### Issue 3: "Already enrolled" error

**Cause:** User trying to enroll twice
**Solution:** Check if user is already enrolled before showing enroll button

## Success Criteria

✅ Enrollment created with `paymentStatus: "pending"`  
✅ Payment created with `status: "processing"`  
✅ After payment: Payment `status: "completed"`  
✅ After payment: Enrollment `paymentStatus: "completed"`  
✅ User can access course content  
✅ Course appears in user's dashboard

## API Endpoints Summary

| Endpoint                            | Method | Purpose                             |
| ----------------------------------- | ------ | ----------------------------------- |
| `/api/enrollments/enroll/:courseId` | POST   | Create enrollment (status: pending) |
| `/api/payments/initiate`            | POST   | Create payment & get bKash URL      |
| `/api/payments/complete`            | POST   | Execute payment & update enrollment |
| `/api/payments/status/:orderId`     | GET    | Check payment status                |
| `/api/enrollments/my-courses`       | GET    | Get user's enrollments              |
