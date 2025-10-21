# 🚀 bKash Payment Integration - Quick Start Guide

Get the bKash payment system running in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
cd skills-swap-server
npm install axios
```

### 2. Add Environment Variables

Copy these to your `.env` file in `skills-swap-server`:

```bash
# bKash Sandbox Configuration
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=sandboxTokenizedUser02
BKASH_PASSWORD=sandboxTokenizedUser02@12345
BKASH_APP_KEY=4f6o0cjiki2rfm34kfdadl1eqq
BKASH_APP_SECRET=2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

### 3. Start Both Servers

```bash
# Terminal 1 - Server
cd skills-swap-server
npm run dev

# Terminal 2 - Client
cd skills-swap-client
npm run dev
```

## 🧪 Test the Integration

### Step 1: Browse Courses

1. Open http://localhost:3000
2. Navigate to courses page
3. Select any course
4. Click "Enroll Now" or "Buy Course"

### Step 2: Checkout

1. You'll be redirected to checkout page
2. Select "bKash" as payment method
3. Review order summary
4. Click "Pay ৳ XXXX"

### Step 3: bKash Payment (Sandbox)

1. You'll be redirected to bKash sandbox
2. Enter wallet number: **01770618576** (or any 11-digit number starting with 01)
3. Click "Confirm"
4. Enter OTP: **123456**
5. Enter PIN: **12345**
6. Click "Confirm"

### Step 4: Success!

-   You'll be redirected to success page
-   See payment details (Order ID, Transaction ID, Amount)
-   Payment is recorded in database

## 📱 Test Scenarios

### ✅ Successful Payment

```
Wallet: 01770618576
OTP: 123456
PIN: 12345
Result: Success page
```

### ❌ Failed Payment

```
Wallet: 01770618576
OTP: 123456
PIN: 11111 (wrong PIN)
Result: Failure page
```

### 🚫 Cancelled Payment

```
Click "Cancel" button on bKash page
Result: Cancel page
```

## 🗄️ Database Check

After successful payment, check MongoDB:

```javascript
// In MongoDB Compass or Shell
db.payments.find().sort({createdAt: -1}).limit(1)

// You should see:
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  courseId: ObjectId("..."),
  orderId: "ORD-1234567890-ABC123",
  amount: 1500,
  paymentMethod: "bkash",
  paymentID: "TR0011...",
  trxID: "9A1B2C3D4E",
  status: "completed",
  transactionStatus: "Completed",
  completedAt: ISODate("2025-10-18T...")
}
```

## 🔍 Verify Payment in Terminal

```bash
# Check server logs
# You should see:
✅ Database connected successfully
🚀 Skills Swap API Server is running on port 5000
```

## 🎯 API Endpoints

Test with Postman or curl:

### Create Payment

```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_here",
    "userEmail": "user@example.com",
    "courseId": "course_id_here",
    "courseName": "Sample Course",
    "amount": 1500,
    "paymentMethod": "bkash"
  }'
```

### Check Payment Status

```bash
curl http://localhost:5000/api/payments/status/ORD-1234567890-ABC123
```

### Get User Payments

```bash
curl http://localhost:5000/api/payments/user/USER_ID?limit=10&page=1
```

## 🔧 Troubleshooting

### Issue: "Failed to get bKash token"

**Solution:**

```bash
# Verify .env file exists and has correct values
cat .env | grep BKASH

# Should show all BKASH_ variables
```

### Issue: "Cannot connect to database"

**Solution:**

```bash
# Check MongoDB is running
# Update MONGODB_URI in .env
MONGODB_URI=mongodb://localhost:27017/skills-swap-db
```

### Issue: "CORS error"

**Solution:**

```bash
# Ensure CLIENT_URL is set correctly in .env
CLIENT_URL=http://localhost:3000
```

### Issue: Redirect not working

**Solution:**

```bash
# Verify SERVER_URL and CLIENT_URL
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Restart server after changes
```

## 📊 Payment Flow Diagram

```
User → Checkout → Select bKash → Click Pay
  ↓
Create Payment Record (pending)
  ↓
Call bKash API (get token)
  ↓
Create bKash Payment (processing)
  ↓
Redirect to bKash Page
  ↓
User Completes Payment
  ↓
Redirect to Success Page
  ↓
Execute Payment (verify)
  ↓
Update Record (completed)
  ↓
Show Success Details
```

## 🎓 Next Steps

1. ✅ Test with different courses
2. ✅ Test failure scenarios
3. ✅ Test cancelled payments
4. ✅ Check payment history in dashboard
5. ✅ Test refund process (if implemented)
6. ✅ Review payment records in database

## 📚 Full Documentation

For detailed information, see:

-   [BKASH_INTEGRATION.md](./BKASH_INTEGRATION.md) - Complete API documentation
-   [bKash Developer Portal](https://developer.bka.sh/) - Official docs

## ⚠️ Important Notes

-   **Sandbox Mode**: Currently using sandbox credentials
-   **Test Data**: All payments are test transactions
-   **Production**: Replace credentials before going live
-   **Security**: Never commit .env file to Git

## 🎉 You're All Set!

The bKash payment integration is now fully functional. Happy testing! 🚀

---

**Need Help?** Check the logs or contact support.
