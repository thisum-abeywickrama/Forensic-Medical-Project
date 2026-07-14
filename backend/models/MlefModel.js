import pool from '../config/db.js';

class MlefModel {
    static async createMlefForm(m) {
        const query = `
      INSERT INTO mlef_forms (
        id, patient_id, police_station, mlef_no, date_of_issue, reason_for_referring, officer_reg_no,
        part_a_filled_by, part_a_filled_at, hospital, ward, bht_no,
        admission_date, exam_date_time, discharge_date, exam_place, body_harm_types, internal_injuries,
        causative_weapon, causative_weapon_other, hurt_category, endangers_life, alcohol_exam,
        drugs_exam, sexual_assault_signs, brief_history, exam_findings, investigations, referrals,
        other_opinions, remarks, ref_no, part_b_filled_by, part_b_filled_at, lab_request_id, status, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
      )
      RETURNING *;
    `;
        const values = [
            m.id, m.patientId, m.policeStation, m.mlefNo, m.dateOfIssue, m.reasonForReferring, m.officerRegNo,
            m.partAFilledBy, m.partAFilledAt, m.hospital, m.ward, m.bhtNo,
            m.admissionDate, m.examDateTime, m.dischargeDate, m.examPlace, m.bodyHarmTypes, m.internalInjuries,
            m.causativeWeapon, m.causativeWeaponOther, m.hurtCategory, m.endangersLife, m.alcoholExam,
            m.drugsExam, m.sexualAssaultSigns, m.briefHistory, m.examFindings, m.investigations, m.referrals,
            m.otherOpinions, m.remarks, m.refNo, m.partBFilledBy, m.partBFilledAt, m.labRequestId, m.status, m.createdBy
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async updateMlefForm(id, m) {
        const query = `
      UPDATE mlef_forms SET
        police_station = $1, mlef_no = $2, date_of_issue = $3, reason_for_referring = $4,
        officer_reg_no = $5, part_a_filled_by = $6, part_a_filled_at = $7,
        hospital = $8, ward = $9, bht_no = $10, admission_date = $11, exam_date_time = $12,
        discharge_date = $13, exam_place = $14, body_harm_types = $15, internal_injuries = $16,
        causative_weapon = $17, causative_weapon_other = $18, hurt_category = $19, endangers_life = $20,
        alcohol_exam = $21, drugs_exam = $22, sexual_assault_signs = $23, brief_history = $24,
        exam_findings = $25, investigations = $26, referrals = $27, other_opinions = $28,
        remarks = $29, ref_no = $30, part_b_filled_by = $31, part_b_filled_at = $32,
        lab_request_id = $33, status = $34
      WHERE id = $35
      RETURNING *;
    `;
        const values = [
            m.policeStation, m.mlefNo, m.dateOfIssue, m.reasonForReferring,
            m.officerRegNo, m.partAFilledBy, m.partAFilledAt,
            m.hospital, m.ward, m.bhtNo, m.admissionDate, m.examDateTime,
            m.dischargeDate, m.examPlace, m.bodyHarmTypes, m.internalInjuries,
            m.causativeWeapon, m.causativeWeaponOther, m.hurtCategory, m.endangersLife,
            m.alcoholExam, m.drugsExam, m.sexualAssaultSigns, m.briefHistory,
            m.examFindings, m.investigations, m.referrals, m.otherOpinions,
            m.remarks, m.refNo, m.partBFilledBy, m.partBFilledAt,
            m.labRequestId, m.status, id
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getMlefById(id) {
        const query = `
          SELECT 
            m.*,
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
            u.designation AS doctor_designation
          FROM mlef_forms m
          LEFT JOIN patients p ON m.patient_id = p.id
          LEFT JOIN police_officers po ON m.officer_reg_no = po.reg_no
          LEFT JOIN users u ON m.part_b_filled_by = u.id
          WHERE m.id = $1;
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllMlefForms() {
        const query = `
          SELECT 
            m.*,
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
            u.designation AS doctor_designation
          FROM mlef_forms m
          LEFT JOIN patients p ON m.patient_id = p.id
          LEFT JOIN police_officers po ON m.officer_reg_no = po.reg_no
          LEFT JOIN users u ON m.part_b_filled_by = u.id
          ORDER BY m.created_at DESC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default MlefModel;