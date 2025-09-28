const pool = require('../config/database');

class LeaveBalance {
    static async create(balanceData) {
        const { user_id, year, leave_type_id, total_allocated } = balanceData;

        const query = `
      INSERT INTO leave_balances (user_id, year, leave_type_id, total_allocated)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, year, leave_type_id) 
      DO UPDATE SET total_allocated = EXCLUDED.total_allocated, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

        const values = [user_id, year, leave_type_id, total_allocated];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId, year = null) {
        let query = `
      SELECT lb.*, 
             lt.name as leave_type_name, lt.code as leave_type_code,
             lt.affects_annual_balance
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.user_id = $1
    `;

        const values = [userId];

        if (year) {
            query += ` AND lb.year = $2`;
            values.push(year);
        } else {
            // Par défaut, année courante
            query += ` AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)`;
        }

        query += ' ORDER BY lt.name';

        const result = await pool.query(query, values);
        return result.rows;
    }

    static async updateConsumed(userId, leaveTypeId, year, consumedDays) {
        const query = `
      UPDATE leave_balances 
      SET consumed = consumed + $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND leave_type_id = $3 AND year = $4
      RETURNING *
    `;
        const result = await pool.query(query, [consumedDays, userId, leaveTypeId, year]);
        return result.rows[0];
    }

    static async deductFromBalance(userId, leaveTypeId, year, daysToDeduct) {
        const query = `
      UPDATE leave_balances 
      SET consumed = consumed + $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND leave_type_id = $3 AND year = $4
        AND (total_allocated - consumed) >= $1
      RETURNING *
    `;
        const result = await pool.query(query, [daysToDeduct, userId, leaveTypeId, year]);

        if (result.rows.length === 0) {
            throw new Error('Solde insuffisant pour ce type de congé');
        }

        return result.rows[0];
    }

    static async addToBalance(userId, leaveTypeId, year, daysToAdd) {
        const query = `
      UPDATE leave_balances 
      SET consumed = GREATEST(0, consumed - $1), updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND leave_type_id = $3 AND year = $4
      RETURNING *
    `;
        const result = await pool.query(query, [daysToAdd, userId, leaveTypeId, year]);
        return result.rows[0];
    }

    static async initializeYearlyBalances(userId, year) {
        // Récupérer tous les types de congés actifs
        const leaveTypesQuery = 'SELECT * FROM leave_types WHERE is_active = true';
        const leaveTypesResult = await pool.query(leaveTypesQuery);
        const leaveTypes = leaveTypesResult.rows;

        // Récupérer les informations de l'utilisateur
        const userQuery = 'SELECT annual_leave_alloc FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            throw new Error('Utilisateur non trouvé');
        }

        const userAnnualAlloc = userResult.rows[0].annual_leave_alloc;

        // Initialiser les soldes pour chaque type de congé
        for (const leaveType of leaveTypes) {
            let totalAllocated = 0;

            // Pour le congé annuel, utiliser l'allocation de l'utilisateur
            if (leaveType.code === 'ANNUAL') {
                totalAllocated = userAnnualAlloc;
            }

            // Créer ou mettre à jour le solde
            await this.create({
                user_id: userId,
                year: year,
                leave_type_id: leaveType.id,
                total_allocated: totalAllocated
            });
        }
    }

    static async getAvailableBalance(userId, leaveTypeId, year = null) {
        const currentYear = year || new Date().getFullYear();

        const query = `
      SELECT remaining FROM leave_balances
      WHERE user_id = $1 AND leave_type_id = $2 AND year = $3
    `;

        const result = await pool.query(query, [userId, leaveTypeId, currentYear]);

        if (result.rows.length === 0) {
            return 0;
        }

        return parseFloat(result.rows[0].remaining);
    }

    static async getAllBalancesForYear(year = null) {
        const currentYear = year || new Date().getFullYear();

        const query = `
      SELECT lb.*, 
             u.first_name, u.last_name, u.email, u.service,
             lt.name as leave_type_name, lt.code as leave_type_code
      FROM leave_balances lb
      JOIN users u ON lb.user_id = u.id
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.year = $1 AND u.is_active = true
      ORDER BY u.last_name, u.first_name, lt.name
    `;

        const result = await pool.query(query, [currentYear]);
        return result.rows;
    }
}

module.exports = LeaveBalance;




