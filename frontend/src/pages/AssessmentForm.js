import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Slider,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { attendanceAPI } from '../utils/api';

const AssessmentForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    date: null,
    attendanceThreshold: 70,
    startDate: null,
    endDate: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleDateChange = (field, date) => {
    setFormData({
      ...formData,
      [field]: date
    });
  };
  
  const handleThresholdChange = (event, newValue) => {
    setFormData({
      ...formData,
      attendanceThreshold: newValue
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.name || !formData.date || !formData.startDate || !formData.endDate) {
      setError('All fields are required');
      return;
    }
    
    if (formData.startDate > formData.date || formData.endDate < formData.startDate) {
      setError('Invalid date range. Start date should be before assessment date, and end date should be after start date.');
      return;
    }
    
    try {
      setLoading(true);
      
      await attendanceAPI.createAssessment(formData);
      
      setSuccess('Assessment created successfully');
      setFormData({
        name: '',
        date: null,
        attendanceThreshold: 70,
        startDate: null,
        endDate: null
      });
      
      // Navigate back to assessment list after a short delay
      setTimeout(() => {
        navigate('/assessments');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assessment. Please try again.');
      console.error('Error creating assessment:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/assessments');
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Add Assessment
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
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
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assessment Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Internal Assessment 1"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Assessment Date"
                  value={formData.date}
                  onChange={(date) => handleDateChange('date', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date (for attendance calculation)"
                  value={formData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  maxDate={formData.date}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date (for attendance calculation)"
                  value={formData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                  minDate={formData.startDate}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Attendance Threshold (%)
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={formData.attendanceThreshold}
                  onChange={handleThresholdChange}
                  aria-labelledby="attendance-threshold-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                />
              </Box>
              <TextField
                fullWidth
                value={formData.attendanceThreshold}
                onChange={handleChange}
                name="attendanceThreshold"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 5
                }}
                sx={{ mt: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Assessment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AssessmentForm;