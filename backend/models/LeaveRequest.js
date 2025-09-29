const pool = require('../config/database');

class LeaveRequest {
    static async create(requestData) {
        const { user_id, leave_type_id, start_date, end_date, days_count, justification, attachment_path } = requestData;

        const query = `
      INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, days_count, justification, attachment_path, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

        const values = [user_id, leave_type_id, start_date, end_date, days_count, justification, attachment_path, user_id];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = `
      SELECT lr.*, 
             u.first_name, u.last_name, u.email, u.service, u.position,
             lt.name as leave_type_name, lt.code as leave_type_code,
             cb.first_name as created_by_first_name, cb.last_name as created_by_last_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      JOIN users cb ON lr.created_by = cb.id
      WHERE lr.id = $1
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findAll(filters = {}) {
        let query = `
      SELECT lr.*, 
             u.first_name, u.last_name, u.email, u.service, u.position,
             lt.name as leave_type_name, lt.code as leave_type_code
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE 1=1
    `;

        const values = [];
        let paramCount = 0;

        if (filters.user_id) {
            paramCount++;
            query += ` AND lr.user_id = $${paramCount}`;
            values.push(filters.user_id);
        }

        if (filters.status) {
            paramCount++;
            query += ` AND lr.status = $${paramCount}`;
            values.push(filters.status);
        }

        if (filters.leave_type_id) {
            paramCount++;
            query += ` AND lr.leave_type_id = $${paramCount}`;
            values.push(filters.leave_type_id);
        }

        if (filters.start_date && filters.end_date) {
            paramCount++;
            query += ` AND lr.start_date >= $${paramCount}`;
            values.push(filters.start_date);
            paramCount++;
            query += ` AND lr.end_date <= $${paramCount}`;
            values.push(filters.end_date);
        }

        query += ' ORDER BY lr.created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    static async updateStatus(id, status) {
        const query = `
      UPDATE leave_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
        const result = await pool.query(query, [status, id]);
        return result.rows[0];
    }

    static async getPendingForApproval(approverId) {
        const query = `
      SELECT lr.*, 
             u.first_name, u.last_name, u.email, u.service, u.position,
             lt.name as leave_type_name, lt.code as leave_type_code
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.status = 'PENDING' 
        AND u.manager_id = $1
      ORDER BY lr.created_at ASC
    `;
        const result = await pool.query(query, [approverId]);
        return result.rows;
    }

    static async checkDateConflicts(userId, startDate, endDate, excludeRequestId = null) {
        let query = `
      SELECT COUNT(*) as conflict_count
      FROM leave_requests lr
      WHERE lr.user_id = $1 
        AND lr.status IN ('PENDING', 'APPROVED')
        AND (
          (lr.start_date <= $2 AND lr.end_date >= $2) OR
          (lr.start_date <= $3 AND lr.end_date >= $3) OR
          (lr.start_date >= $2 AND lr.end_date <= $3)
        )
    `;

        const values = [userId, startDate, endDate];

        if (excludeRequestId) {
            query += ` AND lr.id != $4`;
            values.push(excludeRequestId);
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].conflict_count) > 0;
    }

    static async getLeaveHistory(userId, year = null) {
        let query = `
      SELECT lr.*, 
             lt.name as leave_type_name, lt.code as leave_type_code
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.user_id = $1
    `;

        const values = [userId];

        if (year) {
            query += ` AND EXTRACT(YEAR FROM lr.start_date) = $2`;
            values.push(year);
        }

        query += ' ORDER BY lr.start_date DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }
}

module.exports = LeaveRequest;





