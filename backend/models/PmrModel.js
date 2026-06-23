const pool = require('../config/db');

class PmrModel {
    static async createPmrReport(pmrData, identifiers) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const insertPmrQuery = `
        INSERT INTO pmr_forms (
          id, patient_id, inquest_no, place, courts, case_no, 
          date_time_of_death, requestor_name, requestor_designation, status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id;
      `;
            const pmrValues = [
                pmrData.id, pmrData.patientId, pmrData.inquestNo,
                pmrData.place, pmrData.courts, pmrData.caseNo,
                pmrData.dateTimeOfDeath, pmrData.requestorName, pmrData.requestorDesignation,
                pmrData.status, pmrData.createdBy
            ];

            await client.query(insertPmrQuery, pmrValues);

            // Insert dynamic body identifiers
            if (identifiers && identifiers.length > 0) {
                const insertIdentifierQuery = `
          INSERT INTO pmr_identifiers (pmr_id, name, address)
          VALUES ($1, $2, $3);
        `;
                for (const person of identifiers) {
                    await client.query(insertIdentifierQuery, [
                        pmrData.id, person.name, person.address
                    ]);
                }
            }

            await client.query('COMMIT');
            return pmrData.id;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getAllPmrForms() {
        const query = `SELECT * FROM pmr_forms ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = PmrModel;