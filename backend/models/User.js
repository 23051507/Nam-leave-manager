const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { email, password, first_name, last_name, role, manager_id, service, position, annual_leave_alloc } = userData;

        // Hash du mot de passe
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, manager_id, service, position, annual_leave_alloc)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, role, manager_id, service, position, annual_leave_alloc, created_at
    `;

        const values = [email, password_hash, first_name, last_name, role, manager_id, service, position, annual_leave_alloc || 25];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
      SELECT u.*, m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.id = $1 AND u.is_active = true
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findAll(filters = {}) {
        let query = `
      SELECT u.*, m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.is_active = true
    `;

        const values = [];
        let paramCount = 0;

        if (filters.role) {
            paramCount++;
            query += ` AND u.role = $${paramCount}`;
            values.push(filters.role);
        }

        if (filters.manager_id) {
            paramCount++;
            query += ` AND u.manager_id = $${paramCount}`;
            values.push(filters.manager_id);
        }

        if (filters.service) {
            paramCount++;
            query += ` AND u.service = $${paramCount}`;
            values.push(filters.service);
        }

        query += ' ORDER BY u.last_name, u.first_name';

        const result = await pool.query(query, values);
        return result.rows;
    }

    static async update(id, updateData) {
        const allowedFields = ['first_name', 'last_name', 'role', 'manager_id', 'service', 'position', 'annual_leave_alloc'];
        const updates = [];
        const values = [];
        let paramCount = 0;

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                paramCount++;
                updates.push(`${key} = $${paramCount}`);
                values.push(updateData[key]);
            }
        });

        if (updates.length === 0) {
            throw new Error('Aucun champ valide à mettre à jour');
        }

        paramCount++;
        values.push(id);

        const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'UPDATE users SET is_active = false WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getSubordinates(managerId) {
        const query = `
      SELECT * FROM users 
      WHERE manager_id = $1 AND is_active = true 
      ORDER BY last_name, first_name
    `;
        const result = await pool.query(query, [managerId]);
        return result.rows;
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;




