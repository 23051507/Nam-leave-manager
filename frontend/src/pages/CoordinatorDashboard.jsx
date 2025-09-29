import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Alert,
    CircularProgress,
    Button
} from '@mui/material';
import { PendingActions, CheckCircle, Cancel } from '@mui/icons-material';
import NavBar from '../components/NavBar';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CoordinatorDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/leave-approvals/pending');
                setPending(res.data?.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user.id]);

    const handleApprove = async (id) => {
        await axios.post(`/api/leave-approvals/${id}/approve`, { decision: 'APPROVED' });
        const refreshed = await axios.get('/api/leave-approvals/pending');
        setPending(refreshed.data?.data || []);
    };

    const handleReject = async (id) => {
        await axios.post(`/api/leave-approvals/${id}/reject`, { decision: 'REJECTED' });
        const refreshed = await axios.get('/api/leave-approvals/pending');
        setPending(refreshed.data?.data || []);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box>
            <NavBar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Espace Coordinateur
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Demandes en attente
                                </Typography>
                                {pending.length ? (
                                    <List>
                                        {pending.map((r, i) => (
                                            <React.Fragment key={r.id}>
                                                <ListItem
                                                    secondaryAction={
                                                        <Box>
                                                            <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleApprove(r.id)} sx={{ mr: 1 }}>
                                                                Approuver
                                                            </Button>
                                                            <Button size="small" color="error" startIcon={<Cancel />} onClick={() => handleReject(r.id)}>
                                                                Rejeter
                                                            </Button>
                                                        </Box>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={`${r.first_name} ${r.last_name} — ${r.leave_type_name} (${r.days_count} j)`}
                                                        secondary={`${new Date(r.start_date).toLocaleDateString('fr-FR')} → ${new Date(r.end_date).toLocaleDateString('fr-FR')}`}
                                                    />
                                                </ListItem>
                                                {i < pending.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">Aucune demande en attente</Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default CoordinatorDashboard;







