# Course API Documentation for Frontend Developers

## Base URL

```
http://localhost:5000/api/courses
```

## Table of Contents

1. [Get All Courses](#1-get-all-courses)
2. [Get Single Course](#2-get-single-course)
3. [Get Courses by Instructor](#3-get-courses-by-instructor)
4. [Create Course](#4-create-course)
5. [Update Course](#5-update-course)
6. [Publish/Unpublish Course](#6-publishunpublish-course)
7. [Delete Course](#7-delete-course)
8. [Frontend Integration Examples](#frontend-integration-examples)

---

## 1. Get All Courses

**Endpoint:** `GET /api/courses`  
**Access:** Public  
**Description:** Fetch all published courses with filtering, pagination, and search capabilities.

### Query Parameters

| Parameter  | Type   | Default   | Description                                                 |
| ---------- | ------ | --------- | ----------------------------------------------------------- |
| `page`     | number | 1         | Current page number                                         |
| `limit`    | number | 10        | Number of courses per page                                  |
| `category` | string | -         | Filter by category (e.g., "Web Development")                |
| `level`    | string | -         | Filter by level: `beginner`, `intermediate`, `advanced`     |
| `search`   | string | -         | Full-text search on title and description                   |
| `sortBy`   | string | createdAt | Sort field: `createdAt`, `title`, `price`, `rating.average` |
| `order`    | string | desc      | Sort order: `asc` or `desc`                                 |

### Request Example

```javascript
// Using fetch
const response = await fetch(
    "http://localhost:5000/api/courses?page=1&limit=10&category=Web Development&level=beginner&sortBy=createdAt&order=desc"
);
const data = await response.json();
```

```javascript
// Using axios
import axios from "axios";

const getCourses = async (filters) => {
    const { page, limit, category, level, search, sortBy, order } = filters;

    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (category) params.append("category", category);
    if (level) params.append("level", level);
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    const response = await axios.get(`/api/courses?${params.toString()}`);
    return response.data;
};
```

### Response

```json
{
    "success": true,
    "count": 10,
    "totalCourses": 45,
    "currentPage": 1,
    "totalPages": 5,
    "courses": [
        {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
            "title": "Complete Web Development Bootcamp",
            "description": "Learn web development from scratch...",
            "instructor": {
                "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
                "name": "John Doe",
                "email": "john@example.com",
                "avatar": "https://example.com/avatar.jpg"
            },
            "category": "Web Development",
            "level": "beginner",
            "duration": 40,
            "thumbnail": "https://example.com/course-thumb.jpg",
            "price": 49.99,
            "currency": "USD",
            "tags": ["html", "css", "javascript"],
            "published": true,
            "enrollmentCount": 150,
            "rating": {
                "average": 4.5,
                "count": 75
            },
            "language": "English",
            "createdAt": "2024-09-04T10:30:00.000Z",
            "lastUpdated": "2024-09-15T14:20:00.000Z"
        }
    ]
}
```

---

## 2. Get Single Course

**Endpoint:** `GET /api/courses/:id`  
**Access:** Public  
**Description:** Get detailed information about a single course by ID.

### URL Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `id`      | string | Yes      | Course ID (MongoDB ObjectId) |

### Request Example

```javascript
// Using fetch
const getCourseById = async (courseId) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}`
    );
    const data = await response.json();
    return data;
};
```

```javascript
// Using axios
import axios from "axios";

const getCourseDetails = async (courseId) => {
    const response = await axios.get(`/api/courses/${courseId}`);
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "course": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Complete Web Development Bootcamp",
        "description": "Learn web development from scratch with hands-on projects...",
        "instructor": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar": "https://example.com/avatar.jpg",
            "bio": "Senior web developer with 10 years of experience..."
        },
        "category": "Web Development",
        "level": "beginner",
        "duration": 40,
        "thumbnail": "https://example.com/course-thumb.jpg",
        "price": 49.99,
        "currency": "USD",
        "tags": ["html", "css", "javascript", "react"],
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
        ],
        "prerequisites": ["Basic computer knowledge", "Willingness to learn"],
        "learningOutcomes": [
            "Build responsive websites",
            "Understand JavaScript fundamentals",
            "Deploy web applications"
        ],
        "published": true,
        "enrollmentCount": 150,
        "rating": {
            "average": 4.5,
            "count": 75
        },
        "language": "English",
        "createdAt": "2024-09-04T10:30:00.000Z",
        "publishedAt": "2024-09-05T09:00:00.000Z",
        "lastUpdated": "2024-09-15T14:20:00.000Z"
    }
}
```

### Response (Error - Not Found)

```json
{
    "error": "Course not found"
}
```

### Response (Error - Unpublished)

```json
{
    "error": "This course is not published yet"
}
```

---

## 3. Get Courses by Instructor

**Endpoint:** `GET /api/courses/instructor/:id`  
**Access:** Public  
**Description:** Get all courses created by a specific instructor.

### URL Parameters

| Parameter | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| `id`      | string | Yes      | Instructor ID (User ID) |

### Query Parameters

| Parameter            | Type    | Default | Description                                                  |
| -------------------- | ------- | ------- | ------------------------------------------------------------ |
| `includeUnpublished` | boolean | false   | Include unpublished courses (for instructor's own dashboard) |

### Request Example

```javascript
// Get published courses by instructor
const getInstructorCourses = async (instructorId) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/instructor/${instructorId}`
    );
    return await response.json();
};

// Get all courses including unpublished (for instructor dashboard)
const getMyAllCourses = async (instructorId) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/instructor/${instructorId}?includeUnpublished=true`
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const fetchInstructorCourses = async (
    instructorId,
    includeUnpublished = false
) => {
    const response = await axios.get(
        `/api/courses/instructor/${instructorId}`,
        { params: { includeUnpublished } }
    );
    return response.data;
};
```

### Response

```json
{
    "success": true,
    "count": 5,
    "courses": [
        {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
            "title": "Complete Web Development Bootcamp",
            "description": "Learn web development from scratch...",
            "instructor": {
                "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
                "name": "John Doe",
                "email": "john@example.com",
                "avatar": "https://example.com/avatar.jpg"
            },
            "category": "Web Development",
            "level": "beginner",
            "published": true,
            "enrollmentCount": 150,
            "rating": {
                "average": 4.5,
                "count": 75
            },
            "createdAt": "2024-09-04T10:30:00.000Z"
        }
    ]
}
```

---

## 4. Create Course

**Endpoint:** `POST /api/courses`  
**Access:** Private (Instructor only)  
**Description:** Create a new course. Requires authentication.

### Request Headers

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN"  // Add when auth is implemented
}
```

### Request Body

```json
{
    "title": "Complete Web Development Bootcamp",
    "description": "Learn web development from scratch with hands-on projects and real-world examples.",
    "instructor": "64f5a1b2c3d4e5f6a7b8c9d1",
    "category": "Web Development",
    "level": "beginner",
    "duration": 40,
    "thumbnail": "https://example.com/course-thumb.jpg",
    "price": 49.99,
    "currency": "USD",
    "tags": ["html", "css", "javascript", "react"],
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
    ],
    "prerequisites": ["Basic computer knowledge", "Willingness to learn"],
    "learningOutcomes": [
        "Build responsive websites",
        "Understand JavaScript fundamentals",
        "Deploy web applications"
    ],
    "language": "English"
}
```

### Required Fields

-   `title` (string, max 200 chars)
-   `description` (string)
-   `instructor` (string - User ID)
-   `category` (string)
-   `duration` (number - in hours)

### Request Example

```javascript
// Using fetch
const createCourse = async (courseData) => {
    const response = await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // 'Authorization': `Bearer ${token}`,  // Add when auth is implemented
        },
        body: JSON.stringify(courseData),
    });
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const createNewCourse = async (courseData) => {
    const response = await axios.post("/api/courses", courseData, {
        headers: {
            // 'Authorization': `Bearer ${token}`,  // Add when auth is implemented
        },
    });
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Course created successfully",
    "course": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Complete Web Development Bootcamp",
        "description": "Learn web development from scratch...",
        "instructor": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar": "https://example.com/avatar.jpg"
        },
        "category": "Web Development",
        "level": "beginner",
        "duration": 40,
        "published": false,
        "enrollmentCount": 0,
        "createdAt": "2024-09-04T10:30:00.000Z"
    }
}
```

### Response (Error)

```json
{
    "error": "Title, description, instructor, category, and duration are required"
}
```

---

## 5. Update Course

**Endpoint:** `PUT /api/courses/:id`  
**Access:** Private (Instructor only - must be course owner)  
**Description:** Update course details. Only the course instructor can update.

### URL Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| `id`      | string | Yes      | Course ID to update |

### Request Headers

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN"  // Add when auth is implemented
}
```

### Request Body

You can send any fields from the course model to update. Example:

```json
{
    "title": "Updated Course Title",
    "description": "Updated description",
    "price": 59.99,
    "level": "intermediate",
    "tags": ["html", "css", "javascript", "react", "nodejs"],
    "syllabus": [
        {
            "week": 1,
            "title": "Updated Module",
            "topics": ["Topic 1", "Topic 2"],
            "duration": 10
        }
    ]
}
```

### Protected Fields

These fields **cannot** be updated directly:

-   `enrollmentCount`
-   `rating`
-   `createdAt`

### Request Example

```javascript
// Using fetch
const updateCourse = async (courseId, updates) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                // 'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const updateCourseDetails = async (courseId, updates) => {
    const response = await axios.put(`/api/courses/${courseId}`, updates);
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Course updated successfully",
    "course": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Updated Course Title",
        "description": "Updated description",
        // ... rest of course data
        "lastUpdated": "2024-09-15T14:20:00.000Z"
    }
}
```

### Response (Error - Not Found)

```json
{
    "error": "Course not found"
}
```

---

## 6. Publish/Unpublish Course

**Endpoint:** `PATCH /api/courses/:id/publish`  
**Access:** Private (Instructor/Admin only)  
**Description:** Toggle course publish status. Course must have syllabus and learning outcomes to be published.

### URL Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | Course ID   |

### Request Body

```json
{
    "published": true
}
```

or

```json
{
    "published": false
}
```

### Request Example

```javascript
// Publish course
const publishCourse = async (courseId) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/publish`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                // 'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ published: true }),
        }
    );
    return await response.json();
};

// Unpublish course
const unpublishCourse = async (courseId) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/publish`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ published: false }),
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const toggleCoursePublish = async (courseId, publishStatus) => {
    const response = await axios.patch(`/api/courses/${courseId}/publish`, {
        published: publishStatus,
    });
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Course published successfully",
    "course": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Complete Web Development Bootcamp",
        "published": true,
        "publishedAt": "2024-09-05T09:00:00.000Z"
        // ... rest of course data
    }
}
```

### Response (Error - Missing Requirements)

```json
{
    "error": "Cannot publish course without syllabus"
}
```

or

```json
{
    "error": "Cannot publish course without learning outcomes"
}
```

---

## 7. Delete Course

**Endpoint:** `DELETE /api/courses/:id`  
**Access:** Private (Instructor/Admin only)  
**Description:** Delete a course. Cannot delete courses with active enrollments.

### URL Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| `id`      | string | Yes      | Course ID to delete |

### Request Example

```javascript
// Using fetch
const deleteCourse = async (courseId) => {
    const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}`,
        {
            method: "DELETE",
            headers: {
                // 'Authorization': `Bearer ${token}`,
            },
        }
    );
    return await response.json();
};
```

