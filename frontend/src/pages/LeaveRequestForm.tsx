import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  Fade,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Person,
  Email,
  CalendarToday,
  Note,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material';
import { apiClient } from '../api/axios';
import { useNavigate } from 'react-router-dom';

type LeaveRequestData = {
  employeeName: string;
  email: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  supervisor: string;
  days?: number;
  status?: string;
  submittedAt?: string;
};

const submitLeaveRequest = async (requestData: LeaveRequestData) => {
  const response = await apiClient.post('/leave-requests', {'leave_type_id':1,
    'start_date':requestData.startDate,
    'end_date': requestData.endDate,
    'justification':requestData.reason
  });
  return response;
};

function LeaveRequestForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeName: '',
    email: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    supervisor: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      navigate(-1);
      }, 3000);
    },
    onError: () => {
      setErrors({ submit: 'Erreur lors de la soumission. Veuillez réessayer.' });
    },
  });

  const leaveTypes = [
    'Congé annuel',
    'Congé maladie',
    'Congé sans solde',
    'Congé maternité/paternité',
    'Congé formation',
    'RTT',
    'Autre'
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
    if (errors[name as string]) {
      setErrors(prev => ({
        ...prev,
        [name as string]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
        
    if (!formData.leaveType) {
      newErrors.leaveType = 'Le type de congé est requis';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }
    
    return newErrors;
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      const submitData = {
        ...formData,
        days: calculateDays(),
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      mutation.mutate(submitData);
    } else {
      setErrors(newErrors);
    }
  };

  if (showSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Fade in={showSuccess}>
          <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 3 }}>
            <CardContent>
              <CheckCircleOutline sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
                Demande envoyée avec succès!
              </Typography>
              <Typography color="text.secondary">
                Votre demande de congé a été soumise et sera examinée par votre superviseur.
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 6, px: 2 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', p: 4, color: 'white' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday />
              Demande de Congé
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
              Complétez le formulaire pour soumettre votre demande
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {errors.submit && (
              <Alert severity="error" icon={<ErrorOutline />}>
                {errors.submit}
              </Alert>
            )}

            <FormControl fullWidth error={!!errors.leaveType}>
              <InputLabel>Type de congé *</InputLabel>
              <Select
                name="leaveType"
                value={formData.leaveType}
                onChange={(e) => handleChange(e as React.ChangeEvent<{ name?: string; value: string }>)}
                disabled={mutation.isPending}
              >
                <MenuItem value="">Sélectionnez un type</MenuItem>
                {leaveTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
              {errors.leaveType && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ErrorOutline fontSize="small" />
                  {errors.leaveType}
                </Typography>
              )}
            </FormControl>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Date de début *"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  disabled={mutation.isPending}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Date de fin *"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  disabled={mutation.isPending}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Box>
            </Stack>

            {calculateDays() > 0 && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography color="info.main" fontWeight="medium">
                  Durée: {calculateDays()} jour{calculateDays() > 1 ? 's' : ''}
                </Typography>
              </Paper>
            )}

            <TextField
              fullWidth
              label="Motif / Commentaires"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={mutation.isPending}
              multiline
              rows={4}
              InputProps={{
                startAdornment: <Note sx={{ mr: 1, color: 'action.active' }} />,
              }}
              variant="outlined"
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={mutation.isPending}
                sx={{ flex: 1, py: 1.5 }}
                startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {mutation.isPending ? 'Envoi en cours...' : 'Soumettre la demande'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                disabled={mutation.isPending}
                onClick={() => {
                  setFormData({
                    employeeName: '',
                    email: '',
                    leaveType: '',
                    startDate: '',
                    endDate: '',
                    reason: '',
                    supervisor: ''
                  });
                  setErrors({});
                }}
                sx={{ py: 1.5 }}
              >
                Réinitialiser
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default LeaveRequestForm;