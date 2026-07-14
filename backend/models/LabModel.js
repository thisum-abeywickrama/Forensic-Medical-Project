import pool from '../config/db.js';

class LabModel {
    static async createLabRequest(req) {
        const query = `
      INSERT INTO lab_requests (
        id, patient_id, requested_by, form_type, form_id, 
        test_types, urgency, clinical_history, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
        const values = [
            req.id, req.patientId, req.requestedBy, req.formType, req.formId,
            req.testTypes, req.urgency, req.clinicalHistory, req.status
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async updateLabRequest(id, data) {
        // Construct query dynamically based on partial updates
        const keys = Object.keys(data);
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => {
            // Convert camelCase to snake_case for DB columns
            const dbColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            return `${dbColumn} = $${index + 2}`;
        }).join(', ');

        const query = `
      UPDATE lab_requests 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *;
    `;

        const values = [id, ...Object.values(data)];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getLabRequestById(id) {
        const query = `
          SELECT l.*, u.name AS requested_by_name 
          FROM lab_requests l 
          LEFT JOIN users u ON l.requested_by = u.id 
          WHERE l.id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllLabRequests() {
        const query = `
          SELECT l.*, u.name AS requested_by_name 
          FROM lab_requests l 
          LEFT JOIN users u ON l.requested_by = u.id 
          ORDER BY l.requested_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default LabModel;