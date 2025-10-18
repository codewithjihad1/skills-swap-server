# Lesson API Documentation

## Base URL
```
/api/lessons
```

## Overview
The Lesson API provides endpoints for managing course lessons. Instructors can create, update, and delete lessons, while all authenticated users can view lesson information.

---

## Endpoints

### 1. Create a New Lesson
Add a new lesson to a course (instructor only).

**Endpoint:** `POST /api/lessons`

**Authentication:** Required (Instructor only)

**Request Body:**
```json
{
  "title": "Introduction to JavaScript",
  "videoUrl": "https://example.com/video.mp4",
  "duration": 45,
  "course": "507f1f77bcf86cd799439011",
  "order": 1
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | Yes | The title of the lesson |
| videoUrl | String | No | URL to the lesson video |
| duration | Number | No | Lesson duration in minutes |
| course | ObjectId | Yes | ID of the course this lesson belongs to |
| order | Number | No | Order position of the lesson in the course |

**Success Response:**
- **Code:** 201 Created
- **Content:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Introduction to JavaScript",
  "videoUrl": "https://example.com/video.mp4",
  "duration": 45,
  "course": "507f1f77bcf86cd799439011",
  "order": 1,
  "createdAt": "2025-10-16T10:30:00.000Z",
  "updatedAt": "2025-10-16T10:30:00.000Z"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
  - Missing required fields
- **Code:** 401 Unauthorized
  - User not authenticated
- **Code:** 403 Forbidden
  - User is not an instructor

---

### 2. Get All Lessons for a Course
Retrieve all lessons belonging to a specific course.

**Endpoint:** `GET /api/lessons/course/:courseId`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| courseId | String | The ID of the course |

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Introduction to JavaScript",
    "videoUrl": "https://example.com/video.mp4",
    "duration": 45,
    "course": "507f1f77bcf86cd799439011",
    "order": 1,
    "createdAt": "2025-10-16T10:30:00.000Z",
    "updatedAt": "2025-10-16T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Variables and Data Types",
    "videoUrl": "https://example.com/video2.mp4",
    "duration": 30,
    "course": "507f1f77bcf86cd799439011",
    "order": 2,
    "createdAt": "2025-10-16T11:00:00.000Z",
    "updatedAt": "2025-10-16T11:00:00.000Z"
  }
]
```

**Error Responses:**
- **Code:** 401 Unauthorized
  - User not authenticated
- **Code:** 404 Not Found
  - Course not found

---

### 3. Get a Single Lesson
Retrieve details of a specific lesson.

**Endpoint:** `GET /api/lessons/:id`

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | The ID of the lesson |

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Introduction to JavaScript",
  "videoUrl": "https://example.com/video.mp4",
  "duration": 45,
  "course": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "JavaScript Fundamentals",
    "description": "Learn the basics of JavaScript"
  },
  "order": 1,
  "createdAt": "2025-10-16T10:30:00.000Z",
  "updatedAt": "2025-10-16T10:30:00.000Z"
}
```

**Error Responses:**
- **Code:** 401 Unauthorized
  - User not authenticated
- **Code:** 404 Not Found
  - Lesson not found

---

### 4. Update a Lesson
Update an existing lesson (instructor only).

**Endpoint:** `PUT /api/lessons/:id`

**Authentication:** Required (Instructor only)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | The ID of the lesson to update |

**Request Body:**
```json
{
  "title": "Advanced JavaScript Concepts",
  "duration": 60,
  "order": 3
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Advanced JavaScript Concepts",
  "videoUrl": "https://example.com/video.mp4",
  "duration": 60,
  "course": "507f1f77bcf86cd799439011",
  "order": 3,
  "createdAt": "2025-10-16T10:30:00.000Z",
  "updatedAt": "2025-10-16T14:45:00.000Z"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
  - Invalid data provided
- **Code:** 401 Unauthorized
  - User not authenticated
- **Code:** 403 Forbidden
  - User is not an instructor
- **Code:** 404 Not Found
  - Lesson not found

---

### 5. Delete a Lesson
Remove a lesson from the system (instructor only).

**Endpoint:** `DELETE /api/lessons/:id`

**Authentication:** Required (Instructor only)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | The ID of the lesson to delete |

**Success Response:**
- **Code:** 200 OK
- **Content:**
```json
{
  "message": "Lesson deleted successfully"
}
```

**Error Responses:**
- **Code:** 401 Unauthorized
  - User not authenticated
- **Code:** 403 Forbidden
  - User is not an instructor
- **Code:** 404 Not Found
  - Lesson not found

---

## Data Model

### Lesson Object
```json
{
  "_id": "ObjectId",
  "title": "String (required)",
  "videoUrl": "String (optional)",
  "duration": "Number (optional, in minutes)",
  "course": "ObjectId (required, references Course)",
  "order": "Number (optional)",
  "createdAt": "Date (auto-generated)",
  "updatedAt": "Date (auto-generated)"
}
```

---

## Common Error Responses

### Authentication Error
```json
{
  "error": "Authentication required"
}
```

### Authorization Error
```json
{
  "error": "Access denied. Instructor privileges required."
}
```

### Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    "Title is required",
    "Course ID is required"
  ]
}
```

### Not Found Error
```json
{
  "error": "Lesson not found"
}
```

---

## Notes
- All timestamps are in ISO 8601 format (UTC)
- The `course` field references the Course model and can be populated with course details
- Lessons are typically ordered by the `order` field when displaying course content
- Video URLs should be valid and accessible links
- Duration is stored in minutes for consistency