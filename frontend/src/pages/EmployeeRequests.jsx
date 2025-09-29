import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, List, ListItem, ListItemText, Divider, Alert, CircularProgress, Button } from '@mui/material';
import NavBar from '../components/NavBar';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const EmployeeRequests = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);

    const load = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/leave-requests');
            const mine = (res.data?.data || []).filter(r => r.user_id === user.id);
            setRequests(mine);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

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
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>Mes demandes de congés</Typography>
                <Card>
                    <CardContent>
                        {requests.length ? (
                            <List>
                                {requests.map((r, i) => (
                                    <React.Fragment key={r.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={`${r.leave_type_name} — ${r.days_count} j • ${r.status}`}
                                                secondary={`${new Date(r.start_date).toLocaleDateString('fr-FR')} → ${new Date(r.end_date).toLocaleDateString('fr-FR')}`}
                                            />
                                        </ListItem>
                                        {i < requests.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">Aucune demande trouvée</Alert>
                        )}
                        <Button sx={{ mt: 2 }} variant="contained" disabled>Nouvelle demande (à venir)</Button>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default EmployeeRequests;







