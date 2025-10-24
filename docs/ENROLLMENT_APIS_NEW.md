# Enrollment APIs - Quick Reference

## New Endpoints Added

### ✅ Get Enrollments by Course

```
GET /api/enrollments/course/:courseId
```

Returns all students enrolled in a specific course with statistics.

**Response:**

-   List of enrollments with user and course details
-   Statistics: total, active, completed, dropped enrollments
-   Average progress percentage
-   Total revenue

---

### ✅ Get Enrollments by Instructor

```
GET /api/enrollments/instructor/:instructorId
```

Returns all students across all instructor's courses with comprehensive statistics.

**Response:**

-   List of all enrollments across instructor's courses
-   Statistics: unique students, enrollments by status, revenue, progress
-   List of instructor's courses
-   Unique student counting (avoids duplicates)

---

## Query Parameters (Both Endpoints)

-   `status` - Filter by: `active`, `completed`, `dropped`
-   `sortBy` - Sort field (default: `enrolledAt`)
-   `order` - Sort order: `asc` or `desc` (default: `desc`)
-   `courseId` - (Instructor endpoint only) Filter by specific course

---

## Frontend Integration

### Updated API Function

```typescript
// lib/api/instructor.ts
export const getInstructorStudents = async (instructorId: string) => {
    const response = await axiosInstance.get(
        `/api/enrollments/instructor/${instructorId}`
    );
    return response.data;
};
```

### Before vs After

**Before (Multiple API Calls):**

```typescript
// 1. Get all courses
const courses = await fetch(`/api/courses?instructor=${id}`);

// 2. Get enrollments for each course (N+1 problem)
for (const course of courses) {
    await fetch(`/api/enrollments/course/${course._id}`);
}
```

**After (Single API Call):**

```typescript
// One call gets everything!
const data = await fetch(`/api/enrollments/instructor/${id}`);
```

---

## Benefits

✅ **Performance** - Single API call instead of N+1
✅ **Statistics** - Pre-calculated stats included
✅ **Unique Counting** - Correctly counts unique students
✅ **Filtering** - Built-in status and course filtering
✅ **Sorting** - Flexible sorting options
✅ **Revenue** - Automatic revenue calculation
✅ **Progress** - Average progress tracking

---

## Testing

```bash
# Get all students for an instructor
curl http://localhost:5000/api/enrollments/instructor/INSTRUCTOR_ID

# Get active students only
curl http://localhost:5000/api/enrollments/instructor/INSTRUCTOR_ID?status=active

# Get students for specific course
curl http://localhost:5000/api/enrollments/course/COURSE_ID

# Sort by progress
curl http://localhost:5000/api/enrollments/course/COURSE_ID?sortBy=progress.progressPercentage&order=desc
```

---

## Complete Documentation

See `ENROLLMENT_API_DOCUMENTATION.md` for full details.
