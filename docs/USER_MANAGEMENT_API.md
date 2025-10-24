# User Management API Documentation

This document describes the admin user management APIs for managing users in the Skills Swap platform.

## Overview

The user management APIs allow administrators to:

-   View all users with pagination and filtering
-   Get user statistics
-   Update user roles
-   Update user status (activate/suspend/ban)
-   Delete users (permanently or soft delete)

## Base URL

```
/api/users
```

## Endpoints

### 1. Get All Users

Get a paginated list of all users with optional filtering.

**Endpoint:** `GET /api/users`

**Query Parameters:**

-   `page` (optional, default: 1) - Page number for pagination
-   `limit` (optional, default: 100) - Number of users per page
-   `role` (optional) - Filter by role: `user`, `instructor`, `admin`, `all`
-   `status` (optional) - Filter by status: `active`, `suspended`, `banned`, `pending`, `all`
-   `search` (optional) - Search by name or email (case-insensitive)

**Example Request:**

```bash
GET /api/users?page=1&limit=10&role=instructor&status=active&search=john
```

**Response:**

```json
{
    "users": [
        {
            "_id": "user_id",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "instructor",
            "status": "active",
            "avatar": "avatar_url",
            "bio": "User bio",
            "isActive": true,
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-10-24T10:30:00.000Z"
        }
    ],
    "total": 150,
    "pages": 15,
    "currentPage": 1
}
```

**Notes:**

-   Backend role `student` is automatically mapped to frontend role `user`
-   Status is derived from `isActive` field: `true` = `active`, `false` = `suspended`

---

### 2. Get User Statistics

Get aggregate statistics about users in the system.

**Endpoint:** `GET /api/users/stats`

**Example Request:**

```bash
GET /api/users/stats
```

**Response:**

```json
{
    "stats": {
        "totalUsers": 1250,
        "activeUsers": 980,
        "instructors": 85,
        "students": 1165,
        "suspendedUsers": 270,
        "pendingApprovals": 0
    }
}
```

---

### 3. Update User Role

Update a user's role (Admin only).

**Endpoint:** `PATCH /api/users/:id/role`

**URL Parameters:**

-   `id` (required) - User ID

**Request Body:**

```json
{
    "role": "instructor"
}
```

**Valid Roles:**

-   `user` (mapped to `student` in backend)
-   `instructor`
-   `admin`

**Example Request:**

```bash
PATCH /api/users/60a7f8e9c4d5e6f7a8b9c0d1/role
Content-Type: application/json

{
  "role": "instructor"
}
```

**Response:**

```json
{
    "message": "User role updated successfully",
    "user": {
        "_id": "60a7f8e9c4d5e6f7a8b9c0d1",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "instructor",
        "status": "active",
        "avatar": "avatar_url",
        "bio": "User bio",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-10-24T10:30:00.000Z"
    }
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid role provided
-   `404 Not Found` - User not found
-   `500 Internal Server Error` - Server error

---

### 4. Update User Status

Update a user's status (Admin only).

**Endpoint:** `PATCH /api/users/:id/status`

**URL Parameters:**

-   `id` (required) - User ID

**Request Body:**

```json
{
    "status": "suspended"
}
```

**Valid Statuses:**

-   `active` - User can access the platform
-   `suspended` - User is temporarily suspended
-   `banned` - User is permanently banned

**Example Request:**

```bash
PATCH /api/users/60a7f8e9c4d5e6f7a8b9c0d1/status
Content-Type: application/json

