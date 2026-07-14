import pool from '../config/db.js';

class MlefModel {
    static async createMlefForm(m) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
      INSERT INTO mlef_forms (
        id, patient_id, police_station, mlef_no, date_of_issue, reason_for_referring, officer_reg_no,
        part_a_filled_by_id, part_a_filled_at, hospital, ward, bht_no,
        admission_date, exam_date_time, discharge_date, exam_place, internal_injuries,
        causative_weapon_other, hurt_category, endangers_life, alcohol_exam,
        drugs_exam, brief_history, exam_findings, investigations, referrals,
        other_opinions, remarks, ref_no, part_b_filled_by, part_b_filled_at, lab_request_id, status, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      )
      RETURNING *;
    `;
            const values = [
                m.id, m.patientId, m.policeStation, m.mlefNo, m.dateOfIssue, m.reasonForReferring, m.officerRegNo,
                m.partAFilledBy, m.partAFilledAt, m.hospital, m.ward, m.bhtNo,
                m.admissionDate, m.examDateTime, m.dischargeDate, m.examPlace, m.internalInjuries,
                m.causativeWeaponOther, m.hurtCategory, m.endangersLife, m.alcoholExam,
                m.drugsExam, m.briefHistory, m.examFindings, m.investigations, m.referrals,
                m.otherOpinions, m.remarks, m.refNo, m.partBFilledBy, m.partBFilledAt, m.labRequestId, m.status, m.createdBy
            ];

            await client.query(query, values);

            // Insert child rows for arrays
            if (m.bodyHarmTypes && m.bodyHarmTypes.length > 0) {
                for (const v of m.bodyHarmTypes) {
                    await client.query('INSERT INTO mlef_body_harm_types (mlef_id, value) VALUES ($1, $2)', [m.id, v]);
                }
            }
            if (m.causativeWeapon && m.causativeWeapon.length > 0) {
                for (const v of m.causativeWeapon) {
                    await client.query('INSERT INTO mlef_causative_weapons (mlef_id, value) VALUES ($1, $2)', [m.id, v]);
                }
            }
            if (m.sexualAssaultSigns && m.sexualAssaultSigns.length > 0) {
                for (const v of m.sexualAssaultSigns) {
                    await client.query('INSERT INTO mlef_sexual_assault_signs (mlef_id, value) VALUES ($1, $2)', [m.id, v]);
                }
            }

            await client.query('COMMIT');
            return m.id;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateMlefForm(id, m) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
      UPDATE mlef_forms SET
        police_station = $1, mlef_no = $2, date_of_issue = $3, reason_for_referring = $4,
        officer_reg_no = $5, part_a_filled_by_id = $6, part_a_filled_at = $7,
        hospital = $8, ward = $9, bht_no = $10, admission_date = $11, exam_date_time = $12,
        discharge_date = $13, exam_place = $14, internal_injuries = $15,
        causative_weapon_other = $16, hurt_category = $17, endangers_life = $18,
        alcohol_exam = $19, drugs_exam = $20, brief_history = $21,
        exam_findings = $22, investigations = $23, referrals = $24, other_opinions = $25,
        remarks = $26, ref_no = $27, part_b_filled_by = $28, part_b_filled_at = $29,
        lab_request_id = $30, status = $31
      WHERE id = $32
      RETURNING *;
    `;
            const values = [
                m.policeStation, m.mlefNo, m.dateOfIssue, m.reasonForReferring,
                m.officerRegNo, m.partAFilledBy, m.partAFilledAt,
                m.hospital, m.ward, m.bhtNo, m.admissionDate, m.examDateTime,
                m.dischargeDate, m.examPlace, m.internalInjuries,
                m.causativeWeaponOther, m.hurtCategory, m.endangersLife,
                m.alcoholExam, m.drugsExam, m.briefHistory,
                m.examFindings, m.investigations, m.referrals, m.otherOpinions,
                m.remarks, m.refNo, m.partBFilledBy, m.partBFilledAt,
                m.labRequestId, m.status, id
            ];

            await client.query(query, values);

