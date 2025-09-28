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
import { Assessment } from '@mui/icons-material';
import NavBar from '../components/NavBar';
import axios from 'axios';

const HRDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/leave-balances/reports/summary');
                setSummary(res.data?.data || null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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
                    Espace Ressources Humaines
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Synthèse des soldes (année {summary?.year})
                                </Typography>
                                {summary ? (
                                    <>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            Utilisateurs: {summary.summary.total_users} • Alloué: {summary.summary.total_allocated} • Consommé: {summary.summary.total_consumed} • Restant: {summary.summary.total_remaining} • Taux: {summary.summary.consumption_rate}%
                                        </Typography>
                                        <List>
                                            {(summary.details || []).map((row, i) => (
                                                <React.Fragment key={`${row.service}-${row.leave_type_name}-${i}`}>
                                                    <ListItem>
                                                        <ListItemText
                                                            primary={`${row.service || 'Sans service'} — ${row.leave_type_name}`}
                                                            secondary={`Alloué: ${row.total_allocated} • Consommé: ${row.total_consumed} • Restant: ${row.total_remaining}`}
                                                        />
                                                    </ListItem>
                                                    {i < (summary.details?.length || 1) - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                        <Button variant="outlined" sx={{ mt: 2 }} disabled>
                                            Exporter (à venir)
                                        </Button>
                                    </>
                                ) : (
                                    <Alert severity="info">Aucune donnée</Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default HRDashboard;






