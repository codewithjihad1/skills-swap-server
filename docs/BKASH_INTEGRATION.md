# bKash Payment Integration Documentation

## 📋 Overview

This document provides comprehensive information about the bKash payment gateway integration in the Skills Swap Marketplace application.

## 🔧 Features

-   ✅ bKash Sandbox Integration
-   ✅ Payment Creation & Execution
-   ✅ Payment Status Tracking
-   ✅ Payment History
-   ✅ Refund Support
-   ✅ Secure Token Management
-   ✅ Error Handling
-   ✅ Success/Failure/Cancel Pages

## 🏗️ Architecture

### Backend Components

```
skills-swap-server/
├── src/
│   ├── models/
│   │   └── Payment.js                 # Payment model schema
│   ├── controllers/
│   │   ├── bkashController.js         # bKash API integration
│   │   └── paymentController.js       # Payment business logic
│   └── routes/
│       ├── bkashRoute.js              # bKash endpoints
│       └── paymentRoute.js            # Payment endpoints
```

### Frontend Components

```
skills-swap-client/
└── src/
    └── app/
        ├── (home)/
        │   └── courses/
        │       └── [courseId]/
        │           └── checkout/
        │               └── page.tsx   # Checkout page
        └── payment/
            ├── success/
            │   └── page.tsx           # Success page
            ├── failure/
            │   └── page.tsx           # Failure page
            └── cancel/
                └── page.tsx           # Cancel page
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd skills-swap-server
npm install axios
```

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# bKash Payment Gateway (Sandbox)
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=sandboxTokenizedUser02
BKASH_PASSWORD=sandboxTokenizedUser02@12345
BKASH_APP_KEY=4f6o0cjiki2rfm34kfdadl1eqq
BKASH_APP_SECRET=2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

**Note:** These are sandbox credentials. For production, use your actual bKash credentials.

### 3. Start the Server

```bash
npm run dev
```

## 📡 API Endpoints

### Payment Routes

#### 1. Initiate Payment

**POST** `/api/payments/initiate`

Creates a payment record and initiates bKash payment.

**Request Body:**

```json
{
    "userId": "user_id_here",
    "userEmail": "user@example.com",
    "courseId": "course_id_here",
    "courseName": "Course Name",
    "amount": 1500,
    "paymentMethod": "bkash"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Payment initiated successfully",
    "data": {
        "orderId": "ORD-1234567890-ABC123",
        "paymentID": "TR0011abc123...",
        "bkashURL": "https://tokenized.sandbox.bka.sh/...",
        "amount": 1500
    }
}
```

#### 2. Complete Payment

**POST** `/api/payments/complete`

Executes the bKash payment after user authorization.

**Request Body:**

```json
{
    "paymentID": "TR0011abc123...",
    "orderId": "ORD-1234567890-ABC123"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Payment completed successfully",
    "data": {
        "orderId": "ORD-1234567890-ABC123",
        "paymentID": "TR0011abc123...",
        "trxID": "9A1B2C3D4E",
        "amount": "1500.00",
        "status": "completed"
    }
}
```

#### 3. Get Payment Status

**GET** `/api/payments/status/:orderId`

Retrieves payment information by order ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "ORD-1234567890-ABC123",
    "userId": {...},
    "courseId": {...},
    "amount": 1500,
    "status": "completed",
    "transactionStatus": "Completed",
    "trxID": "9A1B2C3D4E",
    "createdAt": "2025-10-18T...",
    "completedAt": "2025-10-18T..."
  }
}
```

#### 4. Get User Payment History

**GET** `/api/payments/user/:userId?status=completed&limit=10&page=1`

Retrieves user's payment history with pagination.

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

### bKash Routes

#### 1. Create bKash Payment

**POST** `/api/bkash/create`

**Request Body:**

```json
{
    "amount": 1500,
    "courseId": "course_id",
    "courseName": "Course Name",
    "orderId": "ORD-123"
}
```

#### 2. Execute bKash Payment

**POST** `/api/bkash/execute`

**Request Body:**

```json
{
    "paymentID": "TR0011abc123..."
}
```

#### 3. Query Payment Status

**GET** `/api/bkash/query/:paymentID`

#### 4. Refund Payment

**POST** `/api/bkash/refund`

**Request Body:**

```json
{
    "paymentID": "TR0011abc123...",
    "amount": 1500,
    "trxID": "9A1B2C3D4E",
    "sku": "course_id",
    "reason": "Customer requested refund"
}
```

#### 5. Callback Handler

**GET** `/api/bkash/callback?paymentID=xxx&status=success`

Handles bKash payment callbacks and redirects to appropriate pages.

## 💳 Payment Flow

### User Journey

```
1. User selects course → Checkout page
2. Selects payment method (bKash)
3. Clicks "Pay" button
   ↓
