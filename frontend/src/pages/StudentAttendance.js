import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import { format } from 'date-fns';
import { attendanceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StudentAttendance = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [barChartData, setBarChartData] = useState(null);
  const [userChecked, setUserChecked] = useState(false);

  // Debug user object on component mount and updates
  useEffect(() => {
    console.log("StudentAttendance - Component mounted/updated, auth state:", { 
      user, 
      authLoading,
      userId: user?._id, // Changed from user?.id to user?._id
      userRole: user?.role
    });
    
    // Set a flag when we've checked the user object at least once
    if (!userChecked) {
      setUserChecked(true);
    }
  }, [user, authLoading, userChecked]);

  // Fetch data when user is available
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      console.log("StudentAttendance - Auth still loading, waiting...");
      return;
    }
    
    console.log("StudentAttendance - User state ready:", user);
    
    if (user && user._id) { // Changed from user.id to user._id
      console.log("StudentAttendance - User ID available, fetching data:", user._id);
      fetchAttendanceData();
    } else if (userChecked) {
      // Only show error if we've checked the user object at least once
      console.log("StudentAttendance - User ID not available after auth loaded");
      setError('User information not available. Please log in again.');
      setLoading(false);
    }
  }, [user, authLoading, userChecked]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user || !user._id) { // Changed from user.id to user._id
        console.error("StudentAttendance - fetchAttendanceData called but user ID is not available");
        setError('User information not available. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log("StudentAttendance - Making API calls with user ID:", user._id);
      
      let recordsRes, statsRes;
      
      try {
        // Fetch attendance records
        recordsRes = await attendanceAPI.getStudentAttendance(user._id); // Changed from user.id to user._id
        console.log("StudentAttendance - Records response:", recordsRes.data);
        
        // Fetch stats separately to isolate any issues
        statsRes = await attendanceAPI.getStudentStats(user._id); // Changed from user.id to user._id
        console.log("StudentAttendance - Stats response:", statsRes.data);
        
        // Check if the responses contain the expected data structure
        if (!recordsRes.data || !recordsRes.data.data) {
          console.error("StudentAttendance - Invalid records response format:", recordsRes.data);
          setError('Invalid attendance records data format received from server.');
          setLoading(false);
          return;
        }
        
        if (!statsRes.data || !statsRes.data.data) {
          console.error("StudentAttendance - Invalid stats response format:", statsRes.data);
          setError('Invalid attendance stats data format received from server.');
          setLoading(false);
          return;
        }
        
        setAttendanceData(recordsRes.data.data);
        setStats(statsRes.data.data);
      } catch (apiError) {
        console.error("StudentAttendance - API call error:", apiError);
        setError(`Failed to fetch attendance data: ${apiError.message}`);
        setLoading(false);
        return;
      }
      
      // Prepare pie chart data
      try {
        if (statsRes && statsRes.data && statsRes.data.data) {
          const stats = statsRes.data.data;
          setPieChartData({
            labels: ['Present', 'Absent'],
            datasets: [
              {
                data: [stats.presentDays, stats.absentDays],
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
              }
            ]
          });
        }
        
        // Prepare bar chart data (monthly attendance)
        if (recordsRes && recordsRes.data && recordsRes.data.data) {
          const records = recordsRes.data.data;
          if (records && records.length > 0) {
            const monthlyData = {};
            records.forEach(record => {
              try {
                const month = format(new Date(record.date), 'MMM yyyy');
                if (!monthlyData[month]) {
                  monthlyData[month] = { present: 0, absent: 0, total: 0 };
                }
                monthlyData[month][record.status]++;
                monthlyData[month].total++;
              } catch (dateError) {
                console.error("Error processing record date:", record, dateError);
              }
            });
            
            const months = Object.keys(monthlyData).sort((a, b) => {
              return new Date(a) - new Date(b);
            });
            
            if (months.length > 0) {
              const percentages = months.map(month => {
                const present = monthlyData[month].present || 0;
                const total = monthlyData[month].total || 1; // Avoid division by zero
                return (present / total) * 100;
              });
              
              setBarChartData({
                labels: months,
                datasets: [
                  {
                    label: 'Monthly Attendance (%)',
                    data: percentages,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                  }
                ]
              });
            } else {
              console.log("No monthly data available for chart");
              setBarChartData(null);
            }
          } else {
            console.log("No attendance records available for chart");
            setBarChartData(null);
          }
        }
      } catch (chartError) {
        console.error("Error preparing chart data:", chartError);
        // Don't set error state here, just log it to avoid blocking the UI
      }
    } catch (err) {
      setError('Failed to fetch attendance data. Please try again.');
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
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
        My Attendance
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {stats && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Attendance Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body1">
                    Total Days: {stats.totalDays}
                  </Typography>
                  <Typography variant="body1">
                    Present: {stats.presentDays}
                  </Typography>
                  <Typography variant="body1">
                    Absent: {stats.absentDays}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Attendance Percentage:</span>
                      <span>{stats.attendancePercentage.toFixed(2)}%</span>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.attendancePercentage}
                      color={stats.attendancePercentage >= 70 ? 'success' : 'error'}
                      sx={{ mt: 1, height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Chip
                    label={stats.attendancePercentage >= 70 ? 'Eligible for Assessments' : 'Not Eligible for Assessments'}
                    color={stats.attendancePercentage >= 70 ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                {pieChartData && (
                  <Box sx={{ mt: 3, height: 200 }}>
                    <Pie
                      data={pieChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Attendance Trend
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {barChartData ? (
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={barChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: 'Attendance Percentage (%)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Month'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                    No data available for chart
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {stats.eligibility.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Assessment Eligibility
              </Typography>
              <Grid container spacing={3}>
                {stats.eligibility.map((item, index) => (
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
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Your Attendance:</span>
                            <span>{item.attendancePercentage.toFixed(2)}%</span>
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={item.attendancePercentage}
                            color={item.isEligible ? 'success' : 'error'}
                            sx={{ mt: 1, height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Required:</span>
                            <span>{item.threshold}%</span>
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={item.threshold}
                            color="primary"
                            sx={{ mt: 1, height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            mt: 2, 
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
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Records
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {attendanceData.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No attendance records found
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Marked By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceData.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status === 'present' ? 'Present' : 'Absent'}
                            color={record.status === 'present' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{record.markedBy?.name || 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default StudentAttendance;