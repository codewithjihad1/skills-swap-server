# User Management API - Quick Testing Guide

## Prerequisites

1. Start the backend server:

```bash
cd skills-swap-server
npm start
```

2. Ensure MongoDB is running and connected

## API Endpoints Created

✅ **GET /api/users** - Get all users with filters
✅ **GET /api/users/stats** - Get user statistics
✅ **PATCH /api/users/:id/role** - Update user role
✅ **PATCH /api/users/:id/status** - Update user status
✅ **DELETE /api/users/:id?permanent=true** - Delete user

## Testing with the Frontend

### 1. Start the Frontend

```bash
cd skills-swap-client
npm run dev
```

### 2. Login as Admin

-   Navigate to `http://localhost:3000`
-   Login with an admin account
-   Go to Admin Dashboard → Manage Users

### 3. Test Features

#### View Users

-   The page should automatically load all users
-   Try the search bar to search by name or email
-   Filter by role (User, Instructor, Admin)
-   Filter by status (Active, Suspended, Banned)

#### Change User Role

1. Click the three-dot menu on any user row
2. Select "Change Role" → Choose a role
3. Confirm the action
4. Should see success toast notification
5. User role should update in the table

#### Change User Status

1. Click the three-dot menu on any user row
2. Select "Change Status" → Choose a status
3. Confirm the action
4. Should see success toast notification
5. User status badge should update

#### Delete User

1. Click the three-dot menu on any user row
2. Select "Delete User"
3. Confirm the destructive action
4. Should see success toast
5. User should be removed from the table

## Testing with cURL (Backend Only)

### 1. Get All Users

```bash
curl http://localhost:5000/api/users
```

### 2. Get Users with Filters

```bash
# Filter by role
curl http://localhost:5000/api/users?role=instructor

# Filter by status
curl http://localhost:5000/api/users?status=active

# Search by name
curl http://localhost:5000/api/users?search=john

# Combined filters
curl "http://localhost:5000/api/users?role=instructor&status=active&search=john&page=1&limit=10"
```

### 3. Get User Statistics

```bash
curl http://localhost:5000/api/users/stats
```

Expected response:

```json
{
    "stats": {
        "totalUsers": 150,
        "activeUsers": 120,
        "instructors": 15,
        "students": 135,
        "suspendedUsers": 30,
        "pendingApprovals": 0
    }
}
```

### 4. Update User Role

```bash
# Replace USER_ID with actual user ID
curl -X PATCH http://localhost:5000/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -d '{"role": "instructor"}'
```

### 5. Update User Status

```bash
# Suspend a user
curl -X PATCH http://localhost:5000/api/users/USER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended"}'

# Activate a user
curl -X PATCH http://localhost:5000/api/users/USER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### 6. Delete User

```bash
# Soft delete (deactivate)
curl -X DELETE http://localhost:5000/api/users/USER_ID

# Permanent delete
curl -X DELETE "http://localhost:5000/api/users/USER_ID?permanent=true"
```

## Expected Behavior

### Frontend

1. **Stats Cards** should show real numbers:

    - Total Users
    - Active Users
    - Instructors
    - Suspended Users

2. **User Table** should display:

    - User avatar and name
    - Email address
    - Role badge (colored)
    - Status badge (colored)
    - Joined date
    - Actions dropdown menu

3. **Filters** should work:

    - Search should filter by name/email in real-time
    - Role filter should show only selected role
    - Status filter should show only selected status
    - Combine all filters together

4. **Actions** should work:

    - All actions should show confirmation dialog
    - Success/error toast notifications
    - Table should refresh after action
    - Stats should update after action

5. **Pagination** should appear when > 10 users
    - Previous/Next buttons
    - Page counter
    - 10 users per page

### Backend

1. **GET /api/users** should:

    - Return users array with all fields
    - Apply filters correctly
    - Support pagination
    - Map `student` → `user` role
    - Add `status` field based on `isActive`

2. **GET /api/users/stats** should:

    - Return aggregate counts
    - Count all users, active, suspended
    - Count instructors and students separately

3. **PATCH /api/users/:id/role** should:

    - Validate role input
    - Update user role in database
    - Map `user` → `student` for backend
    - Return updated user object

4. **PATCH /api/users/:id/status** should:

    - Validate status input
    - Update `isActive` field
    - Return updated user object

5. **DELETE /api/users/:id** should:
    - Soft delete by default (set `isActive: false`)
    - Permanent delete with `?permanent=true`
    - Return success message

## Common Issues & Solutions

### Issue: "Cannot GET /api/users"

**Solution:** Make sure the route is registered in `index.js`:

```javascript
app.use("/api/users", userRoutes);
```

### Issue: Role not updating

**Solution:** Check role mapping:

-   Frontend sends: `user`, `instructor`, `admin`
-   Backend stores: `student`, `instructor`, `admin`
-   Make sure mapping is correct in both directions

### Issue: Stats showing 0

**Solution:**

1. Check if MongoDB has user data
2. Run this in MongoDB shell:

```javascript
db.users.countDocuments();
db.users.find({ role: "instructor" }).count();
```

### Issue: Search not working

**Solution:** Ensure MongoDB supports regex:

```javascript
{
    $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
    ];
}
```

### Issue: CORS error

**Solution:** Check CORS configuration in `index.js`:

```javascript
app.use(cors());
```

## Role & Status Values

### Valid Roles (Frontend)

-   `user` → Maps to `student` in backend
-   `instructor`
-   `admin`

### Valid Statuses (Frontend)

-   `active` → `isActive: true`
-   `suspended` → `isActive: false`
-   `banned` → `isActive: false`
-   `pending` → Custom field (not implemented yet)

## Next Steps

1. ✅ Test all endpoints with Postman or cURL
2. ✅ Test frontend UI and all actions
3. ⏳ Add authentication middleware (verify admin role)
4. ⏳ Add rate limiting to prevent abuse
5. ⏳ Add email notifications for status changes
6. ⏳ Add activity logging for admin actions

## Verification Checklist

-   [ ] Backend server starts without errors
-   [ ] All routes are registered correctly
-   [ ] GET /api/users returns user list
-   [ ] GET /api/users/stats returns statistics
-   [ ] PATCH role endpoint works
-   [ ] PATCH status endpoint works
-   [ ] DELETE endpoint works (both soft and hard delete)
-   [ ] Frontend displays stats cards
-   [ ] Frontend displays user table
-   [ ] Search filter works
-   [ ] Role filter works
-   [ ] Status filter works
-   [ ] Role change action works
-   [ ] Status change action works
-   [ ] Delete action works
-   [ ] Confirmation dialogs appear
-   [ ] Toast notifications appear
-   [ ] Table refreshes after actions
-   [ ] Pagination works for > 10 users

---

**Ready to Test!** 🚀

For detailed API documentation, see: `docs/USER_MANAGEMENT_API.md`
