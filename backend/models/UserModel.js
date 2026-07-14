import pool from '../config/db.js';

class UserModel {
    static async createUser(userData) {
        const query = `
      INSERT INTO users (id, name, role, designation, qualifications, slmc_reg_no, station, email, phone, password_hash, profile_picture_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, role, designation, qualifications, slmc_reg_no, station, email, phone, profile_picture_url;
    `;
        const values = [
            userData.id, userData.name, userData.role,
            userData.designation, userData.qualifications, userData.slmcRegNo, userData.station,
            userData.email, userData.phone, userData.passwordHash, userData.profilePictureUrl
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getUserByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1;`;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async getAllUsers() {
        const query = `SELECT id, name, role, designation, qualifications, slmc_reg_no, station, email, phone, profile_picture_url FROM users ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default UserModel;