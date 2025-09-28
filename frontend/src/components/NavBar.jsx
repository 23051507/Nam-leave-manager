import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleDashboard = () => {
    // Rediriger vers le dashboard selon le rôle
    const roleDashboard = {
      'ADMIN': '/admin/dashboard',
      'HR': '/hr/dashboard',
      'COORDINATOR': '/coordinator/dashboard',
      'EMPLOYEE': '/employee/dashboard'
    };
    navigate(roleDashboard[user.role] || '/dashboard');
    handleMenuClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'HR': return 'warning';
      case 'COORDINATOR': return 'info';
      case 'EMPLOYEE': return 'success';
      default: return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'HR': return 'Ressources Humaines';
      case 'COORDINATOR': return 'Coordinateur';
      case 'EMPLOYEE': return 'Employé';
      default: return role;
    }
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo + Nom entreprise */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleDashboard}>
          <img
            src="/logo.png"
            alt="Logo NAMS"
            style={{ width: 40, height: 40, marginRight: 10 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            NAMS Leave Manager
          </Typography>
        </Box>

        {/* Informations utilisateur et menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Informations utilisateur */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Chip
              label={getRoleLabel(user?.role)}
              size="small"
              color={getRoleColor(user?.role)}
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }}
            />
          </Box>

          {/* Menu utilisateur */}
          <IconButton
            size="large"
            edge="end"
            aria-label="compte utilisateur"
            aria-controls={isMenuOpen ? 'primary-search-account-menu' : undefined}
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                },
              },
            }}
          >
            {/* En-tête du menu */}
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.primary">
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip
                label={getRoleLabel(user?.role)}
                size="small"
                color={getRoleColor(user?.role)}
                sx={{ mt: 0.5 }}
              />
            </Box>

            <MenuItem onClick={handleDashboard}>
              <DashboardIcon sx={{ mr: 1 }} />
              Tableau de bord
            </MenuItem>

            <MenuItem onClick={handleProfile}>
              <AccountCircle sx={{ mr: 1 }} />
              Mon profil
            </MenuItem>

            <MenuItem onClick={handleMenuClose}>
              <Settings sx={{ mr: 1 }} />
              Paramètres
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 1 }} />
              Se déconnecter
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}