{
  "status": "suspended"
}
```

**Response:**

```json
{
    "message": "User status updated successfully",
    "user": {
        "_id": "60a7f8e9c4d5e6f7a8b9c0d1",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "status": "suspended",
        "avatar": "avatar_url",
        "bio": "User bio",
        "isActive": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-10-24T10:30:00.000Z"
    }
}
```

**Error Responses:**

-   `400 Bad Request` - Invalid status provided
-   `404 Not Found` - User not found
-   `500 Internal Server Error` - Server error

---

### 5. Delete User

Delete a user (soft delete by default, permanent deletion with query parameter).

**Endpoint:** `DELETE /api/users/:id`

**URL Parameters:**

-   `id` (required) - User ID

**Query Parameters:**

-   `permanent` (optional) - Set to `true` for permanent deletion

**Example Request (Soft Delete):**

```bash
DELETE /api/users/60a7f8e9c4d5e6f7a8b9c0d1
```

**Response:**

```json
{
    "message": "User deactivated successfully"
}
```

**Example Request (Permanent Delete):**

```bash
DELETE /api/users/60a7f8e9c4d5e6f7a8b9c0d1?permanent=true
```

**Response:**

```json
{
    "message": "User permanently deleted successfully"
}
```

**Error Responses:**

-   `404 Not Found` - User not found
-   `500 Internal Server Error` - Server error

---

## Role & Status Mapping

### Frontend to Backend Role Mapping:

-   Frontend `user` → Backend `student`
-   Frontend `instructor` → Backend `instructor`
-   Frontend `admin` → Backend `admin`

### Backend to Frontend Role Mapping:

-   Backend `student` → Frontend `user`
-   Backend `instructor` → Frontend `instructor`
-   Backend `admin` → Frontend `admin`

### Status Mapping:

-   `isActive: true` → `status: "active"`
-   `isActive: false` → `status: "suspended"` or `"banned"`

---

## Authentication & Authorization

**Note:** All these endpoints should be protected and accessible only to users with `admin` role. Implement authentication middleware to verify:

1. User is authenticated (valid JWT token)
2. User has `admin` role
3. User has permission to perform the requested action

### Recommended Middleware Implementation:

```javascript
// middleware/auth.js
const verifyAdmin = async (req, res, next) => {
    try {
        // Verify JWT token from headers
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Decode and verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId);

        // Check if user exists and is admin
        if (!user || user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Apply to routes
router.get("/", verifyAdmin, usersController.getAllUsers);
router.get("/stats", verifyAdmin, usersController.getUserStats);
router.patch("/:id/role", verifyAdmin, usersController.updateUserRole);
router.patch("/:id/status", verifyAdmin, usersController.updateUserStatus);
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
    "error": "Error message description"
}
```

Common HTTP Status Codes:

-   `200 OK` - Request successful
-   `400 Bad Request` - Invalid input data
-   `401 Unauthorized` - Authentication required
-   `403 Forbidden` - Insufficient permissions
-   `404 Not Found` - Resource not found
-   `500 Internal Server Error` - Server error

---

## Frontend Integration

The frontend uses React Query hooks for data fetching and caching:

```typescript
import {
    useAllUsers,
    useUserStats,
    updateUserRole,
    updateUserStatus,
    deleteUser,
} from "@/lib/api/admin";

// Get all users with filters
const { data, isLoading } = useAllUsers({
    role: "instructor",
    status: "active",
    search: "john",
    page: 1,
    limit: 10,
});

// Get user statistics
const { data: stats } = useUserStats();

// Update user role
const result = await updateUserRole(userId, "instructor");

// Update user status
const result = await updateUserStatus(userId, "suspended");

// Delete user
const result = await deleteUser(userId);
```

---

## Testing Examples

### cURL Examples:

**Get all active instructors:**

```bash
curl -X GET "http://localhost:5000/api/users?role=instructor&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update user role:**

```bash
curl -X PATCH "http://localhost:5000/api/users/USER_ID/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"role": "instructor"}'
```

**Suspend user:**

```bash
curl -X PATCH "http://localhost:5000/api/users/USER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"status": "suspended"}'
```

**Delete user permanently:**

```bash
curl -X DELETE "http://localhost:5000/api/users/USER_ID?permanent=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Database Schema

The User schema includes the following relevant fields:

```javascript
{
  name: String,              // User's full name
  email: String,             // User's email (unique)
  role: String,              // 'student', 'instructor', or 'admin'
  avatar: String,            // Profile picture URL
  bio: String,               // User biography
  isActive: Boolean,         // true = active, false = suspended/banned
  isOnline: Boolean,         // Current online status
  lastSeen: Date,            // Last activity timestamp
  rating: Number,            // User rating (0-5)
  skills: [ObjectId],        // Reference to Skill documents
  createdAt: Date,           // Account creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

---

## Future Enhancements

Consider implementing these features:

1. **Bulk Operations** - Update multiple users at once
2. **User Activity Logs** - Track admin actions on users
3. **Email Notifications** - Notify users when their status/role changes
4. **Advanced Filters** - Filter by date range, rating, etc.
5. **Export Users** - Export user data to CSV/Excel
6. **User Import** - Bulk import users from file
7. **Audit Trail** - Track all changes made to user accounts

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.

**Last Updated:** October 24, 2025
