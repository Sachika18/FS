# Attendance Management System

A full-stack application for managing student attendance with React, Node.js (Express), and MongoDB.

## Features

### User Roles

#### Admin/Teacher:
- Secure login
- Add/edit/delete students
- Mark attendance efficiently via checkbox list
- View student-wise attendance reports
- Create and manage assessments

#### Student:
- Secure login
- View personal attendance records
- Check eligibility status for internal assessments

### Internal Assessment Logic
- 3 internal assessments in a 4-month semester
- Students need at least 70% attendance to be eligible for each assessment
- Automatic eligibility calculation

## Tech Stack

### Frontend
- React
- React Router for navigation
- Material UI for UI components
- Chart.js for data visualization
- Axios for API requests

### Backend
- Node.js with Express
- JWT for authentication
- MongoDB with Mongoose

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/attendance-system
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

4. The application will be available at `http://localhost:3000`

## Usage

### Initial Setup
1. Register as a teacher
2. Add students to the system
3. Create assessments with dates and attendance thresholds

### Daily Attendance
1. Log in as a teacher
2. Navigate to "Mark Attendance"
3. Select the date and mark students as present or absent
4. Save the attendance

### Viewing Reports
1. Log in as a teacher
2. Navigate to "Attendance Reports"
3. Select a student and date range to view detailed reports

### Student View
1. Log in as a student
2. View your attendance percentage and eligibility status
3. Check detailed attendance records

## License
MIT