4. Frontend calls /api/payments/initiate
   ↓
5. Backend creates payment record
   ↓
6. Backend calls bKash create payment
   ↓
7. User redirected to bKash payment page
   ↓
8. User completes payment on bKash
   ↓
9. bKash redirects to /payment/success?paymentID=xxx
   ↓
10. Frontend calls /api/payments/complete
   ↓
11. Backend executes payment with bKash
   ↓
12. Payment marked as completed
   ↓
13. User sees success page with details
```

### Technical Flow

```javascript
// 1. Initiate Payment
POST /api/payments/initiate
  → Create Payment record (status: pending)
  → Call bKash Token API
  → Call bKash Create Payment API
  → Update Payment record (status: processing, paymentID)
  → Return bkashURL to frontend

// 2. User Payment on bKash
User completes payment on bKash portal
  → bKash redirects to callback URL
  → Callback redirects to /payment/success

// 3. Complete Payment
POST /api/payments/complete
  → Find Payment record by orderId
  → Call bKash Execute Payment API
  → Update Payment record (status: completed, trxID)
  → Return payment details
```

## 🗄️ Payment Model Schema

```javascript
{
  userId: ObjectId,
  userEmail: String,
  courseId: ObjectId,
  courseName: String,
  orderId: String (unique),
  amount: Number,
  currency: String (default: "BDT"),
  paymentMethod: String (enum: ["bkash", "nagad", "card"]),
  paymentID: String (bKash payment ID),
  trxID: String (bKash transaction ID),
  transactionStatus: String (enum: ["Initiated", "Pending", "Completed", "Failed", "Cancelled", "Refunded"]),
  customerMsisdn: String,
  bkashURL: String,
  callbackURL: String,
  status: String (enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"]),
  errorMessage: String,
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  initiatedAt: Date,
  completedAt: Date,
  failedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Frontend Usage

### Checkout Page

```tsx
import { useState } from "react";
import { toast } from "sonner";

const handlePayment = async () => {
    const response = await fetch(
        "http://localhost:5000/api/payments/initiate",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.id,
                userEmail: user.email,
                courseId: course.id,
                courseName: course.title,
                amount: course.price,
                paymentMethod: "bkash",
            }),
        }
    );

    const data = await response.json();

    if (data.success) {
        // Store for later verification
        sessionStorage.setItem("currentOrderId", data.data.orderId);
        sessionStorage.setItem("currentPaymentID", data.data.paymentID);

        // Redirect to bKash
        window.location.href = data.data.bkashURL;
    }
};
```

### Success Page

```tsx
useEffect(() => {
    const verifyPayment = async () => {
        const paymentID = searchParams.get("paymentID");
        const orderId = sessionStorage.getItem("currentOrderId");

        const response = await fetch(
            "http://localhost:5000/api/payments/complete",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentID, orderId }),
            }
        );

        const data = await response.json();

        if (data.success) {
            // Payment completed successfully
            setPaymentData(data.data);
            sessionStorage.removeItem("currentOrderId");
            sessionStorage.removeItem("currentPaymentID");
        }
    };

    verifyPayment();
}, []);
```

## 🔒 Security Features

1. **Token Management**

    - Tokens cached with 55-minute expiry
    - Automatic token refresh

2. **Payment Verification**

    - Two-step payment process (create → execute)
    - Server-side payment verification
    - Status tracking at each step

3. **Error Handling**

    - Comprehensive error logging
    - Failed payment tracking
    - Automatic status updates

4. **Data Validation**
    - Input validation on all endpoints
    - Schema validation with Mongoose
    - Required field checks

## 🧪 Testing

### Using bKash Sandbox

**Test Credentials:**

-   Username: `sandboxTokenizedUser02`
-   Password: `sandboxTokenizedUser02@12345`
-   App Key: `4f6o0cjiki2rfm34kfdadl1eqq`
-   App Secret: `2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b`

**Test Wallet:**

-   Number: `01770618576` (or any 11-digit number starting with 01)
-   OTP: `123456`
-   PIN: `12345`

### Test Scenarios

1. **Successful Payment**

    - Select course → Checkout
    - Choose bKash
    - Enter test wallet number
    - Enter OTP: 123456
    - Enter PIN: 12345
    - Verify success page shows correct details

2. **Failed Payment**

    - Enter wrong PIN multiple times
    - Verify failure page appears

3. **Cancelled Payment**
    - Click "Cancel" on bKash page
    - Verify cancel page appears

## 🐛 Troubleshooting

### Common Issues

**1. "Failed to get bKash token"**

-   Check environment variables are set correctly
-   Verify BKASH_USERNAME and BKASH_PASSWORD
-   Check network connectivity

**2. "Payment verification failed"**

-   Ensure orderId and paymentID are stored in sessionStorage
-   Check if payment was actually completed on bKash
-   Verify server logs for errors

**3. "Invalid response from bKash"**

-   Check bKash sandbox status
-   Verify request payload format
-   Check bKash API version compatibility

**4. Redirect not working**

-   Verify SERVER_URL and CLIENT_URL in .env
-   Check callback URL configuration
-   Ensure CORS is properly configured

### Debug Mode

Enable debug logging:

```javascript
// In bkashController.js
console.log("bKash Request:", paymentRequest);
console.log("bKash Response:", response.data);
```

## 📊 Payment Status States

| Status       | Description             | User Action       |
| ------------ | ----------------------- | ----------------- |
| `pending`    | Payment record created  | Wait              |
| `processing` | bKash payment initiated | Complete on bKash |
| `completed`  | Payment successful      | Access course     |
| `failed`     | Payment failed          | Retry             |
| `cancelled`  | User cancelled          | Restart           |
| `refunded`   | Payment refunded        | Contact support   |

## 🔄 Refund Process

```javascript
// Initiate refund
POST /api/bkash/refund
{
  "paymentID": "TR0011...",
  "amount": 1500,
  "trxID": "9A1B2C3D4E",
  "sku": "course_id",
  "reason": "Customer requested refund"
}

// Payment record updated automatically
{
  "status": "refunded",
  "refundAmount": 1500,
  "refundReason": "Customer requested refund",
  "refundedAt": "2025-10-18T..."
}
```

## 📝 Production Checklist

Before going to production:

-   [ ] Replace sandbox credentials with production credentials
-   [ ] Update BKASH_BASE_URL to production URL
-   [ ] Test with real bKash account
-   [ ] Set up proper error monitoring
-   [ ] Configure production callback URLs
-   [ ] Enable SSL/HTTPS
-   [ ] Set up payment reconciliation
-   [ ] Configure automated refund process
-   [ ] Set up payment analytics
-   [ ] Add payment receipt generation

## 📞 Support

-   **bKash Support:** https://developer.bka.sh/
-   **Documentation:** https://developer.bka.sh/reference

## 🎓 Additional Resources

-   [bKash Tokenized API Documentation](https://developer.bka.sh/reference/tokenized-checkout-api)
-   [bKash Sandbox Guide](https://developer.bka.sh/docs/sandbox-testing)
-   [Payment Gateway Best Practices](https://developer.bka.sh/docs/best-practices)

---

**Version:** 1.0.0  
**Last Updated:** October 18, 2025
