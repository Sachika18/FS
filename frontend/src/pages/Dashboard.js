import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usersAPI, attendanceAPI } from '../utils/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, isTeacher, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    upcomingAssessments: []
  });
  const [studentStats, setStudentStats] = useState({
    attendancePercentage: 0,
    eligibility: []
  });
  
  // Debug auth state
  useEffect(() => {
    console.log("Dashboard - Auth state:", { 
      user, 
      isTeacher, 
      authLoading,
      userId: user?._id, // Changed from user?.id to user?._id
      userRole: user?.role
    });
  }, [user, isTeacher, authLoading]);

  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      console.log("Dashboard - Auth still loading, waiting...");
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log("Dashboard - Fetching data, user:", user, "isTeacher:", isTeacher);
        
        if (isTeacher) {
          // Fetch teacher dashboard data
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const formattedDate = format(today, 'yyyy-MM-dd');
          
          console.log('Dashboard - Fetching teacher data for date:', formattedDate);
          
          try {
            const [studentsRes, assessmentsRes, attendanceRes] = await Promise.all([
              usersAPI.getAllStudents(),
              attendanceAPI.getAllAssessments(),
              attendanceAPI.getAllAttendance({ date: formattedDate })
            ]);
            
            console.log('Dashboard - Today\'s attendance data:', attendanceRes.data);
            
            // Count present students for today
            const presentStudents = attendanceRes.data.data.filter(
              record => record.status === 'present'
            ).length;
            
            // Filter upcoming assessments
            const upcomingAssessments = assessmentsRes.data.data.filter(
              assessment => new Date(assessment.date) >= today
            ).slice(0, 3); // Get only the next 3 assessments
            
            setStats({
              totalStudents: studentsRes.data.count,
              todayAttendance: presentStudents,
              upcomingAssessments
            });
          } catch (teacherErr) {
            console.error("Dashboard - Error fetching teacher data:", teacherErr);
            setError('Failed to load teacher dashboard data. Please try again.');
          }
        } else if (user && user._id) {
          // Fetch student dashboard data only if user ID is available
          console.log("Dashboard - Fetching student data for user ID:", user._id);
          
          try {
            const statsRes = await attendanceAPI.getStudentStats(user._id);
            console.log("Dashboard - Student stats received:", statsRes.data);
            
            if (!statsRes.data || !statsRes.data.data) {
              console.error("Dashboard - Invalid student stats format:", statsRes.data);
              setError('Invalid data format received from server.');
            } else {
              setStudentStats({
                attendancePercentage: statsRes.data.data.attendancePercentage,
                eligibility: statsRes.data.data.eligibility || []
              });
            }
          } catch (statsErr) {
            console.error("Dashboard - Error fetching student stats:", statsErr);
            setError('Failed to load student attendance data. Please try again.');
          }
        } else {
          console.log("Dashboard - No user ID available for student dashboard");
          setError('User information not available. Please log in again.');
        }
      } catch (err) {
        console.error('Dashboard - Error fetching dashboard data:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch data if auth is loaded and we have the necessary user info
    if (!authLoading && (isTeacher || (user && user._id))) {
      fetchData();
    } else if (!authLoading) {
      console.log("Dashboard - Auth loaded but no valid user context");
      setLoading(false);
      setError('User information not available. Please log in again.');
    }
  }, [isTeacher, user, authLoading]);
  
  // Function to run the attendance seeder for testing
  const runAttendanceSeeder = async () => {
    try {
      setSeedLoading(true);
      setError('');
      setSuccess('');
      
      // Make a request to run the seeder
      await fetch('https://fs-4mtv.onrender.com/api/dev/seed-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess('Attendance data generated successfully! Please refresh the page to see the changes.');
      setSeedLoading(false);
    } catch (err) {
      console.error('Error running attendance seeder:', err);
      setError('Failed to generate attendance data. Please try again.');
      setSeedLoading(false);
    }
  };
  
  // Function to run the eligibility system setup
  const runEligibilitySetup = async () => {
    try {
      setEligibilityLoading(true);
      setError('');
      setSuccess('');
      
      // Make a request to run the setup
      await fetch('https://fs-4mtv.onrender.com/api/dev/setup-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess('Eligibility system setup completed successfully! Please refresh the page to see the changes.');
      setEligibilityLoading(false);
    } catch (err) {
      console.error('Error running eligibility setup:', err);
      setError('Failed to set up eligibility system. Please try again.');
      setEligibilityLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Welcome back, {user?.name || 'User'}!
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {isTeacher ? (
        // Teacher Dashboard
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'primary.light',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6">
                    Total Students
                  </Typography>
                  <PeopleIcon />
                </Box>
                <Typography component="p" variant="h4" sx={{ mt: 2 }}>
                  {stats.totalStudents}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Registered in the system
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'success.light',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6">
                    Today's Attendance
                  </Typography>
                  <AssignmentIcon />
                </Box>
                <Typography component="p" variant="h4" sx={{ mt: 2 }}>
                  {stats.todayAttendance}/{stats.totalStudents}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Students present today
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'warning.light',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6">
                    Upcoming Assessments
                  </Typography>
                  <AssessmentIcon />
                </Box>
                <Typography component="p" variant="h4" sx={{ mt: 2 }}>
                  {stats.upcomingAssessments.length}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Scheduled assessments
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/attendance/mark')}
                  sx={{ py: 2 }}
                >
                  Mark Attendance
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/students')}
                  sx={{ py: 2 }}
                >
                  Manage Students
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/attendance/report')}
                  sx={{ py: 2 }}
                >
                  View Reports
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate('/assessments/add')}
                  sx={{ py: 2 }}
                >
                  Add Assessment
                </Button>
              </Grid>
              
              {/* These buttons are for testing purposes only */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={runAttendanceSeeder}
                    disabled={seedLoading}
                  >
                    {seedLoading ? 'Generating Test Data...' : 'Generate Test Attendance Data'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={runEligibilitySetup}
                    disabled={eligibilityLoading}
                  >
                    {eligibilityLoading ? 'Setting Up Eligibility System...' : 'Setup Exam Eligibility System'}
                  </Button>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    These buttons are for testing purposes only. They will generate test data for the attendance and eligibility system.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {stats.upcomingAssessments.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Upcoming Assessments
              </Typography>
              <Grid container spacing={3}>
                {stats.upcomingAssessments.map((assessment) => (
                  <Grid item xs={12} sm={6} md={4} key={assessment._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {assessment.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {format(new Date(assessment.date), 'PPP')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Attendance Threshold: {assessment.attendanceThreshold}%
                        </Typography>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button size="small" onClick={() => navigate('/assessments')}>
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      ) : (
        // Student Dashboard
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'primary.light',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6">
                    Overall Attendance
                  </Typography>
                  <AssignmentIcon />
                </Box>
                <Typography component="p" variant="h4" sx={{ mt: 2 }}>
                  {(studentStats.attendancePercentage || 0).toFixed(2)}%
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Your current attendance percentage
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: (studentStats.attendancePercentage || 0) >= 70 ? 'success.light' : 'error.light',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6">
                    Eligibility Status
                  </Typography>
                  <AssessmentIcon />
                </Box>
                <Typography component="p" variant="h4" sx={{ mt: 2 }}>
                  {(studentStats.attendancePercentage || 0) >= 70 ? 'Eligible' : 'Not Eligible'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  For upcoming assessments
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/my-attendance')}
                  sx={{ py: 2 }}
                >
                  View My Attendance
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/student')}
                  sx={{ py: 2 }}
                >
                  View My Profile
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/my-eligibility')}
                  sx={{ py: 2 }}
                >
                  Exam Eligibility
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {studentStats.eligibility.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Assessment Eligibility
              </Typography>
              <Grid container spacing={3}>
                {studentStats.eligibility.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ 
                      bgcolor: item.isEligible ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      border: item.isEligible ? '1px solid #4caf50' : '1px solid #f44336'
                    }}>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {item.assessment.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {format(new Date(item.assessment.date), 'PPP')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your Attendance: {item.attendancePercentage.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Required: {item.threshold}%
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            mt: 1, 
                            fontWeight: 'bold',
                            color: item.isEligible ? 'success.main' : 'error.main'
                          }}
                        >
                          {item.isEligible ? 'Eligible' : 'Not Eligible'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Dashboard;