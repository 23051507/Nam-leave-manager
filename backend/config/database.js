const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'nams_leave_manager',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Test de connexion
pool.on('connect', () => {
    console.log('✅ Connexion à la base de données PostgreSQL établie');
});

pool.on('error', (err) => {
    console.error('❌ Erreur de connexion à la base de données:', err);
});

module.exports = pool;




