const pool = require('../config/db');

class MlefModel {
    static async createMlefForm(mlefData, bodyHarmCategoryIds) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const insertMlefQuery = `
        INSERT INTO mlef_forms (
          id, patient_id, police_station, mlef_no, hospital, exam_findings, created_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
            const mlefValues = [
                mlefData.id, mlefData.patientId, mlefData.policeStation,
                mlefData.mlefNo, mlefData.hospital, mlefData.examFindings,
                mlefData.createdBy, mlefData.status
            ];

            await client.query(insertMlefQuery, mlefValues);

            // Insert into 3NF Junction Table
            if (bodyHarmCategoryIds && bodyHarmCategoryIds.length > 0) {
                const insertHarmQuery = `
          INSERT INTO mlef_body_harms (mlef_id, harm_id)
          VALUES ($1, $2);
        `;
                for (const harmId of bodyHarmCategoryIds) {
                    await client.query(insertHarmQuery, [mlefData.id, harmId]);
                }
            }

            await client.query('COMMIT');
            return mlefData.id;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getAllMlefForms() {
        const query = `SELECT * FROM mlef_forms ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = MlefModel;