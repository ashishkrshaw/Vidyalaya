# 🚀 Quick Start Guide - Student Management System

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MySQL** (v8.0 or higher)
3. **Git** (for cloning the repository)

## Database Setup

1. **Start MySQL Server**
   ```bash
   # Windows (if installed as service)
   net start mysql
   
   # Or start MySQL manually
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE student_management;
   ```

## 🎯 Quick Start (Recommended)

### Option 1: Automated Startup (Windows)
```bash
# Double-click the batch file or run:
start-dev.bat
```

### Option 2: PowerShell Script
```powershell
# Run the PowerShell script directly:
.\start-dev.ps1
```

### Option 3: Manual Startup

#### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
```

#### Step 2: Start Frontend (in new terminal)
```bash
# In project root
npm install
npm run dev
```

## 🔧 Manual Commands

### Backend Commands
```bash
# Navigate to backend
cd student-mgmt-pwa/backend

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Initialize database
npm run init-db
```

### Frontend Commands
```bash
# Navigate to project root
cd student-mgmt-pwa

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔐 Default Super Admin

The system creates a default super admin account:
- **Username**: `superadmin`
- **Password**: `admin123`

## 📁 Project Structure

```
student-mgmt-pwa/
├── backend/                 # Backend server
│   ├── config/             # Database configuration
│   ├── middleware/         # Authentication & security
│   ├── routes/            # API endpoints
│   └── server.js          # Main server file
├── src/                   # Frontend React app
│   ├── components/        # React components
│   └── config.ts         # API configuration
├── start-dev.ps1         # PowerShell startup script
└── start-dev.bat         # Batch startup script
```

## 🔧 Configuration

### Backend Environment (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_management
JWT_SECRET=your-secret-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration
The frontend automatically connects to `http://localhost:3001/api` by default.

## 🚨 Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   ```bash
   # Find and kill the process
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

2. **Port 5173 already in use**
   ```bash
   # Find and kill the process
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

3. **MySQL Connection Error**
   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database exists

4. **Node modules not found**
   ```bash
   # Reinstall dependencies
   npm install
   ```

5. **Permission denied (PowerShell)**
   ```powershell
   # Run as administrator or set execution policy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## 📊 Health Check

Visit http://localhost:3001/api/health to verify:
- ✅ Backend server status
- ✅ Database connection
- ✅ Local storage directory
- ✅ System configuration

## 🔒 Security Features

- JWT token authentication
- CORS protection
- Rate limiting
- SQL injection protection
- Session management
- Device binding

## 📱 PWA Features

- Offline capability
- Install as app
- Push notifications (future)
- Background sync

## 🆘 Support

If you encounter issues:
1. Check the console logs
2. Verify all prerequisites
3. Ensure ports are available
4. Check database connectivity 