```javascript
// Using axios
import axios from "axios";

const removeCourse = async (courseId) => {
    const response = await axios.delete(`/api/courses/${courseId}`);
    return response.data;
};
```

### Response (Success)

```json
{
    "success": true,
    "message": "Course deleted successfully"
}
```

### Response (Error - Has Enrollments)

```json
{
    "error": "Cannot delete course with active enrollments",
    "enrollmentCount": 150
}
```

### Response (Error - Not Found)

```json
{
    "error": "Course not found"
}
```

---

## Frontend Integration Examples

### React + Axios Example

```javascript
// api/courseService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/courses";

// Create axios instance
const courseAPI = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests (implement when auth is ready)
courseAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const courseService = {
    // Get all courses with filters
    getAllCourses: async (filters = {}) => {
        const response = await courseAPI.get("/", { params: filters });
        return response.data;
    },

    // Get single course
    getCourseById: async (courseId) => {
        const response = await courseAPI.get(`/${courseId}`);
        return response.data;
    },

    // Get courses by instructor
    getInstructorCourses: async (instructorId, includeUnpublished = false) => {
        const response = await courseAPI.get(`/instructor/${instructorId}`, {
            params: { includeUnpublished },
        });
        return response.data;
    },

    // Create new course
    createCourse: async (courseData) => {
        const response = await courseAPI.post("/", courseData);
        return response.data;
    },

    // Update course
    updateCourse: async (courseId, updates) => {
        const response = await courseAPI.put(`/${courseId}`, updates);
        return response.data;
    },

    // Publish/unpublish course
    togglePublish: async (courseId, publishStatus) => {
        const response = await courseAPI.patch(`/${courseId}/publish`, {
            published: publishStatus,
        });
        return response.data;
    },

    // Delete course
    deleteCourse: async (courseId) => {
        const response = await courseAPI.delete(`/${courseId}`);
        return response.data;
    },
};
```

