import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, List, ListItem, ListItemText, Divider, Alert, CircularProgress } from '@mui/material';
import NavBar from '../components/NavBar';
import axios from 'axios';

const AdminUsers = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/api/users');
                setUsers(res.data?.data || []);
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
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>Gestion des utilisateurs</Typography>
                <Card>
                    <CardContent>
                        {users.length ? (
                            <List>
                                {users.map((u, i) => (
                                    <React.Fragment key={u.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={`${u.first_name} ${u.last_name} — ${u.role}`}
                                                secondary={`${u.email} • ${u.service || 'Sans service'}`}
                                            />
                                        </ListItem>
                                        {i < users.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Alert severity="info">Aucun utilisateur</Alert>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default AdminUsers;






