# Lesson API - Frontend Developer Guide

## Base URL

```
http://localhost:5000/api/lessons
```

Production: `https://your-domain.com/api/lessons`

---

## Quick Start

### Authentication

All lesson endpoints require authentication. Include the JWT token in your requests:

```javascript
// Using axios
const config = {
    headers: {
        Authorization: `Bearer ${token}`,
    },
};

// Using fetch
const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
};
```

---

## API Endpoints

### 📚 Table of Contents

1. [Create Lesson](#1-create-lesson)
2. [Get Course Lessons](#2-get-course-lessons)
3. [Get Single Lesson](#3-get-single-lesson)
4. [Update Lesson](#4-update-lesson)
5. [Delete Lesson](#5-delete-lesson)
6. [Toggle Publish Status](#6-toggle-publish-status)

---

## 1. Create Lesson

Create a new lesson for a course.

**Endpoint:** `POST /api/lessons`

**Permission:** Instructor only

### Request Example

```javascript
// Using axios
import axios from "axios";

const createLesson = async (lessonData) => {
    try {
        const response = await axios.post(
            "http://localhost:5000/api/lessons",
            {
                title: "Introduction to React Hooks",
                description: "Learn the fundamentals of React Hooks",
                content:
                    "# React Hooks\n\nHooks are functions that let you use state...",
                videoUrl: "https://youtube.com/watch?v=xyz123",
                duration: 45,
                courseId: "507f1f77bcf86cd799439011",
                order: 1,
                isPublished: false,
                resources: [
                    {
                        title: "React Hooks Cheat Sheet",
                        url: "https://example.com/hooks-cheat-sheet.pdf",
                        type: "pdf",
                    },
                ],
                prerequisites: [],
                learningObjectives: [
                    "Understand useState hook",
                    "Master useEffect hook",
                    "Create custom hooks",
                ],
                tags: ["react", "hooks", "javascript"],
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Lesson created:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating lesson:", error.response?.data);
        throw error;
    }
};
```

### Request Body

```typescript
interface CreateLessonRequest {
    title: string; // Required, max 200 chars
    description?: string; // Optional, max 1000 chars
    content: string; // Required, supports Markdown
    videoUrl?: string; // Optional
    duration?: number; // Optional, in minutes
    courseId: string; // Required
    order: number; // Required, must be unique per course
    isPublished?: boolean; // Optional, default: false
    resources?: Array<{
        title: string;
        url: string;
        type: "pdf" | "document" | "image" | "code" | "other";
    }>;
    prerequisites?: string[]; // Optional, array of lesson IDs
    learningObjectives?: string[]; // Optional
    tags?: string[]; // Optional
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Lesson created successfully",
    "lesson": {
        "_id": "64f8a9b2c3d4e5f6a7b8c9d0",
        "title": "Introduction to React Hooks",
        "description": "Learn the fundamentals of React Hooks",
        "content": "# React Hooks\n\nHooks are functions...",
        "videoUrl": "https://youtube.com/watch?v=xyz123",
        "duration": 45,
        "course": "507f1f77bcf86cd799439011",
        "instructor": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar": "https://example.com/avatar.jpg"
        },
        "order": 1,
        "isPublished": false,
        "resources": [
            {
                "title": "React Hooks Cheat Sheet",
                "url": "https://example.com/hooks-cheat-sheet.pdf",
                "type": "pdf"
            }
        ],
        "prerequisites": [],
        "learningObjectives": [
            "Understand useState hook",
            "Master useEffect hook",
            "Create custom hooks"
        ],
        "tags": ["react", "hooks", "javascript"],
        "createdAt": "2025-10-22T10:30:00.000Z",
        "updatedAt": "2025-10-22T10:30:00.000Z"
    }
}
```

### Error Responses

```javascript
// 400 - Missing required fields
{
  "success": false,
  "error": "Title, content, courseId, and order are required"
}

// 400 - Duplicate order
{
  "success": false,
  "error": "A lesson already exists at order position 1 in this course"
}

// 404 - Course not found
{
  "success": false,
  "error": "Course not found"
}
```

---

## 2. Get Course Lessons

Retrieve all lessons for a specific course.

**Endpoint:** `GET /api/lessons/course/:courseId`

**Permission:** Authenticated users

### Request Example

```javascript
// Using axios
const getCourseLessons = async (courseId, options = {}) => {
    try {
        const { publishedOnly = false, includeContent = false } = options;

        const response = await axios.get(
            `http://localhost:5000/api/lessons/course/${courseId}`,
            {
                params: {
                    publishedOnly: publishedOnly.toString(),
                    includeContent: includeContent.toString(),
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Lessons:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching lessons:", error.response?.data);
        throw error;
    }
};

// Usage examples
getCourseLessons("507f1f77bcf86cd799439011");
getCourseLessons("507f1f77bcf86cd799439011", { publishedOnly: true });
getCourseLessons("507f1f77bcf86cd799439011", { includeContent: true });
```

### Query Parameters

| Parameter      | Type   | Default | Description                                  |
| -------------- | ------ | ------- | -------------------------------------------- |
| publishedOnly  | string | "false" | Set to "true" to get only published lessons  |
| includeContent | string | "false" | Set to "true" to include full lesson content |

### Success Response (200 OK)

```json
{
    "success": true,
    "course": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "React Fundamentals",
        "description": "Master React from scratch"
    },
    "lessons": [
        {
            "_id": "64f8a9b2c3d4e5f6a7b8c9d0",
            "title": "Introduction to React Hooks",
            "description": "Learn the fundamentals of React Hooks",
            "videoUrl": "https://youtube.com/watch?v=xyz123",
            "duration": 45,
            "order": 1,
            "isPublished": true,
            "instructor": {
                "_id": "507f1f77bcf86cd799439012",
                "name": "John Doe",
                "email": "john@example.com"
            },
            "resources": [
                {
                    "title": "React Hooks Cheat Sheet",
                    "url": "https://example.com/hooks-cheat-sheet.pdf",
                    "type": "pdf"
                }
            ],
            "prerequisites": [],
            "learningObjectives": ["Understand useState hook"],
            "tags": ["react", "hooks"],
            "createdAt": "2025-10-22T10:30:00.000Z",
            "updatedAt": "2025-10-22T10:30:00.000Z"
        }
    ],
    "counts": {
        "total": 10,
        "published": 8,
        "draft": 2
    }
}
```

### React Component Example

```jsx
import { useState, useEffect } from "react";
import axios from "axios";

const CourseLessons = ({ courseId }) => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:5000/api/lessons/course/${courseId}`,
                    {
                        params: { publishedOnly: "true" },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );
                setLessons(response.data.lessons);
            } catch (err) {
                setError(
                    err.response?.data?.error || "Failed to fetch lessons"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, [courseId]);

    if (loading) return <div>Loading lessons...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Course Lessons</h2>
            {lessons.map((lesson) => (
                <div key={lesson._id}>
                    <h3>
                        {lesson.order}. {lesson.title}
                    </h3>
                    <p>{lesson.description}</p>
                    <span>{lesson.duration} minutes</span>
                </div>
            ))}
        </div>
    );
};
```

---

## 3. Get Single Lesson

Retrieve complete details of a specific lesson.

**Endpoint:** `GET /api/lessons/:id`

**Permission:** Authenticated users

### Request Example

```javascript
// Using axios
const getLesson = async (lessonId) => {
    try {
        const response = await axios.get(
            `http://localhost:5000/api/lessons/${lessonId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Lesson:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching lesson:", error.response?.data);
        throw error;
    }
};
```

### Success Response (200 OK)

```json
{
    "success": true,
    "lesson": {
        "_id": "64f8a9b2c3d4e5f6a7b8c9d0",
        "title": "Introduction to React Hooks",
        "description": "Learn the fundamentals of React Hooks",
        "content": "# React Hooks\n\nFull markdown content here...",
        "videoUrl": "https://youtube.com/watch?v=xyz123",
        "duration": 45,
        "order": 1,
        "isPublished": true,
        "course": {
            "_id": "507f1f77bcf86cd799439011",
            "title": "React Fundamentals",
            "description": "Master React from scratch",
            "category": "Programming",
            "level": "Beginner"
        },
        "instructor": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "John Doe",
            "email": "john@example.com",
            "avatar": "https://example.com/avatar.jpg"
        },
        "resources": [
            {
                "title": "React Hooks Cheat Sheet",
                "url": "https://example.com/hooks-cheat-sheet.pdf",
                "type": "pdf"
            }
        ],
        "prerequisites": [
            {
                "_id": "64f8a9b2c3d4e5f6a7b8c9cf",
                "title": "JavaScript Basics",
                "order": 1
            }
        ],
        "learningObjectives": [
            "Understand useState hook",
            "Master useEffect hook",
            "Create custom hooks"
        ],
        "tags": ["react", "hooks", "javascript"],
        "createdAt": "2025-10-22T10:30:00.000Z",
        "updatedAt": "2025-10-22T10:30:00.000Z"
    }
}
```

---

## 4. Update Lesson

Update an existing lesson.

**Endpoint:** `PUT /api/lessons/:id`

**Permission:** Instructor only

### Request Example

```javascript
// Using axios
const updateLesson = async (lessonId, updates) => {
    try {
        const response = await axios.put(
            `http://localhost:5000/api/lessons/${lessonId}`,
            updates,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Lesson updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error updating lesson:", error.response?.data);
        throw error;
    }
};

// Usage example - update only specific fields
updateLesson("64f8a9b2c3d4e5f6a7b8c9d0", {
    title: "Advanced React Hooks",
    duration: 60,
    isPublished: true,
});
```

### Request Body (All fields optional)

```typescript
interface UpdateLessonRequest {
    title?: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: number;
    order?: number;
    isPublished?: boolean;
    resources?: Array<{
        title: string;
        url: string;
        type: "pdf" | "document" | "image" | "code" | "other";
    }>;
    prerequisites?: string[];
    learningObjectives?: string[];
    tags?: string[];
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Lesson updated successfully",
    "lesson": {
        "_id": "64f8a9b2c3d4e5f6a7b8c9d0",
        "title": "Advanced React Hooks",
        "duration": 60,
        "isPublished": true
        // ... other fields
    }
}
```

---

## 5. Delete Lesson

Delete a lesson from the system.

**Endpoint:** `DELETE /api/lessons/:id`

**Permission:** Instructor only

### Request Example

```javascript
// Using axios
const deleteLesson = async (lessonId) => {
    try {
        const response = await axios.delete(
            `http://localhost:5000/api/lessons/${lessonId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Lesson deleted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error deleting lesson:", error.response?.data);
        throw error;
    }
};
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Lesson deleted successfully",
    "deletedLesson": {
        "_id": "64f8a9b2c3d4e5f6a7b8c9d0",
        "title": "Introduction to React Hooks",
        "course": "507f1f77bcf86cd799439011"
    }
}
```

**Note:** Deleting a lesson will:

-   Remove it from the course's lessons array
-   Remove it from other lessons' prerequisites
-   Permanently delete the lesson document

---

## 6. Toggle Publish Status

Publish or unpublish a lesson.

**Endpoint:** `PATCH /api/lessons/:id/publish`

**Permission:** Instructor only

### Request Example

```javascript
// Using axios
const togglePublishLesson = async (lessonId) => {
    try {
        const response = await axios.patch(
            `http://localhost:5000/api/lessons/${lessonId}/publish`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Lesson publish status toggled:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error toggling publish status:", error.response?.data);
        throw error;
    }
};
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Lesson published successfully",
    "lesson": {
        "_id": "64f8a9b2c3d4e5f6a7b8c9d0",
        "title": "Introduction to React Hooks",
        "isPublished": true
        // ... other fields
    }
}
```

---

## TypeScript Interfaces

```typescript
// Lesson Types
interface Resource {
    title: string;
    url: string;
    type: "pdf" | "document" | "image" | "code" | "other";
}

interface Instructor {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    category?: string;
    level?: string;
}

interface Lesson {
    _id: string;
    title: string;
    description?: string;
    content: string;
    videoUrl?: string;
    duration: number;
    order: number;
    course: string | Course;
    instructor: string | Instructor;
    isPublished: boolean;
    resources: Resource[];
    prerequisites: string[] | Lesson[];
    learningObjectives: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

// API Response Types
interface ApiResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

interface LessonResponse extends ApiResponse<Lesson> {
    lesson: Lesson;
}

interface LessonsResponse extends ApiResponse<Lesson[]> {
    course: {
        _id: string;
        title: string;
        description: string;
    };
    lessons: Lesson[];
    counts: {
        total: number;
        published: number;
        draft: number;
    };
}
```

---

## Custom React Hooks

### useLessons Hook

```typescript
import { useState, useEffect } from "react";
import axios from "axios";

interface UseLessonsOptions {
    publishedOnly?: boolean;
    includeContent?: boolean;
}

export const useLessons = (
    courseId: string,
    options: UseLessonsOptions = {}
) => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `http://localhost:5000/api/lessons/course/${courseId}`,
                    {
                        params: {
                            publishedOnly:
                                options.publishedOnly?.toString() || "false",
                            includeContent:
                                options.includeContent?.toString() || "false",
                        },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );
                setLessons(response.data.lessons);
                setError(null);
            } catch (err: any) {
                setError(
                    err.response?.data?.error || "Failed to fetch lessons"
                );
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchLessons();
        }
    }, [courseId, options.publishedOnly, options.includeContent]);

    return { lessons, loading, error };
};
```

### useLesson Hook

```typescript
export const useLesson = (lessonId: string) => {
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `http://localhost:5000/api/lessons/${lessonId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );
                setLesson(response.data.lesson);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.error || "Failed to fetch lesson");
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    return { lesson, loading, error };
};
```

---

## API Service Class

```typescript
// services/lessonService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/lessons";

class LessonService {
    private getHeaders() {
        return {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
        };
    }

    async createLesson(data: CreateLessonRequest): Promise<LessonResponse> {
        const response = await axios.post(API_BASE_URL, data, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async getCourseLessons(
        courseId: string,
        publishedOnly = false,
        includeContent = false
    ): Promise<LessonsResponse> {
        const response = await axios.get(`${API_BASE_URL}/course/${courseId}`, {
            params: {
                publishedOnly: publishedOnly.toString(),
                includeContent: includeContent.toString(),
            },
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async getLesson(lessonId: string): Promise<LessonResponse> {
        const response = await axios.get(`${API_BASE_URL}/${lessonId}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async updateLesson(
        lessonId: string,
        data: UpdateLessonRequest
    ): Promise<LessonResponse> {
        const response = await axios.put(`${API_BASE_URL}/${lessonId}`, data, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async deleteLesson(lessonId: string): Promise<ApiResponse<any>> {
        const response = await axios.delete(`${API_BASE_URL}/${lessonId}`, {
            headers: this.getHeaders(),
        });
        return response.data;
    }

    async togglePublish(lessonId: string): Promise<LessonResponse> {
        const response = await axios.patch(
            `${API_BASE_URL}/${lessonId}/publish`,
            {},
            {
                headers: this.getHeaders(),
            }
        );
        return response.data;
    }
}

export default new LessonService();
```

### Usage Example

```typescript
import lessonService from "@/services/lessonService";

// Create lesson
const newLesson = await lessonService.createLesson({
    title: "React Hooks",
    content: "...",
    courseId: "123",
    order: 1,
});

// Get course lessons
const { lessons } = await lessonService.getCourseLessons("123", true);

// Update lesson
await lessonService.updateLesson("456", { title: "Updated Title" });

// Delete lesson
await lessonService.deleteLesson("456");
```

---

## Error Handling

### Common Error Codes

```javascript
const handleLessonError = (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    switch (status) {
        case 400:
            // Validation error or duplicate order
            console.error("Validation error:", message);
            alert(message);
            break;
        case 401:
            // Not authenticated
            console.error("Authentication required");
            // Redirect to login
            window.location.href = "/login";
            break;
        case 403:
            // Not authorized (not an instructor)
            console.error("Access denied");
            alert("You must be an instructor to perform this action");
            break;
        case 404:
            // Lesson or course not found
            console.error("Resource not found:", message);
            alert(message);
            break;
        case 500:
            // Server error
            console.error("Server error");
            alert("Something went wrong. Please try again later.");
            break;
        default:
            console.error("Unknown error:", error);
    }
};
```

---

## Best Practices

### 1. Lesson Ordering

Always ensure unique order numbers per course:

```javascript
// Get existing lessons to determine next order
const getNextOrder = async (courseId) => {
    const response = await axios.get(
        `http://localhost:5000/api/lessons/course/${courseId}`
    );
    const lessons = response.data.lessons;
    const maxOrder = Math.max(...lessons.map((l) => l.order), 0);
    return maxOrder + 1;
};

// Use it when creating a lesson
const order = await getNextOrder(courseId);
createLesson({ ...lessonData, order });
```

### 2. Optimistic Updates

```javascript
const updateLesson = async (lessonId, updates) => {
    // Optimistic update
    setLessons((prev) =>
        prev.map((lesson) =>
            lesson._id === lessonId ? { ...lesson, ...updates } : lesson
        )
    );

    try {
        await lessonService.updateLesson(lessonId, updates);
    } catch (error) {
        // Revert on error
        fetchLessons();
        handleError(error);
    }
};
```

### 3. Debounced Search

```javascript
import { debounce } from "lodash";

const searchLessons = debounce(async (query) => {
    const lessons = await lessonService.getCourseLessons(courseId);
    const filtered = lessons.lessons.filter((lesson) =>
        lesson.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredLessons(filtered);
}, 300);
```

### 4. Caching with React Query

```javascript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useLessons = (courseId) => {
    return useQuery({
        queryKey: ["lessons", courseId],
        queryFn: () => lessonService.getCourseLessons(courseId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCreateLesson = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: lessonService.createLesson,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["lessons"] });
        },
    });
};
```

---

## Complete Example: Lesson Manager Component

```jsx
import React, { useState } from "react";
import { useLessons } from "@/hooks/useLessons";
import lessonService from "@/services/lessonService";

const LessonManager = ({ courseId }) => {
    const { lessons, loading, error } = useLessons(courseId);
    const [selectedLesson, setSelectedLesson] = useState(null);

    const handlePublishToggle = async (lessonId) => {
        try {
            const result = await lessonService.togglePublish(lessonId);
            // Refresh lessons or update state
            alert(result.message);
        } catch (error) {
            console.error("Error toggling publish:", error);
        }
    };

    const handleDelete = async (lessonId) => {
        if (window.confirm("Are you sure you want to delete this lesson?")) {
            try {
                await lessonService.deleteLesson(lessonId);
                // Refresh lessons
            } catch (error) {
                console.error("Error deleting lesson:", error);
            }
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="lesson-manager">
            <h2>Lessons</h2>
            <div className="lesson-list">
                {lessons.map((lesson) => (
                    <div key={lesson._id} className="lesson-item">
                        <h3>
                            {lesson.order}. {lesson.title}
                        </h3>
                        <p>{lesson.description}</p>
                        <div className="lesson-actions">
                            <button onClick={() => setSelectedLesson(lesson)}>
                                Edit
                            </button>
                            <button
                                onClick={() => handlePublishToggle(lesson._id)}
                            >
                                {lesson.isPublished ? "Unpublish" : "Publish"}
                            </button>
                            <button onClick={() => handleDelete(lesson._id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LessonManager;
```

---

## Testing

### Jest Test Example

```javascript
import lessonService from "@/services/lessonService";
import axios from "axios";

jest.mock("axios");

describe("LessonService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a lesson", async () => {
        const mockLesson = {
            title: "Test Lesson",
            content: "Content",
            courseId: "123",
            order: 1,
        };

        const mockResponse = {
            data: {
                success: true,
                lesson: { ...mockLesson, _id: "456" },
            },
        };

        axios.post.mockResolvedValue(mockResponse);

        const result = await lessonService.createLesson(mockLesson);

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining("/api/lessons"),
            mockLesson,
            expect.any(Object)
        );
        expect(result.success).toBe(true);
        expect(result.lesson._id).toBe("456");
    });
});
```

---

## Rate Limiting & Performance

### Recommendations

1. **Implement request throttling** for rapid updates
2. **Use pagination** for large lesson lists (future enhancement)
3. **Cache lesson data** using React Query or SWR
4. **Lazy load video content** to improve performance
5. **Debounce search** inputs (300ms recommended)

---

## Support & Contact

For API issues or questions:

-   **Backend Developer:** Check server logs
-   **Documentation:** See full API docs in `/docs/LESSON_API_DOCUMENTATION.md`
-   **Issue Tracker:** Report bugs via GitHub Issues

---

## Changelog

**Version 1.0.0** - October 22, 2025

-   Initial API release
-   All 6 endpoints implemented
-   Complete TypeScript support
-   React hooks and service examples

---

**Happy Coding! 🚀**
