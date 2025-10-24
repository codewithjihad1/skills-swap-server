# Enrollment & Progress API Documentation for Frontend Developers

## Base URL

```
http://localhost:5000/api/enrollments
```

## Table of Contents

1. [Enroll in Course](#1-enroll-in-course)
2. [Get My Enrolled Courses](#2-get-my-enrolled-courses)
3. [Get Course Progress](#3-get-course-progress)
4. [Update Lesson Progress](#4-update-lesson-progress)
5. [Unenroll from Course](#5-unenroll-from-course)
6. [Rate Course (Bonus)](#6-rate-course-bonus)
7. [Frontend Integration Examples](#frontend-integration-examples)

---

## 1. Enroll in Course

**Endpoint:** `POST /api/enrollments/enroll/:courseId`  
**Access:** Private  
**Description:** Enroll a user into a course. Checks if course exists, is published, and user isn't already enrolled.

### URL Parameters

| Parameter  | Type   | Required | Description            |
| ---------- | ------ | -------- | ---------------------- |
| `courseId` | string | Yes      | Course ID to enroll in |

### Request Body

```json
{
    "userId": "64f5a1b2c3d4e5f6a7b8c9d1"
}
```

### Request Example

```javascript
// Using fetch
const enrollInCourse = async (courseId, userId) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/enroll/${courseId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 'Authorization': `Bearer ${token}`,  // Add when auth is implemented
            },
            body: JSON.stringify({ userId }),
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const enrollUserInCourse = async (courseId, userId) => {
    const response = await axios.post(`/api/enrollments/enroll/${courseId}`, {
        userId,
    });
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Successfully enrolled in course",
    "enrollment": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9e0",
        "user": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar": "https://example.com/avatar.jpg"
        },
        "course": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
            "title": "Complete Web Development Bootcamp",
            "description": "Learn web development from scratch...",
            "thumbnail": "https://example.com/thumb.jpg",
            "instructor": "64f5a1b2c3d4e5f6a7b8c9d2",
            "duration": 40
        },
        "enrolledAt": "2024-10-15T10:30:00.000Z",
        "status": "active",
        "progress": {
            "completedLessons": [],
            "totalLessonsCompleted": 0,
            "progressPercentage": 0,
            "lastAccessedAt": "2024-10-15T10:30:00.000Z"
        },
        "paymentStatus": "free",
        "paymentAmount": 0,
        "certificateIssued": false
    }
}
```

### Response (Error - Already Enrolled)

```json
{
    "error": "Already enrolled in this course",
    "enrollment": {
        /* existing enrollment */
    }
}
```

### Response (Error - Course Not Found)

```json
{
    "error": "Course not found"
}
```

### Response (Error - Unpublished Course)

```json
{
    "error": "Cannot enroll in an unpublished course"
}
```

---

## 2. Get My Enrolled Courses

**Endpoint:** `GET /api/enrollments/my-courses`  
**Access:** Private  
**Description:** Get all courses the current user is enrolled in with filtering and statistics.

### Query Parameters

| Parameter | Type   | Default    | Description                                             |
| --------- | ------ | ---------- | ------------------------------------------------------- |
| `userId`  | string | -          | User ID (required - will come from auth token later)    |
| `status`  | string | -          | Filter by status: `active`, `completed`, `dropped`      |
| `sortBy`  | string | enrolledAt | Sort field: `enrolledAt`, `progress.progressPercentage` |
| `order`   | string | desc       | Sort order: `asc` or `desc`                             |

### Request Example

```javascript
// Using fetch - get all active courses
const getMyActiveCourses = async (userId) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/my-courses?userId=${userId}&status=active`
    );
    return await response.json();
};

// Get all enrollments sorted by progress
const getMyCoursesByProgress = async (userId) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/my-courses?userId=${userId}&sortBy=progress.progressPercentage&order=asc`
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const fetchMyEnrollments = async (userId, filters = {}) => {
    const { status, sortBy, order } = filters;

    const response = await axios.get("/api/enrollments/my-courses", {
        params: {
            userId,
            status,
            sortBy,
            order,
        },
    });
    return response.data;
};
```

### Response

```json
{
    "success": true,
    "count": 5,
    "stats": {
        "total": 5,
        "active": 3,
        "completed": 1,
        "dropped": 1,
        "totalHoursEnrolled": 150,
        "averageProgress": 45
    },
    "enrollments": [
        {
            "_id": "64f5a1b2c3d4e5f6a7b8c9e0",
            "user": "64f5a1b2c3d4e5f6a7b8c9d1",
            "course": {
                "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
                "title": "Complete Web Development Bootcamp",
                "description": "Learn web development from scratch...",
                "thumbnail": "https://example.com/thumb.jpg",
                "instructor": {
                    "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
                    "name": "Jane Smith",
                    "email": "jane@example.com",
                    "avatar": "https://example.com/jane-avatar.jpg"
                },
                "category": "Web Development",
                "level": "beginner",
                "duration": 40,
                "price": 49.99,
                "rating": {
                    "average": 4.5,
                    "count": 75
                },
                "enrollmentCount": 150
            },
            "enrolledAt": "2024-09-01T10:00:00.000Z",
            "status": "active",
            "progress": {
                "completedLessons": [
                    {
                        "week": 1,
                        "lessonIndex": 0,
                        "completedAt": "2024-09-02T14:30:00.000Z"
                    },
                    {
                        "week": 1,
                        "lessonIndex": 1,
                        "completedAt": "2024-09-03T16:45:00.000Z"
                    }
                ],
                "totalLessonsCompleted": 2,
                "progressPercentage": 25,
                "lastAccessedAt": "2024-10-10T09:15:00.000Z"
            },
            "certificateIssued": false,
            "paymentStatus": "completed",
            "paymentAmount": 49.99,
            "rating": {
                "score": 5,
                "review": "Excellent course!",
                "ratedAt": "2024-10-08T12:00:00.000Z"
            }
        }
    ]
}
```

---

## 3. Get Course Progress

**Endpoint:** `GET /api/enrollments/progress/:courseId`  
**Access:** Private  
**Description:** Get detailed progress information for a specific course enrollment, including completed lessons and syllabus progress.

### URL Parameters

| Parameter  | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `courseId` | string | Yes      | Course ID   |

### Query Parameters

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| `userId`  | string | Yes      | User ID (will come from auth token later) |

### Request Example

```javascript
// Using fetch
const getCourseProgress = async (courseId, userId) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/progress/${courseId}?userId=${userId}`
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const fetchCourseProgress = async (courseId, userId) => {
    const response = await axios.get(`/api/enrollments/progress/${courseId}`, {
        params: { userId },
    });
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "progress": {
        "enrollmentId": "64f5a1b2c3d4e5f6a7b8c9e0",
        "course": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
            "title": "Complete Web Development Bootcamp",
            "description": "Learn web development from scratch...",
            "duration": 40,
            "instructor": {
                "_id": "64f5a1b2c3d4e5f6a7b8c9d2",
                "name": "Jane Smith",
                "email": "jane@example.com",
                "avatar": "https://example.com/jane-avatar.jpg"
            },
            "syllabus": [
                {
                    "week": 1,
                    "title": "HTML Fundamentals",
                    "topics": ["HTML Structure", "Semantic HTML", "Forms"],
                    "duration": 8
                },
                {
                    "week": 2,
                    "title": "CSS Styling",
                    "topics": ["Selectors", "Box Model", "Flexbox"],
                    "duration": 10
                }
            ]
        },
        "status": "active",
        "enrolledAt": "2024-09-01T10:00:00.000Z",
        "completedAt": null,
        "progress": {
            "progressPercentage": 33,
            "totalLessonsCompleted": 2,
            "lastAccessedAt": "2024-10-10T09:15:00.000Z",
            "completedLessons": [
                {
                    "week": 1,
                    "lessonIndex": 0,
                    "completedAt": "2024-09-02T14:30:00.000Z"
                },
                {
                    "week": 1,
                    "lessonIndex": 1,
                    "completedAt": "2024-09-03T16:45:00.000Z"
                }
            ]
        },
        "certificateIssued": false,
        "certificateIssuedAt": null,
        "rating": {
            "score": 5,
            "review": "Great course so far!",
            "ratedAt": "2024-10-08T12:00:00.000Z"
        },
        "syllabusProgress": [
            {
                "week": 1,
                "title": "HTML Fundamentals",
                "duration": 8,
                "topics": [
                    {
                        "topic": "HTML Structure",
                        "index": 0,
                        "completed": true
                    },
                    {
                        "topic": "Semantic HTML",
                        "index": 1,
                        "completed": true
                    },
                    {
                        "topic": "Forms",
                        "index": 2,
                        "completed": false
                    }
                ],
                "totalTopics": 3,
                "completedTopics": 2,
                "weekProgress": 67
            },
            {
                "week": 2,
                "title": "CSS Styling",
                "duration": 10,
                "topics": [
                    {
                        "topic": "Selectors",
                        "index": 0,
                        "completed": false
                    },
                    {
                        "topic": "Box Model",
                        "index": 1,
                        "completed": false
                    },
                    {
                        "topic": "Flexbox",
                        "index": 2,
                        "completed": false
                    }
                ],
                "totalTopics": 3,
                "completedTopics": 0,
                "weekProgress": 0
            }
        ]
    }
}
```

### Response (Error - Not Enrolled)

```json
{
    "error": "Not enrolled in this course"
}
```

---

## 4. Update Lesson Progress

**Endpoint:** `PUT /api/enrollments/progress/:courseId`  
**Access:** Private  
**Description:** Mark a lesson as completed or uncompleted. Automatically calculates progress percentage and updates course status.

### URL Parameters

| Parameter  | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `courseId` | string | Yes      | Course ID   |

### Request Body

```json
{
    "userId": "64f5a1b2c3d4e5f6a7b8c9d1",
    "week": 1,
    "lessonIndex": 0,
    "completed": true
}
```

| Field         | Type    | Required | Description                                                 |
| ------------- | ------- | -------- | ----------------------------------------------------------- |
| `userId`      | string  | Yes      | User ID (will come from auth token later)                   |
| `week`        | number  | Yes      | Week number from syllabus                                   |
| `lessonIndex` | number  | Yes      | Index of topic in topics array (0-based)                    |
| `completed`   | boolean | No       | `true` to mark completed, `false` to unmark (default: true) |

### Request Example

```javascript
// Mark lesson as completed
const markLessonCompleted = async (courseId, userId, week, lessonIndex) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/progress/${courseId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                week,
                lessonIndex,
                completed: true,
            }),
        }
    );
    return await response.json();
};

