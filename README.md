# Task Assignment Board - Full Stack MERN Application

A comprehensive task management system with project management, team collaboration, and Kanban board functionality.

## Project Overview

**Task Assignment Board** is a full-stack MERN application designed to help teams manage projects and tasks efficiently. It features project creation, task assignment, status tracking, and an interactive Kanban board.

### Team Members
- Priyadharshini
- Mahalakshmi
- Balraj
- Kavin
- Tharun G

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Bcryptjs** - Password encryption

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Bootstrap 5** - UI framework
- **Axios** - HTTP client
- **Context API** - State management

## Features

### 1. Authentication
- User registration
- User login
- JWT-based authentication
- Role-based access (admin/member)

### 2. Project Management
- Create projects
- Update project details
- Delete projects
- Assign team members to projects
- View all projects
- View project members

### 3. Task Management
- Create tasks within projects
- Assign tasks to team members
- Set task priority (low, medium, high)
- Set task deadline
- Update task status
- Delete tasks

### 4. Kanban Board
- Visual task tracking
- Three-column layout:
  - **To Do** - New tasks
  - **In Progress** - Active tasks
  - **Completed** - Finished tasks
- Drag and drop support (future)
- Real-time status updates

### 5. Dashboard
- Project statistics
- Task statistics
- Completion metrics
- Recent activity

## Quick Start

### Prerequisites
- Node.js v14+
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_assignment_board
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will open at `http://localhost:3000`

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/member),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Project
```javascript
{
  title: String,
  description: String,
  createdBy: ObjectId (ref: User),
  members: [ObjectId] (ref: User),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Task
```javascript
{
  title: String,
  description: String,
  projectId: ObjectId (ref: Project),
  assignedTo: ObjectId (ref: User),
  status: String (todo/inprogress/completed),
  priority: String (low/medium/high),
  deadline: Date,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)

### Projects (`/api/projects`)
- `POST /` - Create project (protected)
- `GET /` - Get all projects (protected)
- `GET /:id` - Get project by ID (protected)
- `PUT /:id` - Update project (protected)
- `POST /:id/members` - Add member to project (protected)
- `DELETE /:id` - Delete project (protected)

### Tasks (`/api/tasks`)
- `POST /` - Create task (protected)
- `GET /` - Get all tasks (protected)
- `GET /project/:projectId` - Get tasks by project ID (protected)
- `GET /:id` - Get task by ID (protected)
- `PUT /:id` - Update task (protected)
- `PATCH /:id/status` - Update task status (protected)
- `DELETE /:id` - Delete task (protected)

## Frontend Routes

- `/login` - User login
- `/register` - User registration
- `/dashboard` - Dashboard (protected)
- `/projects` - Projects list (protected)
- `/project/:id` - Project detail with Kanban board (protected)

## Project Structure

```
Task Assignment Board/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.js
│   │   │   ├── PrivateRoute.js
│   │   │   └── KanbanBoard.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   └── ProjectDetail.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env
│
├── BACKEND_SETUP.md
├── FRONTEND_SETUP.md
├── POSTMAN_COLLECTION.json
└── README.md
```

## Installation Complete Walkthrough

### Step 1: Clone/Extract Project
```bash
# Your project is already in:
# C:\Users\BALRAJ\Desktop\Task Management
```

### Step 2: MongoDB Setup
Option A - Local MongoDB:
```bash
# Start MongoDB service
mongod
```

Option B - MongoDB Atlas:
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster
- Get connection string
- Update `backend/.env` with connection string

### Step 3: Backend Setup
```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 4: Frontend Setup (new terminal)
```bash
cd frontend
npm install
npm start
```

Frontend will open at `http://localhost:3000`

## Testing with Postman

1. Import `POSTMAN_COLLECTION.json` into Postman
2. Register a test user using Postman
3. Copy the token from login response
4. Add token to Postman collection variables
5. Test all endpoints

## Sample Test Flow

1. **Register User**
   ```
   POST /api/auth/register
   Body: {
     "name": "Priyadharshini",
     "email": "priya@example.com",
     "password": "password123"
   }
   ```

2. **Login User**
   ```
   POST /api/auth/login
   Body: {
     "email": "priya@example.com",
     "password": "password123"
   }
   ```

3. **Create Project**
   ```
   POST /api/projects
   Header: Authorization: Bearer {TOKEN}
   Body: {
     "title": "E-commerce Platform",
     "description": "Build modern e-commerce site"
   }
   ```

4. **Create Task**
   ```
   POST /api/tasks
   Header: Authorization: Bearer {TOKEN}
   Body: {
     "title": "Design Homepage",
     "description": "Create responsive homepage",
     "projectId": "{PROJECT_ID}",
     "priority": "high",
     "deadline": "2026-03-31"
   }
   ```

5. **Update Task Status**
   ```
   PATCH /api/tasks/{TASK_ID}/status
   Header: Authorization: Bearer {TOKEN}
   Body: {
     "status": "inprogress"
   }
   ```

## Security Considerations

- Passwords are hashed with bcryptjs
- JWT tokens have expiration times
- MongoDB credentials should be in .env (not committed)
- All protected routes require valid token
- CORS is enabled for development

## Performance Optimization

- API responses are optimized with field selection
- Pagination can be added for large datasets
- Database indexing on frequently queried fields
- Frontend lazy loading of routes

## Future Enhancements

1. Drag-and-drop Kanban board
2. Task filtering and sorting
3. User notifications
4. Real-time updates with WebSocket
5. File attachments
6. Task comments
7. Team collaboration features
8. Advanced reporting

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in .env
- Verify network access if using Atlas

### CORS Error
- Backend should have CORS enabled
- Check frontend API URL in .env

### Token Expiration
- Login again to get fresh token
- Check JWT_EXPIRE in backend .env

### Build Errors
- Delete node_modules and reinstall
- Clear npm cache: `npm cache clean --force`

## Development Tips

1. Use Thunder Client or Postman for API testing
2. Use React DevTools browser extension
3. Check browser console for errors
4. Check server logs for backend errors
5. Use MongoDB Compass for database visualization

## License

ISC

## Contributors

- Priyadharshini
- Mahalakshmi
- Balraj
- Kavin
- Tharun G

## Support

For issues or questions, refer to the setup guides:
- [Backend Setup Guide](./BACKEND_SETUP.md)
- [Frontend Setup Guide](./FRONTEND_SETUP.md)
- [Postman Collection](./POSTMAN_COLLECTION.json)
