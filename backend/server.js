const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leaveRequestRoutes = require('./routes/leaveRequests');
const leaveApprovalRoutes = require('./routes/leaveApprovals');
const leaveBalanceRoutes = require('./routes/leaveBalances');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend NAMS Leave Manager fonctionne 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/leave-approvals', leaveApprovalRoutes);
app.use('/api/leave-balances', leaveBalanceRoutes);

// Route pour les types de congés
app.get('/api/leave-types', async (req, res) => {
  try {
    const pool = require('./config/database');
    const result = await pool.query('SELECT * FROM leave_types WHERE is_active = true ORDER BY name');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur de récupération des types de congés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Test de connexion à la base de données au démarrage
const pool = require('./config/database');
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    console.log('💡 Assurez-vous que PostgreSQL est démarré et que les variables d\'environnement sont correctement configurées');
  } else {
    console.log('✅ Connexion à la base de données réussie:', result.rows[0].now);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur NAMS Leave Manager démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});