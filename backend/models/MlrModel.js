const pool = require('../config/db');

class MlrModel {
    static async createMlrReport(mlrData, injuries) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const insertMlrQuery = `
        INSERT INTO mlr_reports (id, patient_id, doctor_id, further_notes, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `;
            const mlrValues = [
                mlrData.id, mlrData.patientId, mlrData.doctorId,
                mlrData.furtherNotes, mlrData.status, mlrData.createdBy
            ];

            await client.query(insertMlrQuery, mlrValues);

            // Insert dynamic injuries
            if (injuries && injuries.length > 0) {
                const insertInjuryQuery = `
          INSERT INTO mlr_injuries (mlr_id, injury_no, description)
          VALUES ($1, $2, $3);
        `;
                for (const injury of injuries) {
                    await client.query(insertInjuryQuery, [
                        mlrData.id, injury.no, injury.description
                    ]);
                }
            }

            await client.query('COMMIT');
            return mlrData.id;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getMlrById(mlrId) {
        const query = `
      SELECT 
        m.*,
        COALESCE(
          json_agg(json_build_object('id', i.id, 'no', i.injury_no, 'description', i.description)) 
          FILTER (WHERE i.id IS NOT NULL), '[]'
        ) as injuries
      FROM mlr_reports m
      LEFT JOIN mlr_injuries i ON m.id = i.mlr_id
      WHERE m.id = $1
      GROUP BY m.id;
    `;
        const result = await pool.query(query, [mlrId]);
        return result.rows[0];
    }
}

module.exports = MlrModel;