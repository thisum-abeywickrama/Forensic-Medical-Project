import pool from '../config/db.js';

class PmrModel {
    static async createPmrReport(m, identifiers) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
        INSERT INTO pmr_forms (
          id, patient_id, inquest_no, place, courts, date, case_no, deceased_name, 
          date_time_of_death, doctor_conducting, date_time_of_exam, place_of_exam, 
          district, requestor_name, requestor_designation, jmo_name, lab_request_id, pdf_url, status, created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING *;
      `;
            const values = [
                m.id, m.patientId, m.inquestNo, m.place, m.courts, m.date, m.caseNo, m.deceasedName,
                m.dateTimeOfDeath, m.doctorConducting, m.dateTimeOfExam, m.placeOfExam,
                m.district, m.requestorName, m.requestorDesignation, m.jmoName, m.labRequestId, m.pdfUrl || m.pdf_url, m.status, m.createdBy
            ];

            await client.query(query, values);

            // Insert body identifiers
            if (identifiers && identifiers.length > 0) {
                const insertIdentifierQuery = `
          INSERT INTO pmr_identifiers (pmr_id, name, address)
          VALUES ($1, $2, $3);
        `;
                for (const person of identifiers) {
                    await client.query(insertIdentifierQuery, [m.id, person.name, person.address]);
                }
            }

            await client.query('COMMIT');
            return m.id;
        } catch (error) {
            console.error('PMR transaction failed, rolling back:', error);
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updatePmrReport(id, m, identifiers) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
        UPDATE pmr_forms SET
          inquest_no = $1, place = $2, courts = $3, date = $4, case_no = $5, 
          deceased_name = $6, date_time_of_death = $7, doctor_conducting = $8, 
          date_time_of_exam = $9, place_of_exam = $10, district = $11, 
          requestor_name = $12, requestor_designation = $13, jmo_name = $14, 
          lab_request_id = $15, pdf_url = $16, status = $17
        WHERE id = $18;
      `;
            const values = [
                m.inquestNo, m.place, m.courts, m.date, m.caseNo,
                m.deceasedName, m.dateTimeOfDeath, m.doctorConducting,
                m.dateTimeOfExam, m.placeOfExam, m.district,
                m.requestorName, m.requestorDesignation, m.jmoName,
                m.labRequestId, m.pdfUrl || m.pdf_url, m.status, id
            ];

            await client.query(query, values);

            // Delete old identifiers
            await client.query(`DELETE FROM pmr_identifiers WHERE pmr_id = $1;`, [id]);

            // Insert body identifiers
            if (identifiers && identifiers.length > 0) {
                const insertIdentifierQuery = `
          INSERT INTO pmr_identifiers (pmr_id, name, address)
          VALUES ($1, $2, $3);
        `;
                for (const person of identifiers) {
                    await client.query(insertIdentifierQuery, [id, person.name, person.address]);
                }
            }

            await client.query('COMMIT');
            return id;
        } catch (error) {
            console.error('PMR transaction failed, rolling back:', error);
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getPmrById(id) {
        const query = `
      SELECT 
        p.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'address', i.address))
           FROM pmr_identifiers i WHERE i.pmr_id = p.id), '[]'
        ) as identifiers
      FROM pmr_forms p
      WHERE p.id = $1;
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllPmrForms() {
        const query = `
      SELECT 
        p.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', i.id, 'name', i.name, 'address', i.address))
           FROM pmr_identifiers i WHERE i.pmr_id = p.id), '[]'
        ) as identifiers
      FROM pmr_forms p
      ORDER BY p.created_at DESC;
    `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default PmrModel;