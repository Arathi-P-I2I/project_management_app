# Project Management Dashboard

A full-stack project management application built with React, TypeScript, Node.js, and Prisma. Manage projects, tasks, and team collaboration with a modern, responsive interface.

## 🌐 Live Demo

- **Frontend**: [https://project-management-app-ssgp.onrender.com](https://project-management-app-ssgp.onrender.com)
- **Backend API**: [https://project-management-app-backend-hnsk.onrender.com](https://project-management-app-backend-hnsk.onrender.com)

## ✨ Features

### 🔐 Authentication & User Management
- User registration and login
- JWT-based authentication
- Password reset functionality
- User profile management
- Role-based access control (Admin, Manager, User)

### 📊 Project Management
- Create, edit, and delete projects
- Project status tracking (Active, On Hold, Completed, Cancelled)
- Priority levels (Low, Medium, High, Urgent)
- Budget tracking and management
- Team member assignment
- Project tags and categorization

### ✅ Task Management
- Kanban board view for task organization
- Task status workflow (Todo, In Progress, In Review, Done, Cancelled)
- Priority management
- Due date tracking
- Time estimation
- Task dependencies and subtasks
- File attachments support

### 👥 Team Collaboration
- Assign tasks to team members
- Project role management
- Team member statistics
- Activity tracking

### 📱 Modern UI/UX
- Responsive design for all devices
- Dark/Light theme support
- Intuitive navigation
- Real-time updates
- Mobile-first approach

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **UI Components**: Custom components with accessibility features

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schema validation
- **Logging**: Winston with daily rotation
- **Security**: Helmet, CORS, rate limiting

### Database
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Migrations**: Automated database schema management
- **Seeding**: Sample data population

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run db:seed
```

## 🔐 Test User Credentials

After setting up the database and running the seed script, you can use these test accounts to explore the application:

### **Admin User**
- **Email**: `admin@projectmanagement.com`
- **Password**: `admin123`
- **Role**: Admin (Full access to all features)

### **Manager User**
- **Email**: `manager@projectmanagement.com`
- **Password**: `manager123`
- **Role**: Manager (Can manage projects and assign tasks)

### **Regular User**
- **Email**: `user@projectmanagement.com`
- **Password**: `user123`
- **Role**: User (Can view assigned tasks and projects)

### **Demo Data**
The seed script creates sample projects, tasks, and team members to help you explore the application features immediately after setup.

## 📁 Project Structure

```
ProjectManagement/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   └── prisma/             # Database schema and migrations
└── Docs/                   # Project documentation
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/project_management"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173,https://yourdomain.com"
```

### Frontend (.env)
```env
VITE_API_BASE_URL="http://localhost:3000/api/v1"
VITE_APP_NAME="Project Management Dashboard"
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### Project Endpoints
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Task Endpoints
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

## 🚀 Deployment

### Frontend (Render)
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/dist`
- Environment: Node.js 18+

### Backend (Render)
- Build Command: `cd backend && npm install && npm run build`
- Start Command: `npm start`
- Environment: Node.js 18+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `Docs/` folder
- Review the API endpoints above

---

**Built with ❤️ using modern web technologies**
