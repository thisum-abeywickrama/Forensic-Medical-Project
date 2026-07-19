import pool from '../config/db.js';

class UserModel {
    static async createUser(userData) {
        const query = `
      INSERT INTO users (id, name, role, designation, email, phone, password_hash, profile_picture_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, role, email, phone, designation, profile_picture_url;
    `;
        const values = [
            userData.id, userData.name, userData.role,
            userData.designation, userData.email,
            userData.phone, userData.passwordHash, userData.profilePictureUrl
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getUserByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1;`;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async setVerificationCode(email, codeHash, expiresAt) {
        const query = `
      UPDATE users
      SET verification_code_hash = $2,
          verification_expires_at = $3,
          verification_sent_at = CURRENT_TIMESTAMP,
          verification_attempts = 0
      WHERE email = $1;
    `;
        await pool.query(query, [email, codeHash, expiresAt]);
    }

    static async incrementVerificationAttempts(email) {
        const query = `
      UPDATE users
      SET verification_attempts = verification_attempts + 1
      WHERE email = $1
      RETURNING verification_attempts;
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0]?.verification_attempts ?? 0;
    }

    static async markEmailVerified(email) {
        const query = `
      UPDATE users
      SET email_verified = TRUE,
          verification_code_hash = NULL,
          verification_expires_at = NULL,
          verification_attempts = 0
      WHERE email = $1
      RETURNING id, name, role, designation, email, profile_picture_url;
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async setResetCode(email, codeHash, expiresAt) {
        const query = `
      UPDATE users
      SET reset_code_hash = $2,
          reset_expires_at = $3,
          reset_sent_at = CURRENT_TIMESTAMP,
          reset_attempts = 0
      WHERE email = $1;
    `;
        await pool.query(query, [email, codeHash, expiresAt]);
    }

    static async incrementResetAttempts(email) {
        const query = `
      UPDATE users
      SET reset_attempts = reset_attempts + 1
      WHERE email = $1
      RETURNING reset_attempts;
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0]?.reset_attempts ?? 0;
    }

    /**
     * Apply a new password and clear the reset challenge in one statement, so a
     * code can never be reused. Completing a reset also proves control of the
     * inbox, which is exactly what email verification checks — so mark it verified.
     */
    static async updatePassword(email, passwordHash) {
        const query = `
      UPDATE users
      SET password_hash = $2,
          reset_code_hash = NULL,
          reset_expires_at = NULL,
          reset_attempts = 0,
          email_verified = TRUE,
          verification_code_hash = NULL,
          verification_expires_at = NULL
      WHERE email = $1
      RETURNING id, name, role, designation, email, profile_picture_url;
    `;
        const result = await pool.query(query, [email, passwordHash]);
        return result.rows[0];
    }

    static async getAllUsers() {
        const query = `SELECT id, name, role, designation, email, phone, profile_picture_url FROM users ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default UserModel;