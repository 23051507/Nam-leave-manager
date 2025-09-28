import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Utiliser le contexte d'authentification pour effectuer la connexion
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        throw new Error(result.message || "Connexion échouée");
      }

      const userRole = result.user.role;
      switch (userRole) {
        case "ADMIN":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "HR":
          navigate("/hr/dashboard", { replace: true });
          break;
        case "COORDINATOR":
          navigate("/coordinator/dashboard", { replace: true });
          break;
        case "EMPLOYEE":
          navigate("/employee/dashboard", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setError(
        error.response?.data?.message ||
        error.message || "Erreur de connexion. Vérifiez vos identifiants."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#f5f5f5",
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: 3,
          margin: "auto",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <img
            src="/logo.png"
            alt="Logo NAMS"
            style={{ width: 60, height: 60, marginBottom: 16 }}
          />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#333" }}>
            NAMS Leave Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestion des congés d'entreprise
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            name="email"
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <TextField
            name="password"
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "bold",
              background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Comptes de test :</strong>
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Admin: admin@nams.com / admin123
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            RH: rh@nams.com / rh123
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Coordinateur: coordo@nams.com / coordo123
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Employé: employe@nams.com / employe123
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}