### React Component Example

```jsx
// components/CourseList.jsx
import { useState, useEffect } from "react";
import { courseService } from "../api/courseService";

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 12,
        category: "",
        level: "",
        search: "",
    });

    useEffect(() => {
        fetchCourses();
    }, [filters]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await courseService.getAllCourses(filters);
            setCourses(data.courses);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (searchTerm) => {
        setFilters({ ...filters, search: searchTerm, page: 1 });
    };

    const handleFilterChange = (filterName, value) => {
        setFilters({ ...filters, [filterName]: value, page: 1 });
    };

    if (loading) return <div>Loading courses...</div>;

    return (
        <div className="course-list">
            {/* Search and filters */}
            <input
                type="text"
                placeholder="Search courses..."
                onChange={(e) => handleSearch(e.target.value)}
            />

            <select
                onChange={(e) => handleFilterChange("category", e.target.value)}
            >
                <option value="">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                {/* Add more categories */}
            </select>

            <select
                onChange={(e) => handleFilterChange("level", e.target.value)}
            >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
            </select>

            {/* Course grid */}
            <div className="courses-grid">
                {courses.map((course) => (
                    <div key={course._id} className="course-card">
                        <img src={course.thumbnail} alt={course.title} />
                        <h3>{course.title}</h3>
                        <p>{course.description.substring(0, 100)}...</p>
                        <div className="course-meta">
                            <span>Level: {course.level}</span>
                            <span>Duration: {course.duration}h</span>
                            <span>Rating: {course.rating.average} ⭐</span>
                        </div>
                        <div className="course-footer">
                            <span className="price">${course.price}</span>
                            <button>View Details</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseList;
```

