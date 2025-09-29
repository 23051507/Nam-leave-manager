const pool = require('../config/database');

class LeaveApproval {
    static async create(approvalData) {
        const { request_id, approver_id, role, decision, comment } = approvalData;

        const query = `
      INSERT INTO leave_approvals (request_id, approver_id, role, decision, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [request_id, approver_id, role, decision, comment];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByRequestId(requestId) {
        const query = `
      SELECT la.*, 
             u.first_name, u.last_name, u.email
      FROM leave_approvals la
      JOIN users u ON la.approver_id = u.id
      WHERE la.request_id = $1
      ORDER BY la.created_at ASC
    `;
        const result = await pool.query(query, [requestId]);
        return result.rows;
    }

    static async findByApproverId(approverId, status = null) {
        let query = `
      SELECT la.*, 
             lr.start_date, lr.end_date, lr.status as request_status,
             u.first_name, u.last_name, u.email, u.service,
             lt.name as leave_type_name
      FROM leave_approvals la
      JOIN leave_requests lr ON la.request_id = lr.id
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE la.approver_id = $1
    `;

        const values = [approverId];

        if (status) {
            query += ` AND la.decision = $2`;
            values.push(status);
        }

        query += ' ORDER BY la.created_at DESC';

        const result = await pool.query(query, values);
        return result.rows;
    }

    static async updateDecision(id, decision, comment = null) {
        const query = `
      UPDATE leave_approvals 
      SET decision = $1, comment = $2, decided_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
        const result = await pool.query(query, [decision, comment, id]);
        return result.rows[0];
    }

    static async getApprovalChain(requestId) {
        const query = `
      SELECT la.*, 
             u.first_name, u.last_name, u.email, u.role
      FROM leave_approvals la
      JOIN users u ON la.approver_id = u.id
      WHERE la.request_id = $1
      ORDER BY la.created_at ASC
    `;
        const result = await pool.query(query, [requestId]);
        return result.rows;
    }
}

module.exports = LeaveApproval;





