import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import RefreshIcon from '@mui/icons-material/Refresh';

const ExamEligibility = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  
  // Load eligibility data
  const loadEligibilityData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user || !user._id) {
        setError('User information not available');
        setLoading(false);
        return;
      }
      
      // Get eligibility data
      const res = await axios.get(`https://fs-4mtv.onrender.com/api/exams/eligibility/student/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Eligibility data:', res.data);
      
      // Group by exam
      const eligibilityByExam = {};
      
      res.data.data.forEach(item => {
        const examId = item.exam._id;
        
        if (!eligibilityByExam[examId]) {
          eligibilityByExam[examId] = {
            exam: item.exam,
            subjects: []
          };
        }
        
        eligibilityByExam[examId].subjects.push({
          subject: item.subject,
          isEligible: item.isEligible,
          attendancePercentage: item.attendancePercentage,
          totalClasses: item.totalClasses,
          attendedClasses: item.attendedClasses
        });
      });
      
      setEligibility(Object.values(eligibilityByExam));
      
      // Get upcoming exams
      const today = new Date();
      const examsRes = await axios.get('https://fs-4mtv.onrender.com/api/exams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const upcoming = examsRes.data.data.filter(exam => new Date(exam.date) > today);
      setUpcomingExams(upcoming);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading eligibility data:', err);
      // For now, let's use mock data for testing until the backend is updated
      console.log('Using mock data for testing');
      
      // Create some mock eligibility data
      const mockExams = [
        {
          exam: {
            _id: 'mock1',
            name: 'FullStack Monthly Exam',
            subject: 'FullStack',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 28),
            semester: 1,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            attendanceThreshold: 70
          },
          subjects: [
            {
              subject: 'FullStack',
              isEligible: true,
              attendancePercentage: 85,
              totalClasses: 20,
              attendedClasses: 17
            }
          ]
        },
        {
          exam: {
            _id: 'mock2',
            name: 'Software Testing Monthly Exam',
            subject: 'Software Testing',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 29),
            semester: 1,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            attendanceThreshold: 70
          },
          subjects: [
            {
              subject: 'Software Testing',
              isEligible: false,
              attendancePercentage: 65,
              totalClasses: 20,
              attendedClasses: 13
            }
          ]
        }
      ];
      
      setEligibility(mockExams);
      setUpcomingExams(mockExams.map(item => item.exam));
      setError('Note: Using mock data for testing. The backend is being updated.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadEligibilityData();
  }, [user]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Exam Eligibility
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadEligibilityData}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {eligibility.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No eligibility data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your eligibility status will appear here once it has been calculated.
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="h5" gutterBottom>
            Upcoming Exams
          </Typography>
          
          {upcomingExams.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', mb: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No upcoming exams scheduled
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {upcomingExams.map(exam => {
                // Find eligibility for this exam
                const examEligibility = eligibility.find(e => e.exam._id === exam._id);
                
                return (
                  <Grid item xs={12} md={6} key={exam._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {exam.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {format(new Date(exam.date), 'PPP')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Subject: {exam.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Required Attendance: {exam.attendanceThreshold}%
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        {examEligibility ? (
                          <Box>
                            <Typography variant="subtitle1">
                              Your Eligibility:
                            </Typography>
                            
                            {examEligibility.subjects.map((subject, index) => (
                              <Box key={index} sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body1">
                                    {subject.subject}
                                  </Typography>
                                  <Chip
                                    label={subject.isEligible ? 'Eligible' : 'Not Eligible'}
                                    color={subject.isEligible ? 'success' : 'error'}
                                    size="small"
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Attendance: {subject.attendancePercentage.toFixed(2)}% ({subject.attendedClasses}/{subject.totalClasses} classes)
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                            Eligibility not yet calculated
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
          
          <Typography variant="h5" gutterBottom>
            Past Exams
          </Typography>
          
          <Grid container spacing={3}>
            {eligibility
              .filter(item => new Date(item.exam.date) <= new Date())
              .sort((a, b) => new Date(b.exam.date) - new Date(a.exam.date))
              .map((item, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        {item.exam.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {format(new Date(item.exam.date), 'PPP')}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1">
                        Eligibility Status:
                      </Typography>
                      
                      {item.subjects.map((subject, subIndex) => (
                        <Box key={subIndex} sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">
                              {subject.subject}
                            </Typography>
                            <Chip
                              label={subject.isEligible ? 'Eligible' : 'Not Eligible'}
                              color={subject.isEligible ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Attendance: {subject.attendancePercentage.toFixed(2)}% ({subject.attendedClasses}/{subject.totalClasses} classes)
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default ExamEligibility;