import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    EventNote,
    PendingActions,
    CheckCircle,
    Cancel,
    Person,
    Business,
    CalendarMonth,
    TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import axios from 'axios';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Charger les statistiques et demandes récentes
            const requestsResponse = await axios.get('/api/leave-requests');
            const requests = requestsResponse.data.data;

            // Charger les soldes
            const balancesResponse = await axios.get(`/api/leave-balances/${user.id}`);
            setBalances(balancesResponse.data.data.balances);

            // Calculer les statistiques
            const userRequests = requests.filter(req => req.user_id === user.id);
            const stats = {
                totalRequests: userRequests.length,
                pendingRequests: userRequests.filter(req => req.status === 'PENDING').length,
                approvedRequests: userRequests.filter(req => req.status === 'APPROVED').length,
                rejectedRequests: userRequests.filter(req => req.status === 'REJECTED').length
            };
            setStats(stats);

            // Demandes récentes (5 dernières)
            setRecentRequests(userRequests.slice(0, 5));

        } catch (error) {
            console.error('Erreur de chargement du dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'CANCELLED': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <PendingActions />;
            case 'APPROVED': return <CheckCircle />;
            case 'REJECTED': return <Cancel />;
            default: return <EventNote />;
        }
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
                {/* En-tête */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Bienvenue, {user.first_name} {user.last_name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {user.service} • {user.position}
                    </Typography>
                </Box>

                {/* Statistiques */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                        <EventNote />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Demandes
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.totalRequests}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                                        <PendingActions />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            En Attente
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.pendingRequests}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                                        <CheckCircle />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Approuvées
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.approvedRequests}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                                        <Cancel />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Rejetées
                                        </Typography>
                                        <Typography variant="h4">
                                            {stats.rejectedRequests}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Soldes de congés */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <CalendarMonth sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Mes Soldes de Congés
                                </Typography>
                                {balances.length > 0 ? (
                                    <List>
                                        {balances.map((balance, index) => (
                                            <React.Fragment key={balance.id}>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: balance.remaining > 0 ? 'success.main' : 'warning.main' }}>
                                                            {balance.remaining > 0 ? <CheckCircle /> : <PendingActions />}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={balance.leave_type_name}
                                                        secondary={`${balance.remaining} jours restants sur ${balance.total_allocated}`}
                                                    />
                                                </ListItem>
                                                {index < balances.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">
                                        Aucun solde de congés disponible
                                    </Alert>
                                )}
                            </CardContent>
                            <CardActions>
                                <Button size="small" variant="outlined">
                                    Voir le détail
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* Demandes récentes */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Demandes Récentes
                                </Typography>
                                {recentRequests.length > 0 ? (
                                    <List>
                                        {recentRequests.map((request, index) => (
                                            <React.Fragment key={request.id}>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar>
                                                            {getStatusIcon(request.status)}
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={`${request.leave_type_name} - ${request.days_count} jours`}
                                                        secondary={
                                                            <Box>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {new Date(request.start_date).toLocaleDateString('fr-FR')} - {new Date(request.end_date).toLocaleDateString('fr-FR')}
                                                                </Typography>
                                                                <Chip
                                                                    label={request.status}
                                                                    size="small"
                                                                    color={getStatusColor(request.status)}
                                                                    sx={{ mt: 0.5 }}
                                                                />
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < recentRequests.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info">
                                        Aucune demande récente
                                    </Alert>
                                )}
                            </CardContent>
                            <CardActions>
                                <Button size="small" variant="outlined">
                                    Voir toutes les demandes
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Dashboard;




