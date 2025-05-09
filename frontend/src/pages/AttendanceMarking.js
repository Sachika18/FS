import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Typography,
  Box,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { usersAPI, attendanceAPI } from '../utils/api';

const AttendanceMarking = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  console.log('Auth state:', { user, isAuthenticated, hasToken: !!token });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedDate && attendanceData.length > 0) {
      console.log('Selected date changed, fetching attendance...');
      fetchAttendanceForDate();
    }
  }, [selectedDate, attendanceData.length]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching students...');
      const res = await usersAPI.getAllStudents();
      console.log('API Response:', res);
      
      if (res.data && res.data.data) {
        console.log('Students data:', res.data.data);
        setStudents(res.data.data);
        
        // Initialize attendance data
        const initialAttendance = res.data.data.map(student => ({
          student: student._id,
          name: student.name,
          email: student.email,
          status: 'present' // Default to present
        }));
        
        console.log('Initial attendance data:', initialAttendance);
        setAttendanceData(initialAttendance);
      } else {
        console.error('Invalid response format:', res);
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error fetching students:', err.response?.data || err.message || err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async () => {
    try {
      setFetchingAttendance(true);
      setError('');
      
      console.log('Fetching attendance for date:', selectedDate);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Formatted date:', formattedDate);
      
      const res = await attendanceAPI.getAllAttendance({ date: formattedDate });
      console.log('Attendance API response:', res);
      
      // Create a map of student IDs to their attendance status
      const attendanceMap = {};
      if (res.data && res.data.data) {
        res.data.data.forEach(record => {
          attendanceMap[record.student._id] = record.status;
        });
      }
      console.log('Attendance map:', attendanceMap);
      
      // Update attendance data with existing records
      console.log('Current attendance data before update:', attendanceData);
      const updatedAttendance = attendanceData.map(item => ({
        ...item,
        status: attendanceMap[item.student] || 'present'
      }));
      console.log('Updated attendance data:', updatedAttendance);
      
      setAttendanceData(updatedAttendance);
    } catch (err) {
      setError('Failed to fetch attendance records. Please try again.');
      console.error('Error fetching attendance:', err.response?.data || err.message || err);
    } finally {
      setFetchingAttendance(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData(
      attendanceData.map(item =>
        item.student === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleToggleAll = (status) => {
    setAttendanceData(
      attendanceData.map(item => ({ ...item, status }))
    );
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      setError('');
      setSuccess('');
      
      // Validate that we have a subject
      if (!user.subject) {
        setError('Subject is required to mark attendance. Please update your profile.');
        setSavingAttendance(false);
        return;
      }
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Prepare data for bulk update
      const records = attendanceData.map(item => ({
        student: item.student,
        status: item.status,
        subject: user.subject // Use the teacher's subject
      }));
      
      console.log('Marking attendance with subject:', user.subject);
      
      await attendanceAPI.markBulkAttendance({
        date: formattedDate,
        records,
        subject: user.subject
      });
      
      setSuccess('Attendance saved successfully');
    } catch (err) {
      setError('Failed to save attendance. Please try again.');
      console.error('Error saving attendance:', err);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleRefresh = () => {
    fetchAttendanceForDate();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter students based on search term
  const filteredAttendanceData = searchTerm.trim() === ''
    ? attendanceData
    : attendanceData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
  // Debug information
  console.log('Attendance Data:', attendanceData);
  console.log('Filtered Attendance Data:', filteredAttendanceData);
  console.log('Search Term:', searchTerm);
  console.log('Loading:', loading);
  console.log('Fetching Attendance:', fetchingAttendance);

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
        Mark Attendance
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
                maxDate={new Date()}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Students"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name or email"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleToggleAll('present')}
                startIcon={<PresentIcon />}
              >
                Mark All Present
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleToggleAll('absent')}
                startIcon={<AbsentIcon />}
              >
                Mark All Absent
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Attendance for {format(selectedDate, 'PPPP')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Attendance Data">
            <span>
              <IconButton onClick={handleRefresh} disabled={fetchingAttendance}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveAttendance}
            disabled={savingAttendance}
          >
            {savingAttendance ? 'Saving...' : 'Save Attendance'}
          </Button>
        </Box>
      </Box>
      
      {fetchingAttendance ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredAttendanceData.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            {searchTerm ? 'No students match your search criteria.' : 'No students found.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Debug info: Students: {students.length}, Attendance Data: {attendanceData.length}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {filteredAttendanceData.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.student}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    border: '1px solid',
                    borderColor: item.status === 'present' ? 'success.light' : 'error.light',
                    bgcolor: item.status === 'present' ? 'success.50' : 'error.50'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {item.name}
                    </Typography>
                    <Chip
                      label={item.status === 'present' ? 'Present' : 'Absent'}
                      color={item.status === 'present' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.email}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                    <Button
                      variant={item.status === 'present' ? 'contained' : 'outlined'}
                      color="success"
                      size="small"
                      onClick={() => handleStatusChange(item.student, 'present')}
                      startIcon={<PresentIcon />}
                    >
                      Present
                    </Button>
                    <Button
                      variant={item.status === 'absent' ? 'contained' : 'outlined'}
                      color="error"
                      size="small"
                      onClick={() => handleStatusChange(item.student, 'absent')}
                      startIcon={<AbsentIcon />}
                    >
                      Absent
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceMarking;