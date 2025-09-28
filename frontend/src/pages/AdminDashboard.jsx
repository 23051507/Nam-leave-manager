import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Divider,
    Stack
} from '@mui/material';
import {
    People,
    AssignmentTurnedIn,
    Assessment,
    Settings
} from '@mui/icons-material';
import NavBar from '../components/NavBar';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
   const handleNavigation = () => {
   navigate("/admin/user")
  };
    useEffect(() => {
        // Optionally preload admin stats here
    }, []);

    return (
        <Box>
            <NavBar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Tableau de bord Administrateur
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Accès complet: gestion des utilisateurs, paramètres et rapports.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <People color="primary" />
                                    <Box>
                                        <Typography variant="h6">Gestion des utilisateurs</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Créer, modifier, supprimer, attribuer des rôles et managers
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Button variant="contained" size="small" onClick={handleNavigation} disabled={loading}>
                                    Ouvrir la gestion des utilisateurs
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <AssignmentTurnedIn color="success" />
                                    <Box>
                                        <Typography variant="h6">Demandes de congés</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Vue d'ensemble et décisions finales
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Button variant="outlined" size="small" disabled={loading}>
                                    Voir les demandes
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Assessment color="secondary" />
                                    <Box>
                                        <Typography variant="h6">Rapports</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Rapports par service, période et type de congé
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Button variant="outlined" size="small" disabled={loading}>
                                    Générer un rapport
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Settings />
                                    <Box>
                                        <Typography variant="h6">Paramètres entreprise</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Règles des congés, jours annuels, notifications
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Button variant="outlined" size="small" disabled={loading}>
                                    Ouvrir les paramètres
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default AdminDashboard;






