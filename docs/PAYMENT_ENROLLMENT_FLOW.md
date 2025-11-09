# Payment and Enrollment Update Flow

## Overview

This document explains how payment completion automatically updates both the Payment and Enrollment collections in MongoDB.

## Flow Diagram

```
User Clicks "Pay"
    ↓
1. POST /api/payments/initiate
    ↓
   Creates Payment record (status: "pending")
    ↓
   Returns bKash payment URL
    ↓
2. User redirected to bKash
    ↓
3. User completes payment on bKash
    ↓
4. bKash redirects to callback URL
    ↓
5. Callback redirects to /payment/success?paymentID=xxx
    ↓
6. Frontend calls POST /api/payments/complete
    ↓
7. Backend executes bKash payment
    ↓
8. Updates Payment collection (status: "completed")
    ↓
9. Updates Enrollment collection (paymentStatus: "completed")
    ↓
10. Returns success response
    ↓
11. User sees success page with course access
```

## Database Updates

### Payment Collection Update

When payment is completed, the following fields are updated:

```javascript
{
  paymentID: "bkash_payment_id",
  trxID: "bkash_transaction_id",
  transactionStatus: "Completed",
  status: "completed",
  customerMsisdn: "phone_number",
  completedAt: new Date()
}
```

### Enrollment Collection Update

Automatically triggered after payment completion:

```javascript
{
  paymentStatus: "completed",  // Changed from "pending"
  paymentAmount: 1500          // Amount paid
}
```

## Implementation Details

### Server-Side (paymentController.js)

The `completePayment` function handles:

1. Payment execution with bKash
2. Payment record update
3. **Enrollment status update** (NEW)

```javascript
// Update enrollment payment status
const Enrollment = require("../models/Enrollment");
const enrollment = await Enrollment.findOne({
    user: payment.userId,
    course: payment.courseId,
});

if (enrollment) {
    enrollment.paymentStatus = "completed";
    enrollment.paymentAmount = payment.amount;
    await enrollment.save();
}
```

### Client-Side (payment/success/page.tsx)

When user is redirected after payment:

1. Retrieves `paymentID` from URL
2. Retrieves `orderId` from sessionStorage
3. Calls `/api/payments/complete` endpoint
4. Shows success message
5. Redirects to dashboard

## Key Files Modified

### Server Files

-   `src/controllers/paymentController.js` - Added enrollment update logic
-   `src/models/Payment.js` - Payment schema
-   `src/models/Enrollment.js` - Enrollment schema with paymentStatus field

### Client Files

-   `src/app/payment/success/page.tsx` - Payment verification page
-   `src/app/(home)/courses/[courseId]/checkout/page.tsx` - Checkout page

## Testing Flow

### 1. Enroll in Course

```bash
POST /api/enrollments/enroll/:courseId
{
  "userId": "user_id_here"
}
```

Creates enrollment with `paymentStatus: "pending"`

### 2. Initiate Payment

```bash
POST /api/payments/initiate
{
  "userId": "user_id",
  "userEmail": "user@example.com",
  "courseId": "course_id",
  "courseName": "Course Name",
  "amount": 1500,
  "paymentMethod": "bkash"
}
```

### 3. Complete Payment (After bKash redirect)

```bash
POST /api/payments/complete
{
  "paymentID": "bkash_payment_id",
  "orderId": "order_id"
}
```

This will:

-   Execute bKash payment
-   Update Payment: `status: "completed"`
-   Update Enrollment: `paymentStatus: "completed"`

### 4. Verify Updates

```bash
# Check payment
GET /api/payments/status/:orderId

# Check enrollment
GET /api/enrollments/my-courses?userId=xxx
```

## Error Handling

### Payment Fails

-   Payment status: `"failed"`
-   Enrollment status: Remains `"pending"`
-   User can retry payment

### Enrollment Not Found

-   Payment completes successfully
-   Warning logged in console
-   Response includes `enrollmentUpdated: false`

## Environment Variables Required

```env
# bKash Configuration
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret

# Server Configuration
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

## Database Schema

### Payment Schema

```javascript
{
  userId: ObjectId,
  userEmail: String,
  courseId: ObjectId,
  courseName: String,
  orderId: String,
  amount: Number,
  paymentMethod: String,
  status: "pending" | "processing" | "completed" | "failed",
  transactionStatus: "Initiated" | "Completed" | "Failed",
  paymentID: String,
  trxID: String,
  completedAt: Date
}
```

### Enrollment Schema

```javascript
{
  user: ObjectId,
  course: ObjectId,
  status: "active" | "completed" | "dropped",
  paymentStatus: "pending" | "completed" | "refunded" | "free",
  paymentAmount: Number,
  enrolledAt: Date,
  progress: {
    progressPercentage: Number,
    completedLessons: Array
  }
}
```

## API Response Example

### Successful Payment Completion

```json
{
    "success": true,
    "message": "Payment completed successfully",
    "data": {
        "orderId": "ORD-1234567890-ABC123",
        "paymentID": "bkash_payment_id",
        "trxID": "bkash_transaction_id",
        "amount": 1500,
        "status": "completed",
        "enrollmentUpdated": true
    }
}
```

## Notes

-   The enrollment must be created BEFORE payment (using `/api/enrollments/enroll`)
-   The enrollment is created with `paymentStatus: "pending"` for paid courses
-   Only after successful payment does the `paymentStatus` change to `"completed"`
-   If payment fails, enrollment remains in `"pending"` state
-   Free courses have `paymentStatus: "free"` from the start

## Future Improvements

1. Add webhook handler for async payment updates
2. Implement payment retry mechanism
3. Add refund handling for enrollment cancellation
4. Send email notification on successful payment
5. Create payment invoice generation
6. Add payment analytics dashboard