            // Delete old child rows and re-insert
            await client.query('DELETE FROM mlef_body_harm_types WHERE mlef_id = $1', [id]);
            await client.query('DELETE FROM mlef_causative_weapons WHERE mlef_id = $1', [id]);
            await client.query('DELETE FROM mlef_sexual_assault_signs WHERE mlef_id = $1', [id]);

            if (m.bodyHarmTypes && m.bodyHarmTypes.length > 0) {
                for (const v of m.bodyHarmTypes) {
                    await client.query('INSERT INTO mlef_body_harm_types (mlef_id, value) VALUES ($1, $2)', [id, v]);
                }
            }
            if (m.causativeWeapon && m.causativeWeapon.length > 0) {
                for (const v of m.causativeWeapon) {
                    await client.query('INSERT INTO mlef_causative_weapons (mlef_id, value) VALUES ($1, $2)', [id, v]);
                }
            }
            if (m.sexualAssaultSigns && m.sexualAssaultSigns.length > 0) {
                for (const v of m.sexualAssaultSigns) {
                    await client.query('INSERT INTO mlef_sexual_assault_signs (mlef_id, value) VALUES ($1, $2)', [id, v]);
                }
            }

            await client.query('COMMIT');
            return id;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getMlefById(id) {
        const query = `
          SELECT 
            m.*,
            ua.name AS part_a_filled_by,
            p.name AS examinee_name,
            p.address AS examinee_address,
            p.sex AS examinee_sex,
            EXTRACT(YEAR FROM age(m.date_of_issue, p.dob)) AS examinee_age,
            po.name AS officer_name,
            po.rank AS officer_rank,
            po.police_station AS officer_police_station,
            u.name AS doctor_name,
            u.qualifications AS doctor_qualifications,
            u.slmc_reg_no AS slmc_reg_no,
            u.designation AS doctor_designation,
            COALESCE(
              (SELECT json_agg(bh.value) FROM mlef_body_harm_types bh WHERE bh.mlef_id = m.id), '[]'
            ) AS body_harm_types,
            COALESCE(
              (SELECT json_agg(cw.value) FROM mlef_causative_weapons cw WHERE cw.mlef_id = m.id), '[]'
            ) AS causative_weapon,
            COALESCE(
              (SELECT json_agg(sa.value) FROM mlef_sexual_assault_signs sa WHERE sa.mlef_id = m.id), '[]'
            ) AS sexual_assault_signs
          FROM mlef_forms m
          LEFT JOIN patients p ON m.patient_id = p.id
          LEFT JOIN police_officers po ON m.officer_reg_no = po.reg_no
          LEFT JOIN users u ON m.part_b_filled_by = u.id
          LEFT JOIN users ua ON m.part_a_filled_by_id = ua.id
          WHERE m.id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllMlefForms() {
        const query = `
          SELECT 
            m.*,
            ua.name AS part_a_filled_by,
            p.name AS examinee_name,
            p.address AS examinee_address,
            p.sex AS examinee_sex,
            EXTRACT(YEAR FROM age(m.date_of_issue, p.dob)) AS examinee_age,
            po.name AS officer_name,
            po.rank AS officer_rank,
            po.police_station AS officer_police_station,
            u.name AS doctor_name,
            u.qualifications AS doctor_qualifications,
            u.slmc_reg_no AS slmc_reg_no,
            u.designation AS doctor_designation,
            COALESCE(
              (SELECT json_agg(bh.value) FROM mlef_body_harm_types bh WHERE bh.mlef_id = m.id), '[]'
            ) AS body_harm_types,
            COALESCE(
              (SELECT json_agg(cw.value) FROM mlef_causative_weapons cw WHERE cw.mlef_id = m.id), '[]'
            ) AS causative_weapon,
            COALESCE(
              (SELECT json_agg(sa.value) FROM mlef_sexual_assault_signs sa WHERE sa.mlef_id = m.id), '[]'
            ) AS sexual_assault_signs
          FROM mlef_forms m
          LEFT JOIN patients p ON m.patient_id = p.id
          LEFT JOIN police_officers po ON m.officer_reg_no = po.reg_no
          LEFT JOIN users u ON m.part_b_filled_by = u.id
          LEFT JOIN users ua ON m.part_a_filled_by_id = ua.id
          ORDER BY m.created_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default MlefModel;