// Unmark lesson (mark as incomplete)
const unmarkLesson = async (courseId, userId, week, lessonIndex) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/progress/${courseId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                week,
                lessonIndex,
                completed: false,
            }),
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const updateLessonProgress = async (
    courseId,
    userId,
    week,
    lessonIndex,
    completed = true
) => {
    const response = await axios.put(`/api/enrollments/progress/${courseId}`, {
        userId,
        week,
        lessonIndex,
        completed,
    });
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Lesson completed successfully",
    "progress": {
        "progressPercentage": 50,
        "totalLessonsCompleted": 3,
        "completedLessons": [
            {
                "week": 1,
                "lessonIndex": 0,
                "completedAt": "2024-09-02T14:30:00.000Z"
            },
            {
                "week": 1,
                "lessonIndex": 1,
                "completedAt": "2024-09-03T16:45:00.000Z"
            },
            {
                "week": 1,
                "lessonIndex": 2,
                "completedAt": "2024-10-15T11:20:00.000Z"
            }
        ],
        "status": "active"
    }
}
```

**Note:** When progress reaches 100%, status automatically changes to `"completed"` and `completedAt` timestamp is set.

### Response (Error - Not Enrolled)

```json
{
    "error": "Not enrolled in this course"
}
```

### Response (Error - Missing Parameters)

```json
{
    "error": "Week and lessonIndex are required"
}
```

---

## 5. Unenroll from Course

**Endpoint:** `DELETE /api/enrollments/unenroll/:courseId`  
**Access:** Private  
**Description:** Unenroll (drop) from a course. Changes status to "dropped" rather than deleting for record keeping. Cannot unenroll from completed courses.

### URL Parameters

| Parameter  | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| `courseId` | string | Yes      | Course ID to unenroll from |

### Request Body

```json
{
    "userId": "64f5a1b2c3d4e5f6a7b8c9d1"
}
```

### Request Example

```javascript
// Using fetch
const unenrollFromCourse = async (courseId, userId) => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/unenroll/${courseId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const dropCourse = async (courseId, userId) => {
    const response = await axios.delete(
        `/api/enrollments/unenroll/${courseId}`,
        { data: { userId } }
    );
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Successfully unenrolled from course"
}
```

### Response (Error - Not Enrolled)

```json
{
    "error": "Not enrolled in this course"
}
```

### Response (Error - Course Completed)

```json
{
    "error": "Cannot unenroll from a completed course"
}
```

---

## 6. Rate Course (Bonus)

**Endpoint:** `POST /api/enrollments/rate/:courseId`  
**Access:** Private  
**Description:** Rate a course with a score (1-5) and optional review. Updates both enrollment rating and course average rating.

### URL Parameters

| Parameter  | Type   | Required | Description       |
| ---------- | ------ | -------- | ----------------- |
| `courseId` | string | Yes      | Course ID to rate |

### Request Body

```json
{
    "userId": "64f5a1b2c3d4e5f6a7b8c9d1",
    "score": 5,
    "review": "Excellent course! Learned so much about web development."
}
```

| Field    | Type   | Required | Description                               |
| -------- | ------ | -------- | ----------------------------------------- |
| `userId` | string | Yes      | User ID (will come from auth token later) |
| `score`  | number | Yes      | Rating score (1-5)                        |
| `review` | string | No       | Written review (max 1000 characters)      |

### Request Example

```javascript
// Using fetch
const rateCourse = async (courseId, userId, score, review = "") => {
    const response = await fetch(
        `http://localhost:5000/api/enrollments/rate/${courseId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                score,
                review,
            }),
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const submitCourseRating = async (courseId, userId, score, review = "") => {
    const response = await axios.post(`/api/enrollments/rate/${courseId}`, {
        userId,
        score,
        review,
    });
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Course rated successfully",
    "rating": {
        "score": 5,
        "review": "Excellent course! Learned so much about web development.",
        "ratedAt": "2024-10-15T12:00:00.000Z"
    }
}
```

### Response (Error - Invalid Score)

```json
{
    "error": "Rating score must be between 1 and 5"
}
```

### Response (Error - Not Enrolled)

```json
{
    "error": "Not enrolled in this course"
}
```

---

## Frontend Integration Examples

### React + Axios Service

```javascript
// api/enrollmentService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/enrollments";

// Create axios instance
const enrollmentAPI = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests (implement when auth is ready)
enrollmentAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const enrollmentService = {
    // Enroll in course
    enrollInCourse: async (courseId, userId) => {
        const response = await enrollmentAPI.post(`/enroll/${courseId}`, {
            userId,
        });
        return response.data;
    },

    // Get my enrolled courses
    getMyEnrollments: async (userId, filters = {}) => {
        const response = await enrollmentAPI.get("/my-courses", {
            params: { userId, ...filters },
        });
        return response.data;
    },

    // Get course progress
    getCourseProgress: async (courseId, userId) => {
        const response = await enrollmentAPI.get(`/progress/${courseId}`, {
            params: { userId },
        });
        return response.data;
    },

    // Update lesson progress
    updateLessonProgress: async (
        courseId,
        userId,
        week,
        lessonIndex,
        completed = true
    ) => {
        const response = await enrollmentAPI.put(`/progress/${courseId}`, {
            userId,
            week,
            lessonIndex,
            completed,
        });
        return response.data;
    },

    // Unenroll from course
    unenrollFromCourse: async (courseId, userId) => {
        const response = await enrollmentAPI.delete(`/unenroll/${courseId}`, {
            data: { userId },
        });
        return response.data;
    },

    // Rate course
    rateCourse: async (courseId, userId, score, review = "") => {
        const response = await enrollmentAPI.post(`/rate/${courseId}`, {
            userId,
            score,
            review,
        });
        return response.data;
    },
};
```

### React Component - My Courses Dashboard

```jsx
// components/MyCoursesDashboard.jsx
import { useState, useEffect } from "react";
import { enrollmentService } from "../api/enrollmentService";

const MyCoursesDashboard = ({ userId }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("active");

    useEffect(() => {
        fetchEnrollments();
    }, [userId, filter]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const data = await enrollmentService.getMyEnrollments(userId, {
                status: filter !== "all" ? filter : undefined,
            });
            setEnrollments(data.enrollments);
            setStats(data.stats);
        } catch (error) {
            console.error("Error fetching enrollments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async (courseId) => {
        if (!confirm("Are you sure you want to unenroll from this course?"))
            return;

        try {
            await enrollmentService.unenrollFromCourse(courseId, userId);
            fetchEnrollments(); // Refresh list
        } catch (error) {
            console.error("Error unenrolling:", error);
            alert("Failed to unenroll from course");
        }
    };

    if (loading) return <div>Loading your courses...</div>;

    return (
        <div className="my-courses-dashboard">
            {/* Statistics */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Courses</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active</h3>
                        <p className="stat-value">{stats.active}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed</h3>
                        <p className="stat-value">{stats.completed}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Average Progress</h3>
                        <p className="stat-value">{stats.averageProgress}%</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Hours</h3>
                        <p className="stat-value">
                            {stats.totalHoursEnrolled}h
                        </p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="filter-tabs">
                <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                >
                    All Courses
                </button>
                <button
                    className={filter === "active" ? "active" : ""}
                    onClick={() => setFilter("active")}
                >
                    Active
                </button>
                <button
                    className={filter === "completed" ? "active" : ""}
                    onClick={() => setFilter("completed")}
                >
                    Completed
                </button>
                <button
                    className={filter === "dropped" ? "active" : ""}
                    onClick={() => setFilter("dropped")}
                >
                    Dropped
                </button>
            </div>

            {/* Course List */}
            <div className="courses-grid">
                {enrollments.map((enrollment) => (
                    <div key={enrollment._id} className="enrollment-card">
                        <img
                            src={enrollment.course.thumbnail}
                            alt={enrollment.course.title}
                        />
                        <div className="card-content">
                            <h3>{enrollment.course.title}</h3>
                            <p className="instructor">
                                by {enrollment.course.instructor.name}
                            </p>

                            {/* Progress Bar */}
                            <div className="progress-section">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${enrollment.progress.progressPercentage}%`,
                                        }}
                                    />
                                </div>
                                <span className="progress-text">
                                    {enrollment.progress.progressPercentage}%
                                    Complete
                                </span>
                            </div>

                            {/* Meta Info */}
                            <div className="meta-info">
                                <span
                                    className={`status-badge ${enrollment.status}`}
                                >
                                    {enrollment.status}
                                </span>
                                <span className="enrolled-date">
                                    Enrolled:{" "}
                                    {new Date(
                                        enrollment.enrolledAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="card-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() =>
                                        (window.location.href = `/course/${enrollment.course._id}/learn`)
                                    }
                                >
                                    Continue Learning
                                </button>

                                {enrollment.status === "active" && (
                                    <button
                                        className="btn-danger"
                                        onClick={() =>
                                            handleUnenroll(
                                                enrollment.course._id
                                            )
                                        }
                                    >
                                        Unenroll
                                    </button>
                                )}

                                {enrollment.status === "completed" &&
                                    !enrollment.rating?.score && (
                                        <button
                                            className="btn-secondary"
                                            onClick={() =>
                                                (window.location.href = `/course/${enrollment.course._id}/rate`)
                                            }
                                        >
                                            Rate Course
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {enrollments.length === 0 && (
                <div className="empty-state">
                    <p>No courses found</p>
                    <button onClick={() => (window.location.href = "/courses")}>
                        Browse Courses
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyCoursesDashboard;
```

### React Component - Course Learning Page

```jsx
// components/CourseLearningPage.jsx
import { useState, useEffect } from "react";
import { enrollmentService } from "../api/enrollmentService";

const CourseLearningPage = ({ courseId, userId }) => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingLesson, setUpdatingLesson] = useState(null);

    useEffect(() => {
        fetchProgress();
    }, [courseId, userId]);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const data = await enrollmentService.getCourseProgress(
                courseId,
                userId
            );
            setProgress(data.progress);
        } catch (error) {
            console.error("Error fetching progress:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLessonCompletion = async (
        week,
        lessonIndex,
        currentlyCompleted
    ) => {
        setUpdatingLesson(`${week}-${lessonIndex}`);

        try {
            await enrollmentService.updateLessonProgress(
                courseId,
                userId,
                week,
                lessonIndex,
                !currentlyCompleted
            );
            await fetchProgress(); // Refresh progress
        } catch (error) {
            console.error("Error updating lesson:", error);
            alert("Failed to update lesson progress");
        } finally {
            setUpdatingLesson(null);
        }
    };

    if (loading) return <div>Loading course...</div>;
    if (!progress) return <div>Course not found</div>;

    return (
        <div className="course-learning-page">
            {/* Header */}
            <div className="course-header">
                <h1>{progress.course.title}</h1>
                <p>Instructor: {progress.course.instructor.name}</p>

                {/* Overall Progress */}
                <div className="overall-progress">
                    <h3>
                        Overall Progress: {progress.progress.progressPercentage}%
                    </h3>
                    <div className="progress-bar large">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${progress.progress.progressPercentage}%`,
                            }}
                        />
                    </div>
                    <p>
                        {progress.progress.totalLessonsCompleted} lessons
                        completed
                    </p>
                </div>
            </div>

            {/* Syllabus with Progress */}
            <div className="syllabus-section">
                <h2>Course Syllabus</h2>

                {progress.syllabusProgress?.map((weekData) => (
                    <div key={weekData.week} className="week-section">
                        <div className="week-header">
                            <h3>
                                Week {weekData.week}: {weekData.title}
                            </h3>
                            <span className="week-progress">
                                {weekData.weekProgress}% Complete
                            </span>
                        </div>

                        <div className="week-progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${weekData.weekProgress}%` }}
                            />
                        </div>

                        <ul className="topics-list">
                            {weekData.topics.map((topicData) => {
                                const isUpdating =
                                    updatingLesson ===
                                    `${weekData.week}-${topicData.index}`;

                                return (
                                    <li
                                        key={topicData.index}
                                        className={`topic-item ${
                                            topicData.completed
                                                ? "completed"
                                                : ""
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={topicData.completed}
                                            onChange={() =>
                                                toggleLessonCompletion(
                                                    weekData.week,
                                                    topicData.index,
                                                    topicData.completed
                                                )
                                            }
                                            disabled={isUpdating}
                                        />
                                        <span className="topic-name">
                                            {topicData.topic}
                                        </span>
                                        {isUpdating && (
                                            <span className="spinner">⏳</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Certificate Section */}
            {progress.status === "completed" && (
                <div className="certificate-section">
                    <h3>🎉 Congratulations! You've completed this course!</h3>
                    {progress.certificateIssued ? (
                        <button className="btn-success">
                            Download Certificate
                        </button>
                    ) : (
                        <button className="btn-primary">
                            Request Certificate
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseLearningPage;
```

### Next.js with TanStack Query

```javascript
// lib/api/enrollments.ts
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:5000/api/enrollments";

// Get my enrollments
export const useMyEnrollments = (userId, filters = {}) => {
    return useQuery({
        queryKey: ["enrollments", userId, filters],
        queryFn: async () => {
            const { data } = await axios.get(`/my-courses`, {
                params: { userId, ...filters },
            });
            return data;
        },
        enabled: !!userId,
    });
};

// Get course progress
export const useCourseProgress = (courseId, userId) => {
    return useQuery({
        queryKey: ["course-progress", courseId, userId],
        queryFn: async () => {
            const { data } = await axios.get(`/progress/${courseId}`, {
                params: { userId },
            });
            return data;
        },
        enabled: !!courseId && !!userId,
    });
};

// Enroll in course
export const useEnrollInCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ courseId, userId }) => {
            const { data } = await axios.post(`/enroll/${courseId}`, {
                userId,
            });
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["enrollments", variables.userId],
            });
        },
    });
};

// Update lesson progress
export const useUpdateLessonProgress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            courseId,
            userId,
            week,
            lessonIndex,
            completed,
        }) => {
            const { data } = await axios.put(`/progress/${courseId}`, {
                userId,
                week,
                lessonIndex,
                completed,
            });
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [
                    "course-progress",
                    variables.courseId,
                    variables.userId,
                ],
            });
            queryClient.invalidateQueries({
                queryKey: ["enrollments", variables.userId],
            });
        },
    });
};

// Unenroll from course
export const useUnenrollFromCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ courseId, userId }) => {
            const { data } = await axios.delete(`/unenroll/${courseId}`, {
                data: { userId },
            });
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["enrollments", variables.userId],
            });
        },
    });
};

// Rate course
export const useRateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ courseId, userId, score, review }) => {
            const { data } = await axios.post(`/rate/${courseId}`, {
                userId,
                score,
                review,
            });
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [
                    "course-progress",
                    variables.courseId,
                    variables.userId,
                ],
            });
            queryClient.invalidateQueries({
                queryKey: ["enrollments", variables.userId],
            });
        },
    });
};

// Usage in component:
// const { data, isLoading } = useMyEnrollments(userId, { status: 'active' });
// const enrollMutation = useEnrollInCourse();
// enrollMutation.mutate({ courseId, userId });
```

---

## Enrollment Schema Reference

### Enrollment Object Structure

```typescript
interface Enrollment {
    _id: string;
    user: string | User; // User ID or populated User object
    course: string | Course; // Course ID or populated Course object
    enrolledAt: Date;
    status: "active" | "completed" | "dropped";
    progress: {
        completedLessons: Array<{
            week: number;
            lessonIndex: number;
            completedAt: Date;
        }>;
        totalLessonsCompleted: number;
        progressPercentage: number; // 0-100, auto-calculated
        lastAccessedAt: Date;
    };
    completedAt?: Date;
    certificateIssued: boolean;
    certificateIssuedAt?: Date;
    rating?: {
        score: number; // 1-5
        review?: string; // Max 1000 chars
        ratedAt: Date;
    };
    paymentStatus: "pending" | "completed" | "refunded" | "free";
    paymentAmount: number;
    notes?: string; // Max 2000 chars
    createdAt: Date;
    updatedAt: Date;
}
```

---

## Error Handling

### Common HTTP Status Codes

-   `200` - Success (GET, PUT)
-   `201` - Created (POST enroll)
-   `400` - Bad Request (validation errors, already enrolled, etc.)
-   `404` - Not Found (course or enrollment not found)
-   `500` - Internal Server Error

### Example Error Handling

```javascript
try {
    const data = await enrollmentService.enrollInCourse(courseId, userId);
    // Handle success
} catch (error) {
    if (error.response) {
        const { status, data } = error.response;

        switch (status) {
            case 400:
                if (data.error.includes("Already enrolled")) {
                    console.log("User is already enrolled in this course");
                } else {
                    console.error("Bad request:", data.error);
                }
                break;
            case 404:
                console.error("Course not found");
                break;
            default:
                console.error("Server error:", data.error);
        }
    } else {
        console.error("Network error");
    }
}
```

---

## Important Notes

1. **Authentication**: All endpoints require `userId` in request. This will be replaced with JWT auth token in production.

2. **Progress Calculation**: Progress percentage is automatically calculated based on completed lessons vs total lessons in syllabus.

3. **Auto-Completion**: When progress reaches 100%, enrollment status automatically changes to "completed".

4. **Unenrolling**: Sets status to "dropped" rather than deleting for data retention. Cannot unenroll from completed courses.

5. **Course Enrollment Count**: Automatically incremented on enrollment and decremented on unenrollment.

6. **Rating System**: Updates both enrollment rating and course average rating when user rates a course.

7. **Lesson Indexing**: Lessons are identified by `week` (from syllabus) and `lessonIndex` (0-based index in topics array).

---

## Testing with cURL

```bash
# Enroll in course
curl -X POST http://localhost:5000/api/enrollments/enroll/COURSE_ID \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Get my courses
curl "http://localhost:5000/api/enrollments/my-courses?userId=USER_ID&status=active"

# Get course progress
curl "http://localhost:5000/api/enrollments/progress/COURSE_ID?userId=USER_ID"

# Mark lesson completed
curl -X PUT http://localhost:5000/api/enrollments/progress/COURSE_ID \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "week": 1, "lessonIndex": 0, "completed": true}'

# Unenroll from course
curl -X DELETE http://localhost:5000/api/enrollments/unenroll/COURSE_ID \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Rate course
curl -X POST http://localhost:5000/api/enrollments/rate/COURSE_ID \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "score": 5, "review": "Great course!"}'
```

---

**Last Updated:** October 15, 2025  
**API Version:** 1.0.0
