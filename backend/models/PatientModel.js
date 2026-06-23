const pool = require('../config/db');

class PatientModel {
    static async createPatient(patientData) {
        const query = `
      INSERT INTO patients (id, name, dob, sex, address, nic, email, phone, registered_by, registered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
        const values = [
            patientData.id, patientData.name, patientData.dob,
            patientData.sex, patientData.address, patientData.nic,
            patientData.email, patientData.phone, patientData.registeredBy,
            patientData.registeredAt
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getAllPatients() {
        const query = `SELECT * FROM patients ORDER BY registered_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = PatientModel;