### React Hook (Custom) Example

```jsx
// hooks/useCourses.js
import { useState, useEffect } from "react";
import { courseService } from "../api/courseService";

export const useCourses = (filters = {}) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCourses: 0,
    });

    useEffect(() => {
        fetchCourses();
    }, [JSON.stringify(filters)]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await courseService.getAllCourses(filters);
            setCourses(data.courses);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                totalCourses: data.totalCourses,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { courses, loading, error, pagination, refetch: fetchCourses };
};

// Usage in component:
// const { courses, loading, error, pagination } = useCourses({
//   page: 1,
//   limit: 10,
//   category: 'Web Development'
// });
```

### Next.js Example with TanStack Query

```jsx
// lib/api/courses.ts
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "http://localhost:5000/api/courses";

// Get all courses
export const useGetCourses = (filters = {}) => {
    return useQuery({
        queryKey: ["courses", filters],
        queryFn: async () => {
            const { data } = await axios.get(API_BASE_URL, { params: filters });
            return data;
        },
    });
};

// Get single course
export const useGetCourse = (courseId) => {
    return useQuery({
        queryKey: ["course", courseId],
        queryFn: async () => {
            const { data } = await axios.get(`/${courseId}`);
            return data;
        },
        enabled: !!courseId,
    });
};

// Create course
export const useCreateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (courseData) => {
            const { data } = await axios.post(API_BASE_URL, courseData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
};

// Update course
export const useUpdateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ courseId, updates }) => {
            const { data } = await axios.put(`/${courseId}`, updates);
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            queryClient.invalidateQueries({
                queryKey: ["course", variables.courseId],
            });
        },
    });
};

// Delete course
export const useDeleteCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (courseId) => {
            const { data } = await axios.delete(`/${courseId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
        },
    });
};

