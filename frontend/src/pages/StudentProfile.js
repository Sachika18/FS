import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../context/AuthContext';
import { usersAPI, attendanceAPI } from '../utils/api';

const StudentProfile = () => {
  const { id } = useParams();
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchUsn, setSearchUsn] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  // Load student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        console.log('Fetching student data, ID:', id, 'User:', user);
        
        // If we have an ID in the URL, use it
        if (id) {
          const res = await usersAPI.getUser(id);
          console.log('Student data from API:', res.data);
          setStudent(res.data.data);
        } 
        // If no ID but user is a student, show their own profile
        else if (user && user.role === 'student') {
          console.log('Using current user data for profile');
          // If we're using the current user, we might want to get the latest data
          if (user._id) {
            try {
              const res = await usersAPI.getUser(user._id);
              setStudent(res.data.data);
            } catch (userErr) {
              console.error('Error fetching updated user data:', userErr);
              // Fallback to using the user from context
              setStudent(user);
            }
          } else {
            setStudent(user);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading student profile:', err);
        setError('Failed to load student profile');
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [id, user]);
  
  // Handle USN search
  const handleUsnSearch = async (e) => {
    e.preventDefault();
    
    if (!searchUsn) {
      setError('Please enter a USN to search');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Searching for student with USN:', searchUsn);
      
      // Use the new API utility function for searching by USN
      const res = await usersAPI.getUserByUSN(searchUsn);
      console.log('Student found by USN:', res.data);
      setStudent(res.data.data);
      setLoading(false);
      
      // Update URL to include student ID for sharing/bookmarking
      navigate(`/student/${res.data.data._id}`);
    } catch (err) {
      console.error('Error searching by USN:', err);
      setError(err.response?.data?.error || 'Student not found');
      setLoading(false);
    }
  };
  
  // Load attendance data for the student
  const loadAttendanceData = async () => {
    if (!student) return;
    
    try {
      setAttendanceLoading(true);
      console.log('Loading attendance data for student:', student._id);
      const res = await attendanceAPI.getStudentStats(student._id);
      console.log('Attendance data received:', res.data);
      
      // Debug subject-wise attendance
      if (res.data && res.data.data && res.data.data.subjectWise) {
        console.log('Subject-wise attendance data:', res.data.data.subjectWise);
        console.log('Number of subjects:', Object.keys(res.data.data.subjectWise).length);
      } else {
        console.warn('No subject-wise attendance data found in response');
      }
      
      setAttendanceData(res.data.data);
      setAttendanceLoading(false);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      setAttendanceLoading(false);
    }
  };
  
  // Load attendance when student data changes
  useEffect(() => {
    if (student) {
      loadAttendanceData();
    }
  }, [student]);
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Search by USN (for teachers only) */}
      {isTeacher && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Student by USN
          </Typography>
          <Box component="form" onSubmit={handleUsnSearch} sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              label="Enter USN"
              value={searchUsn}
              onChange={(e) => setSearchUsn(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained"
              disabled={!searchUsn}
            >
              Search
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      )}
      
      {/* Student Profile */}
      {student ? (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Student Profile
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {student.name}
                </Typography>
                
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
                  Email
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {student.email}
                </Typography>
                
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
                  USN
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {student.usn || 'Not specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Section
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {student.section || 'Not specified'}
                </Typography>
                
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
                  Semester
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {student.semester || 'Not specified'}
                </Typography>
                
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
                  Role
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {student.role === 'student' ? 'Student' : 'Teacher'}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Additional information card */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'primary.50', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Account Created
                      </Typography>
                      <Typography variant="body1">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Not available'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ bgcolor: 'primary.50', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Account ID
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                        {student._id}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Paper>
          
          {/* Attendance Summary */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5">
                Attendance Summary
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadAttendanceData}
                disabled={attendanceLoading}
              >
                Refresh
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {attendanceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : attendanceData ? (
              <>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Total Days
                        </Typography>
                        <Typography variant="h4">
                          {attendanceData.totalDays}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Present Days
                        </Typography>
                        <Typography variant="h4">
                          {attendanceData.presentDays}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Attendance %
                        </Typography>
                        <Typography variant="h4">
                          {attendanceData.attendancePercentage.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Subject-wise Attendance */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Subject-wise Attendance
                  </Typography>
                  
                  {attendanceData && attendanceData.subjectWise && Object.keys(attendanceData.subjectWise).length > 0 ? (
                    <Grid container spacing={2}>
                      {Object.entries(attendanceData.subjectWise).map(([subject, data]) => (
                        <Grid item xs={12} sm={6} md={4} key={subject}>
                          <Card sx={{ 
                            bgcolor: data.percentage >= 75 ? 'rgba(76, 175, 80, 0.1)' : data.percentage >= 60 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            border: `1px solid ${data.percentage >= 75 ? '#4caf50' : data.percentage >= 60 ? '#ff9800' : '#f44336'}`
                          }}>
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {subject}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2">
                                  Present: {data.present}
                                </Typography>
                                <Typography variant="body2">
                                  Total: {data.total}
                                </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold', color: data.percentage >= 75 ? '#4caf50' : data.percentage >= 60 ? '#ff9800' : '#f44336' }}>
                                {data.percentage.toFixed(2)}%
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                      <Typography variant="body1" color="text.secondary">
                        No subject-wise attendance data available.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This could be because no attendance has been marked yet, or because the attendance records don't have subject information.
                      </Typography>
                    </Paper>
                  )}
                </Box>
                
                {/* Assessment Eligibility */}
                {attendanceData.eligibility && attendanceData.eligibility.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Assessment Eligibility
                    </Typography>
                    <List>
                      {attendanceData.eligibility.map((item, index) => (
                        <ListItem key={index} divider>
                          <ListItemText
                            primary={item.assessment.name}
                            secondary={`Date: ${new Date(item.assessment.date).toLocaleDateString()} | Attendance: ${item.attendancePercentage.toFixed(2)}% | Required: ${item.threshold}%`}
                          />
                          <Typography 
                            variant="body1" 
                            color={item.isEligible ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {item.isEligible ? 'Eligible' : 'Not Eligible'}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  No attendance data available for this student.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Attendance records will appear here once they are marked by teachers.
                </Typography>
                {isTeacher && (
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/attendance/mark')}
                  >
                    Mark Attendance
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </>
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5">
            {error || 'No student selected. Please search for a student using their USN.'}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default StudentProfile;