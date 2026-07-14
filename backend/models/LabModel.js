import pool from '../config/db.js';

class LabModel {
    static async createLabRequest(req) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
      INSERT INTO lab_requests (
        id, patient_id, requested_by, form_type, form_id, 
        urgency, clinical_history, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
            const values = [
                req.id, req.patientId, req.requestedBy, req.formType, req.formId,
                req.urgency, req.clinicalHistory, req.status
            ];

            await client.query(query, values);

            if (req.testTypes && req.testTypes.length > 0) {
                for (const test of req.testTypes) {
                    await client.query(
                        'INSERT INTO lab_request_test_types (lab_request_id, value) VALUES ($1, $2)',
                        [req.id, test]
                    );
                }
            }

            await client.query('COMMIT');
            return req.id;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateLabRequest(id, data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Handle testTypes separately if it's in the data
            const testTypes = data.testTypes;
            const updateData = { ...data };
            delete updateData.testTypes;

            // Only update lab_requests if there are other fields
            const keys = Object.keys(updateData);
            if (keys.length > 0) {
                const setClause = keys.map((key, index) => {
                    const dbColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                    return `${dbColumn} = $${index + 2}`;
                }).join(', ');

                const query = `
          UPDATE lab_requests 
          SET ${setClause} 
          WHERE id = $1 
          RETURNING *;
        `;
                const values = [id, ...Object.values(updateData)];
                await client.query(query, values);
            }

            // Update testTypes if provided
            if (testTypes !== undefined) {
                await client.query('DELETE FROM lab_request_test_types WHERE lab_request_id = $1', [id]);
                if (testTypes.length > 0) {
                    for (const test of testTypes) {
                        await client.query(
                            'INSERT INTO lab_request_test_types (lab_request_id, value) VALUES ($1, $2)',
                            [id, test]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            return id;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getLabRequestById(id) {
        const query = `
          SELECT 
            l.*, 
            u.name AS requested_by_name,
            COALESCE(
              (SELECT json_agg(tt.value) FROM lab_request_test_types tt WHERE tt.lab_request_id = l.id), '[]'
            ) AS test_types
          FROM lab_requests l 
          LEFT JOIN users u ON l.requested_by = u.id 
          WHERE l.id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllLabRequests() {
        const query = `
          SELECT 
            l.*, 
            u.name AS requested_by_name,
            COALESCE(
              (SELECT json_agg(tt.value) FROM lab_request_test_types tt WHERE tt.lab_request_id = l.id), '[]'
            ) AS test_types
          FROM lab_requests l 
          LEFT JOIN users u ON l.requested_by = u.id 
          ORDER BY l.requested_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default LabModel;