// Usage in component:
// const { data, isLoading } = useGetCourses({ page: 1, limit: 10 });
// const createMutation = useCreateCourse();
// createMutation.mutate(courseData);
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
    "error": "Error message here",
    "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

-   `200` - Success (GET, PUT, PATCH)
-   `201` - Created (POST)
-   `400` - Bad Request (validation errors)
-   `403` - Forbidden (authorization issues)
-   `404` - Not Found
-   `500` - Internal Server Error

### Example Error Handling

```javascript
try {
    const data = await courseService.getCourseById(courseId);
    // Handle success
} catch (error) {
    if (error.response) {
        // Server responded with error
        const { status, data } = error.response;

        switch (status) {
            case 404:
                console.error("Course not found");
                break;
            case 403:
                console.error("Access denied");
                break;
            case 400:
                console.error("Invalid request:", data.error);
                break;
            default:
                console.error("Server error:", data.error);
        }
    } else if (error.request) {
        // Request made but no response
        console.error("Network error");
    } else {
        // Other errors
        console.error("Error:", error.message);
    }
}
```

---

## Course Schema Reference

### Course Object Structure

```typescript
interface Course {
    _id: string;
    title: string; // Max 200 characters
    description: string;
    instructor: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        bio?: string;
    };
    category: string;
    level: "beginner" | "intermediate" | "advanced";
    duration: number; // In hours, min: 1
    thumbnail?: string; // URL
    price: number; // Default: 0, min: 0
    currency: string; // Default: 'USD'
    tags: string[];
    syllabus: Array<{
        week: number;
        title: string;
        topics: string[];
        duration: number; // In hours
    }>;
    prerequisites: string[];
    learningOutcomes: string[];
    published: boolean; // Default: false
    publishedAt?: Date;
    enrollmentCount: number; // Default: 0
    rating: {
        average: number; // Min: 0, max: 5
        count: number;
    };
    language: string; // Default: 'English'
    createdAt: Date;
    lastUpdated: Date;
}
```

---

## Testing the API

### Using cURL

```bash
# Get all courses
curl http://localhost:5000/api/courses

# Get single course
curl http://localhost:5000/api/courses/64f5a1b2c3d4e5f6a7b8c9d0

# Create course
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "Test description",
    "instructor": "64f5a1b2c3d4e5f6a7b8c9d1",
    "category": "Web Development",
    "duration": 10
  }'

# Update course
curl -X PUT http://localhost:5000/api/courses/64f5a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Publish course
curl -X PATCH http://localhost:5000/api/courses/64f5a1b2c3d4e5f6a7b8c9d0/publish \
  -H "Content-Type: application/json" \
  -d '{"published": true}'

# Delete course
curl -X DELETE http://localhost:5000/api/courses/64f5a1b2c3d4e5f6a7b8c9d0
```

### Using Postman

1. Import the following collection or create requests manually
2. Set base URL: `http://localhost:5000/api/courses`
3. Test each endpoint with sample data

---

## Notes

1. **Authentication**: Authorization checks are not yet fully implemented. TODO comments are in the controller for where auth middleware should be added.

2. **Pagination**: Always use pagination for the GET /api/courses endpoint to avoid performance issues.

3. **Search**: Full-text search requires the text indexes to be created on the Course model (already configured).

4. **Publishing**: Courses must have syllabus and learningOutcomes before they can be published.

5. **Deletion**: Courses with enrollments cannot be deleted.

6. **Rate Limiting**: Consider implementing rate limiting on the frontend for API calls.

---

## Support

For issues or questions, contact the backend team or create an issue in the project repository.

**Last Updated:** October 15, 2025  
**API Version:** 1.0.0
