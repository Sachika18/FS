import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Search as SearchIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { usersAPI, attendanceAPI } from '../utils/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentStats, setStudentStats] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await usersAPI.getAllStudents();
      setStudents(res.data.data);
    } catch (err) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      setAttendanceData([]);
      setStudentStats(null);
      setChartData(null);
      
      // Validate inputs
      if (!selectedStudent) {
        setError('Please select a student');
        setLoading(false);
        return;
      }
      
      // Fetch attendance data
      const res = await attendanceAPI.getStudentAttendance(selectedStudent);
      let filteredData = res.data.data;
      
      // Filter by date range if provided
      if (startDate && endDate) {
        filteredData = filteredData.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= startDate && recordDate <= endDate;
        });
      }
      
      setAttendanceData(filteredData);
      
      // Calculate statistics
      if (filteredData.length > 0) {
        const totalDays = filteredData.length;
        const presentDays = filteredData.filter(record => record.status === 'present').length;
        const absentDays = totalDays - presentDays;
        const attendancePercentage = (presentDays / totalDays) * 100;
        
        setStudentStats({
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage
        });
        
        // Prepare chart data
        // Group by month
        const monthlyData = {};
        filteredData.forEach(record => {
          const month = format(new Date(record.date), 'MMM yyyy');
          if (!monthlyData[month]) {
            monthlyData[month] = { present: 0, absent: 0 };
          }
          monthlyData[month][record.status]++;
        });
        
        const months = Object.keys(monthlyData);
        const presentCounts = months.map(month => monthlyData[month].present);
        const absentCounts = months.map(month => monthlyData[month].absent);
        
        setChartData({
          labels: months,
          datasets: [
            {
              label: 'Present',
              data: presentCounts,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Absent',
              data: absentCounts,
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        });
      }
    } catch (err) {
      setError('Failed to fetch attendance data. Please try again.');
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleExportCSV = () => {
    if (attendanceData.length === 0) return;
    
    // Find the selected student name
    const student = students.find(s => s._id === selectedStudent);
    const studentName = student ? student.name : 'Student';
    
    // Create CSV content
    const headers = ['Date', 'Status', 'Marked By'];
    const rows = attendanceData.map(record => [
      format(new Date(record.date), 'yyyy-MM-dd'),
      record.status,
      record.markedBy?.name || 'Unknown'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${studentName}_attendance_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Reports
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Select Student"
              value={selectedStudent}
              onChange={handleStudentChange}
            >
              {students.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {student.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                slotProps={{ textField: { fullWidth: true } }}
                maxDate={endDate || new Date()}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={startDate}
                maxDate={new Date()}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={fetchAttendanceData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : studentStats && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body1">
                    Total Days: {studentStats.totalDays}
                  </Typography>
                  <Typography variant="body1">
                    Present: {studentStats.presentDays}
                  </Typography>
                  <Typography variant="body1">
                    Absent: {studentStats.absentDays}
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Attendance: {studentStats.attendancePercentage.toFixed(2)}%
                  </Typography>
                  <Chip
                    label={studentStats.attendancePercentage >= 70 ? 'Eligible' : 'Not Eligible'}
                    color={studentStats.attendancePercentage >= 70 ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Attendance Trend
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={attendanceData.length === 0}
                  >
                    Export CSV
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {chartData ? (
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Days'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Month'
                            }
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
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Records
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {attendanceData.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No attendance records found for the selected criteria
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

export default AttendanceReport;