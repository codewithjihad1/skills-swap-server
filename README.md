# Skills Swap API Server

A robust REST API for the Skills Swap marketplace application built with Node.js, Express.js, and MongoDB.

## 🚀 Features

-   **Complete CRUD Operations** for Users and Skills
-   **Advanced Error Handling** with proper HTTP status codes
-   **Input Validation** with detailed error messages
-   **Pagination Support** for large datasets
-   **Search and Filtering** capabilities
-   **Soft Delete** functionality
-   **Database Relationship Management** (Users ↔ Skills)
-   **Health Check** endpoint for monitoring
-   **Graceful Shutdown** handling

## 📋 Prerequisites

-   Node.js (v16 or higher)
-   MongoDB (local or cloud instance)
-   npm or yarn package manager

## 🛠️ Installation

1. Clone the repository
2. Install dependencies:
    ```bash
    npm install
    ```
3. Copy environment variables:
    ```bash
    cp .env.example .env
    ```
4. Update `.env` file with your configuration
5. Start the server:

    ```bash
    # Development mode with auto-reload
    npm run dev

    # Production mode
    npm start
    ```

## 📚 API Endpoints

### Server Info

-   `GET /` - Server information and available endpoints
-   `GET /health` - Health check endpoint

### Users API (`/api/users`)

-   `POST /api/users` - Create a new user
-   `GET /api/users` - Get all users (paginated)
-   `GET /api/users/:id` - Get user by ID
-   `PUT /api/users/:id` - Update user
-   `DELETE /api/users/:id` - Soft delete user
-   `GET /api/users/:userId/skills` - Get user's skills

### Skills API (`/api/skills`)

-   `POST /api/skills` - Create a new skill
-   `GET /api/skills` - Get all skills (paginated, filterable)
-   `GET /api/skills/:id` - Get skill by ID
-   `PUT /api/skills/:id` - Update skill
-   `DELETE /api/skills/:id` - Soft delete skill

### Utility API

-   `GET /api/categories` - Get available skill categories
-   `GET /api/proficiency-levels` - Get proficiency levels

## 📝 Request Examples

### Create User

```json
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "bio": "Full-stack developer passionate about learning new technologies"
}
```

### Create Skill

```json
POST /api/skills
{
  "title": "React Development",
  "description": "Expert in building modern React applications with hooks and context",
  "category": "Technology",
  "proficiency": "Expert",
  "tags": ["React", "JavaScript", "Frontend"],
  "userId": "user_id_here"
}
```

### Query Parameters

-   **Pagination**: `?page=1&limit=10`
-   **Search**: `?search=react`
-   **Filter**: `?category=Technology&proficiency=Expert`

## 🔧 Environment Variables

| Variable      | Description               | Default               |
| ------------- | ------------------------- | --------------------- |
| `PORT`        | Server port               | 5000                  |
| `NODE_ENV`    | Environment               | development           |
| `MONGODB_URI` | MongoDB connection string | Required              |
| `CLIENT_URL`  | Frontend URL for CORS     | http://localhost:3000 |

## 📊 Data Models

### User Schema

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String,
  avatar: String,
  skills: [ObjectId],
  bio: String,
  isActive: Boolean,
  timestamps: true
}
```

### Skill Schema

```javascript
{
  title: String (required),
  description: String (required),
  category: String (enum),
  proficiency: String (enum),
  tags: [String],
  userId: ObjectId (required),
  isActive: Boolean,
  timestamps: true
}
```

## 🧪 Testing

Test the API using tools like:

-   **Postman** - Import the API collection
-   **Thunder Client** - VS Code extension
-   **curl** - Command line testing

## 🛡️ Error Handling

The API returns consistent error responses:

```json
{
    "error": "Error message",
    "details": ["Validation error details"]
}
```

Common HTTP status codes:

-   `200` - Success
-   `201` - Created
-   `400` - Bad Request
-   `404` - Not Found
-   `409` - Conflict
-   `500` - Internal Server Error

## 🔄 Development

-   Use `npm run dev` for development with auto-reload
-   The server logs all requests for debugging
-   Database connection status is logged on startup

## 📦 Dependencies

-   **express** - Web framework
-   **mongoose** - MongoDB ODM
-   **cors** - Cross-origin resource sharing
-   **dotenv** - Environment variables
-   **nodemon** - Development auto-reload

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
