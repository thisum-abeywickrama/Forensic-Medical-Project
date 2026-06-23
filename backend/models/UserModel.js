import pool from '../config/db.js';

class UserModel {
    static async createUser(userData) {
        const query = `
      INSERT INTO users (id, name, role, designation, email, phone, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, role, email, phone, designation;
    `;
        const values = [
            userData.id, userData.name, userData.role,
            userData.designation, userData.email,
            userData.phone, userData.passwordHash
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
        const query = `SELECT id, name, role, designation, email, phone FROM users ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default UserModel;