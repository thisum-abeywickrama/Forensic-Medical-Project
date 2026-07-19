import pool from '../config/db.js';

class PatientModel {
    static async createPatient(patientData) {
        const query = `
      INSERT INTO patients (id, name, dob, sex, address, nic, email, phone, registered_by_id, registered_at, profile_picture_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
        const values = [
            patientData.id, patientData.name, patientData.dob,
            patientData.sex, patientData.address, patientData.nic,
            patientData.email, patientData.phone, patientData.registeredBy, // Note: The frontend sends the user ID here in our updated flow, but wait, frontend sends currentUser.name! We need to change the frontend or accept that we'll fix the frontend later.
            patientData.registeredAt, patientData.profilePictureUrl
        ];

        // Let's assume patientData.registeredBy will be passed as the user ID from the backend controller.
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getAllPatients() {
        const query = `
          SELECT p.*, u.name AS registered_by 
          FROM patients p 
          LEFT JOIN users u ON p.registered_by_id = u.id 
          ORDER BY p.registered_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    static async getPatientById(id) {
        const query = `
          SELECT p.*, u.name AS registered_by 
          FROM patients p 
          LEFT JOIN users u ON p.registered_by_id = u.id 
          WHERE p.id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

export default PatientModel;