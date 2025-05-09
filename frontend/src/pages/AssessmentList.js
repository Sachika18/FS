import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { attendanceAPI } from '../utils/api';

const AssessmentList = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await attendanceAPI.getAllAssessments();
      setAssessments(res.data.data);
    } catch (err) {
      setError('Failed to fetch assessments. Please try again.');
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = () => {
    navigate('/assessments/add');
  };

  // Function to determine if an assessment is upcoming, ongoing, or past
  const getAssessmentStatus = (assessment) => {
    const now = new Date();
    const assessmentDate = new Date(assessment.date);
    const startDate = new Date(assessment.startDate);
    
    if (assessmentDate > now) {
      return { label: 'Upcoming', color: 'primary' };
    } else if (startDate <= now && assessmentDate >= now) {
      return { label: 'Ongoing', color: 'warning' };
    } else {
      return { label: 'Completed', color: 'default' };
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Assessments</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddAssessment}
        >
          Add Assessment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : assessments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No assessments found. Add some assessments to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Attendance Period</TableCell>
                <TableCell>Threshold</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((assessment) => {
                const status = getAssessmentStatus(assessment);
                return (
                  <TableRow key={assessment._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {assessment.name}
                      </Box>
                    </TableCell>
                    <TableCell>{format(new Date(assessment.date), 'PPP')}</TableCell>
                    <TableCell>
                      {format(new Date(assessment.startDate), 'MMM d, yyyy')} - {format(new Date(assessment.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{assessment.attendanceThreshold}%</TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{assessment.createdBy?.name || 'Unknown'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AssessmentList;