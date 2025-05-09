import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useAuth } from '../context/AuthContext';

const AttendanceForm = () => {
  const { user } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState(user?.subject || '');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchUsn, setSearchUsn] = useState('');
  
  // Load students based on filters
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (section) params.append('section', section);
      if (semester) params.append('semester', semester);
      if (searchUsn) params.append('usn', searchUsn);
      
      const res = await axios.get(`/api/users?${params.toString()}`);
      
      if (res.data.data.length === 0) {
        setError('No students found matching the criteria');
      }
      
      // Initialize attendance records for each student
      const records = res.data.data.map(student => ({
        student: student._id,
        name: student.name,
        usn: student.usn,
        section: student.section,
        semester: student.semester,
        status: 'present' // Default status
      }));
      
      setStudents(res.data.data);
      setAttendanceRecords(records);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students');
      setLoading(false);
    }
  };
  
  // Handle search by USN
  const handleUsnSearch = (e) => {
    e.preventDefault();
    loadStudents();
  };
  
  // Handle status change for a student
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prevRecords => 
      prevRecords.map(record => 
        record.student === studentId ? { ...record, status } : record
      )
    );
  };
  
  // Submit attendance
  const submitAttendance = async () => {
    if (attendanceRecords.length === 0) {
      setError('No students selected for attendance');
      return;
    }
    
    if (!subject) {
      setError('Please select a subject');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      
      // Format records for API
      const records = attendanceRecords.map(({ student, status }) => ({
        student,
        status
      }));
      
      // Submit attendance
      const res = await axios.post('/api/attendance/bulk', {
        date: selectedDate,
        records,
        subject
      });
      
      setSuccess('Attendance marked successfully');
      setSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
      setSubmitting(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mark Attendance
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Date and Subject Selection */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Attendance Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="subject-label">Subject</InputLabel>
            <Select
              labelId="subject-label"
              value={subject}
              label="Subject"
              onChange={(e) => setSubject(e.target.value)}
            >
              <MenuItem value="FullStack">FullStack</MenuItem>
              <MenuItem value="Software Testing">Software Testing</MenuItem>
              <MenuItem value="Telecommunication">Telecommunication</MenuItem>
              <MenuItem value="Data Science">Data Science</MenuItem>
              <MenuItem value="Machine Learning">Machine Learning</MenuItem>
              <MenuItem value="Artificial Intelligence">Artificial Intelligence</MenuItem>
              <MenuItem value="Computer Networks">Computer Networks</MenuItem>
              <MenuItem value="Database Management">Database Management</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="section-label">Section</InputLabel>
            <Select
              labelId="section-label"
              value={section}
              label="Section"
              onChange={(e) => setSection(e.target.value)}
            >
              <MenuItem value="">All Sections</MenuItem>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="semester-label">Semester</InputLabel>
            <Select
              labelId="semester-label"
              value={semester}
              label="Semester"
              onChange={(e) => setSemester(e.target.value)}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <MenuItem key={sem} value={sem}>
                  {sem}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={loadStudents}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load Students'}
          </Button>
        </Grid>
      </Grid>
      
      {/* Search by USN */}
      <Box component="form" onSubmit={handleUsnSearch} sx={{ mb: 3, display: 'flex' }}>
        <TextField
          fullWidth
          label="Search by USN"
          value={searchUsn}
          onChange={(e) => setSearchUsn(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button 
          type="submit" 
          variant="contained"
          disabled={loading}
        >
          Search
        </Button>
      </Box>
      
      {/* Error and Success Messages */}
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
      
      {/* Student List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : attendanceRecords.length > 0 ? (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>USN</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell align="center">Present</TableCell>
                  <TableCell align="center">Absent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.student}>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{record.usn}</TableCell>
                    <TableCell>{record.section}</TableCell>
                    <TableCell>{record.semester}</TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={record.status === 'present'}
                            onChange={() => handleStatusChange(record.student, 'present')}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell align="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={record.status === 'absent'}
                            onChange={() => handleStatusChange(record.student, 'absent')}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={submitAttendance}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </Button>
        </>
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
          No students loaded. Please use the filters and click "Load Students".
        </Typography>
      )}
    </Paper>
  );
};

export default AttendanceForm;