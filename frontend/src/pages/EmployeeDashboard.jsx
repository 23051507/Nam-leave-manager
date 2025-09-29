 import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import { CalendarMonth, AddCircle } from '@mui/icons-material';
import NavBar from '../components/NavBar';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
    const Navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [bRes, rRes] = await Promise.all([
                    axios.get(`/api/leave-balances/${user.id}`),
                    axios.get('/api/leave-requests')
                ]);
                setBalances(bRes.data?.data?.balances || []);
                const mine = (rRes.data?.data || []).filter((r) => r.user_id === user.id);
                setMyRequests(mine);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user.id]);

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
                    Espace Employé
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <CalendarMonth sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Mes soldes
                                </Typography>
                                {balances.length ? (
                                    <List>
                                        {balances.map((b, i) => (
                                            <React.Fragment key={`${b.leave_type_id}-${i}`}>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={b.leave_type_name}
                                                        secondary={`${b.remaining} / ${b.total_allocated} jours restants`}
                                                    />
                                                </ListItem>
                                                {i < balances.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">Aucun solde disponible</Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Mes demandes récentes
                                </Typography>
                                {myRequests.length ? (
                                    <List>
                                        {myRequests.slice(0, 5).map((r, i) => (
                                            <React.Fragment key={r.id}>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={`${r.leave_type_name} — ${r.days_count} j`}
                                                        secondary={`${new Date(r.start_date).toLocaleDateString('fr-FR')} → ${new Date(r.end_date).toLocaleDateString('fr-FR')} • ${r.status}`}
                                                    />
                                                </ListItem>
                                                {i < Math.min(4, myRequests.length - 1) && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">Aucune demande récente</Alert>
                                )}
                                <Button variant="contained" startIcon={<AddCircle />} sx={{ mt: 2 }} onClick={() => Navigate('/employee/new')}>
                                    Nouvelle demande
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default EmployeeDashboard;







