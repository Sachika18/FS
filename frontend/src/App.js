import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './context/AuthContext';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import StudentForm from './pages/StudentForm';
import AttendanceMarking from './pages/AttendanceMarking';
import AttendanceReport from './pages/AttendanceReport';
import StudentAttendance from './pages/StudentAttendance';
import AssessmentList from './pages/AssessmentList';
import AssessmentForm from './pages/AssessmentForm';
import StudentProfile from './pages/StudentProfile';
import TeacherProfile from './pages/TeacherProfile';
import ExamManagement from './pages/ExamManagement';
import ExamEligibility from './pages/ExamEligibility';
import NotFound from './pages/NotFound';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const { user } = useAuth();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route path="login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          {/* Private Routes */}
          <Route path="/" element={<PrivateRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Teacher Routes */}
            <Route path="students" element={<StudentList />} />
            <Route path="students/add" element={<StudentForm />} />
            <Route path="students/edit/:id" element={<StudentForm />} />
            <Route path="attendance/mark" element={<AttendanceMarking />} />
            <Route path="attendance/report" element={<AttendanceReport />} />
            <Route path="assessments" element={<AssessmentList />} />
            <Route path="assessments/add" element={<AssessmentForm />} />
            <Route path="exams" element={<ExamManagement />} />
            <Route path="teacher/profile" element={<TeacherProfile />} />
            
            {/* Student Routes */}
            <Route path="my-attendance" element={<StudentAttendance />} />
            <Route path="my-eligibility" element={<ExamEligibility />} />
            <Route path="student/:id" element={<StudentProfile />} />
            <Route path="student" element={<StudentProfile />} />
            
            {/* Default Route */}
            <Route index element={<Navigate to="/dashboard" />} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;