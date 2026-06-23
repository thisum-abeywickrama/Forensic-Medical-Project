const pool = require('../config/db');

class LabModel {
    static async createLabRequest(labData, testTypeIds) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Insert parent lab request
            const insertLabQuery = `
        INSERT INTO lab_requests (id, patient_id, requested_by, form_type, form_id, urgency, clinical_history, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
            const labValues = [
                labData.id, labData.patientId, labData.requestedBy,
                labData.formType, labData.formId, labData.urgency,
                labData.clinicalHistory, labData.status
            ];

            await client.query(insertLabQuery, labValues);

            // 2. Insert test types into junction table
            if (testTypeIds && testTypeIds.length > 0) {
                const insertTestQuery = `
          INSERT INTO lab_request_tests (lab_request_id, test_id)
          VALUES ($1, $2);
        `;
                for (const testId of testTypeIds) {
                    await client.query(insertTestQuery, [labData.id, testId]);
                }
            }

            await client.query('COMMIT');
            return labData.id;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getLabRequests() {
        // Joins the lookup table to return an array of test names natively in Postgres
        const query = `
      SELECT 
        lr.*,
        COALESCE(
          json_agg(json_build_object('id', lrt.test_id, 'name', lt.test_name)) 
          FILTER (WHERE lrt.test_id IS NOT NULL), '[]'
        ) as tests
      FROM lab_requests lr
      LEFT JOIN lab_request_tests lrt ON lr.id = lrt.lab_request_id
      LEFT JOIN lookup_test_types lt ON lrt.test_id = lt.id
      GROUP BY lr.id
      ORDER BY lr.requested_at DESC;
    `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = LabModel;