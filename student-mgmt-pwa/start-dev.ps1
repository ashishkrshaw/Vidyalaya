# Student Management System - Development Startup Script
# This script starts both the backend and frontend servers

Write-Host "🚀 Starting Student Management System..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([int]$Port, [string]$ServiceName)
    Write-Host "⏳ Waiting for $ServiceName to be ready on port $Port..." -ForegroundColor Yellow
    $attempts = 0
    $maxAttempts = 30
    
    while ($attempts -lt $maxAttempts) {
        if (Test-Port -Port $Port) {
            Write-Host "✅ $ServiceName is ready!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        $attempts++
    }
    
    Write-Host "❌ $ServiceName failed to start within timeout" -ForegroundColor Red
    return $false
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if MySQL is running (port 3306)
if (Test-Port -Port 3306) {
    Write-Host "✅ MySQL is running on port 3306" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: MySQL might not be running on port 3306" -ForegroundColor Yellow
    Write-Host "   Make sure MySQL is started and the database 'student_management' exists" -ForegroundColor Yellow
}

# Navigate to project directory
Set-Location $PSScriptRoot

# Install backend dependencies if node_modules doesn't exist
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
    Set-Location "backend"
    npm install
    Set-Location ..
}

# Install frontend dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    npm install
}

# Start backend server
Write-Host "🔧 Starting backend server..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    Set-Location "backend"
    npm run dev
}

# Wait for backend to be ready
if (Wait-ForService -Port 3001 -ServiceName "Backend") {
    Write-Host "✅ Backend server is running on http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

# Start frontend server
Write-Host "🎨 Starting frontend server..." -ForegroundColor Blue
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    npm run dev
}

# Wait for frontend to be ready
if (Wait-ForService -Port 5173 -ServiceName "Frontend") {
    Write-Host "✅ Frontend server is running on http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend failed to start" -ForegroundColor Red
    Stop-Job $frontendJob
    Remove-Job $frontendJob
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

Write-Host ""
Write-Host "🎉 Student Management System is now running!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

# Keep the script running and handle cleanup
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "❌ One of the servers has stopped unexpectedly" -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host ""
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    
    # Stop and remove jobs
    if ($backendJob) {
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
    }
    
    if ($frontendJob) {
        Stop-Job $frontendJob -ErrorAction SilentlyContinue
        Remove-Job $frontendJob -ErrorAction SilentlyContinue
    }
    
    Write-Host "✅ All servers stopped" -ForegroundColor Green
} 