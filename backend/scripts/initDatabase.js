const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        console.log('🚀 Initialisation de la base de données NAMS Leave Manager...');

        // Vérifier la connexion
        await pool.query('SELECT NOW()');
        console.log('✅ Connexion à la base de données réussie');

        // Créer les utilisateurs de test
        const testUsers = [
            {
                email: 'admin@nams.com',
                password: 'admin123',
                first_name: 'Admin',
                last_name: 'NAMS',
                role: 'ADMIN',
                service: 'Direction',
                position: 'Directeur Général',
                annual_leave_alloc: 30
            },
            {
                email: 'rh@nams.com',
                password: 'rh123',
                first_name: 'TAKA',
                last_name: 'PLATINI',
                role: 'HR',
                service: 'Ressources Humaines',
                position: 'Responsable RH',
                annual_leave_alloc: 25
            },
            {
                email: 'coordo@nams.com',
                password: 'coordo123',
                first_name: 'ONANA',
                last_name: 'Martin',
                role: 'COORDINATOR',
                service: 'Informatique',
                position: 'Chef de Projet',
                annual_leave_alloc: 25
            },
            {
                email: 'employe@nams.com',
                password: 'employe123',
                first_name: 'Sophie',
                last_name: 'Durand',
                role: 'EMPLOYEE',
                service: 'Informatique',
                position: 'Développeuse',
                annual_leave_alloc: 25
            },
            {
                email: 'manager@nams.com',
                password: 'manager123',
                first_name: 'Pierre',
                last_name: 'Moreau',
                role: 'COORDINATOR',
                service: 'Ventes',
                position: 'Manager Commercial',
                annual_leave_alloc: 25
            },
            {
                email: 'employe2@nams.com',
                password: 'employe123',
                first_name: 'Lucas',
                last_name: 'Bernard',
                role: 'EMPLOYEE',
                service: 'Ventes',
                position: 'Commercial',
                annual_leave_alloc: 25
            }
        ];

        // Vider les tables existantes (dans l'ordre correct pour éviter les contraintes FK)
        console.log('🧹 Nettoyage des données existantes...');
        await pool.query('DELETE FROM audit_logs');
        await pool.query('DELETE FROM notifications');
        await pool.query('DELETE FROM leave_approvals');
        await pool.query('DELETE FROM leave_requests');
        await pool.query('DELETE FROM leave_balances');
        await pool.query('DELETE FROM users');

        // Créer les utilisateurs
        console.log('👥 Création des utilisateurs de test...');
        const userIds = {};

        for (const userData of testUsers) {
            const passwordHash = await bcrypt.hash(userData.password, 10);

            const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, service, position, annual_leave_alloc)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

            const result = await pool.query(query, [
                userData.email,
                passwordHash,
                userData.first_name,
                userData.last_name,
                userData.role,
                userData.service,
                userData.position,
                userData.annual_leave_alloc
            ]);

            userIds[userData.email] = result.rows[0].id;
            console.log(`✅ Utilisateur créé: ${userData.email} (ID: ${result.rows[0].id})`);
        }

        // Définir les relations hiérarchiques
        console.log('🔗 Définition des relations hiérarchiques...');

        // Admin est le manager de RH
        await pool.query('UPDATE users SET manager_id = $1 WHERE email = $2', [userIds['admin@nams.com'], 'rh@nams.com']);

        // RH est le manager des coordinateurs
        await pool.query('UPDATE users SET manager_id = $1 WHERE email = $2', [userIds['rh@nams.com'], 'coordo@nams.com']);
        await pool.query('UPDATE users SET manager_id = $1 WHERE email = $2', [userIds['rh@nams.com'], 'manager@nams.com']);

        // Coordinateurs sont managers des employés
        await pool.query('UPDATE users SET manager_id = $1 WHERE email = $2', [userIds['coordo@nams.com'], 'employe@nams.com']);
        await pool.query('UPDATE users SET manager_id = $1 WHERE email = $2', [userIds['manager@nams.com'], 'employe2@nams.com']);

        // Initialiser les soldes pour l'année courante
        console.log('💰 Initialisation des soldes de congés...');
        const currentYear = new Date().getFullYear();

        for (const [email, userId] of Object.entries(userIds)) {
            await pool.query(`
        INSERT INTO leave_balances (user_id, year, leave_type_id, total_allocated)
        SELECT $1, $2, id, 
          CASE 
            WHEN code = 'ANNUAL' THEN $3
            ELSE 0
          END
        FROM leave_types 
        WHERE is_active = true
      `, [userId, currentYear, 25]); // 25 jours par défaut
        }

        // Créer quelques demandes de congés de test
        console.log('📋 Création de demandes de congés de test...');

        // Récupérer l'ID du type de congé annuel
        const annualLeaveType = await pool.query('SELECT id FROM leave_types WHERE code = $1', ['ANNUAL']);

        if (annualLeaveType.rows.length > 0) {
            const annualLeaveTypeId = annualLeaveType.rows[0].id;

            // Demande approuvée pour Sophie
            const approvedRequest = await pool.query(`
        INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, days_count, status, justification, created_by)
        VALUES ($1, $2, $3, $4, $5, 'APPROVED', 'Vacances d''été', $1)
        RETURNING id
      `, [
                userIds['employe@nams.com'],
                annualLeaveTypeId,
                '2024-07-15',
                '2024-07-19',
                5
            ]);

            // Créer l'approbation
            await pool.query(`
        INSERT INTO leave_approvals (request_id, approver_id, role, decision, comment)
        VALUES ($1, $2, 'COORDINATOR', 'APPROVED', 'Vacances approuvées')
      `, [approvedRequest.rows[0].id, userIds['coordo@nams.com']]);

            // Demande en attente pour Lucas
            const pendingRequest = await pool.query(`
        INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, days_count, status, justification, created_by)
        VALUES ($1, $2, $3, $4, $5, 'PENDING', 'Congé pour événement familial', $1)
        RETURNING id
      `, [
                userIds['employe2@nams.com'],
                annualLeaveTypeId,
                '2024-08-20',
                '2024-08-22',
                3
            ]);

            // Créer l'approbation en attente
            await pool.query(`
        INSERT INTO leave_approvals (request_id, approver_id, role, decision)
        VALUES ($1, $2, 'COORDINATOR', 'PENDING')
      `, [pendingRequest.rows[0].id, userIds['manager@nams.com']]);

            console.log('✅ Demandes de congés créées');
        }

        console.log('🎉 Initialisation terminée avec succès !');
        console.log('\n📋 Comptes de test créés :');
        console.log('Admin: admin@nams.com / admin123');
        console.log('RH: rh@nams.com / rh123');
        console.log('Coordinateur: coordo@nams.com / coordo123');
        console.log('Employé: employe@nams.com / employe123');
        console.log('Manager: manager@nams.com / manager123');
        console.log('Employé 2: employe2@nams.com / employe123');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Exécuter si ce script est appelé directement
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Script terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script échoué:', error);
            process.exit(1);
        });
}

module.exports = initializeDatabase;




