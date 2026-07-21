import pool from '../config/db.js';

class MlefModel {
    static async createMlefForm(m) {
        const query = `
      INSERT INTO mlef_forms (
        id, patient_id, police_station, mlef_no, date_of_issue, examinee_name, examinee_address,
        examinee_age, examinee_sex, reason_for_referring, officer_name, officer_rank, officer_reg_no,
        officer_police_station, part_a_filled_by, part_a_filled_at, hospital, ward, bht_no,
        admission_date, exam_date_time, discharge_date, exam_place, body_harm_types, internal_injuries,
        causative_weapon, causative_weapon_other, hurt_category, endangers_life, alcohol_exam,
        drugs_exam, sexual_assault_signs, brief_history, exam_findings, investigations, referrals,
        other_opinions, remarks, doctor_name, doctor_qualifications, slmc_reg_no, doctor_designation,
        ref_no, part_a_pdf_url, part_b_pdf_url, part_b_filled_by, part_b_filled_at, lab_request_id, status, created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
        $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50
      )
      RETURNING *;
    `;
        const values = [
            m.id, m.patientId, m.policeStation, m.mlefNo, m.dateOfIssue, m.examineeName, m.examineeAddress,
            m.examineeAge, m.examineeSex, m.reasonForReferring, m.officerName, m.officerRank, m.officerRegNo,
            m.officerPoliceStation, m.partAFilledBy, m.partAFilledAt, m.hospital, m.ward, m.bhtNo,
            m.admissionDate, m.examDateTime, m.dischargeDate, m.examPlace, m.bodyHarmTypes, m.internalInjuries,
            m.causativeWeapon, m.causativeWeaponOther, m.hurtCategory, m.endangersLife, m.alcoholExam,
            m.drugsExam, m.sexualAssaultSigns, m.briefHistory, m.examFindings, m.investigations, m.referrals,
            m.otherOpinions, m.remarks, m.doctorName, m.doctorQualifications, m.slmcRegNo, m.doctorDesignation,
            m.refNo, m.partAPdfUrl || m.part_a_pdf_url, m.partBPdfUrl || m.part_b_pdf_url, m.partBFilledBy, m.partBFilledAt, m.labRequestId, m.status, m.createdBy
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async updateMlefForm(id, m) {
        const query = `
      UPDATE mlef_forms SET
        police_station = $1, mlef_no = $2, date_of_issue = $3, examinee_name = $4, examinee_address = $5,
        examinee_age = $6, examinee_sex = $7, reason_for_referring = $8, officer_name = $9, officer_rank = $10,
        officer_reg_no = $11, officer_police_station = $12, part_a_filled_by = $13, part_a_filled_at = $14,
        hospital = $15, ward = $16, bht_no = $17, admission_date = $18, exam_date_time = $19,
        discharge_date = $20, exam_place = $21, body_harm_types = $22, internal_injuries = $23,
        causative_weapon = $24, causative_weapon_other = $25, hurt_category = $26, endangers_life = $27,
        alcohol_exam = $28, drugs_exam = $29, sexual_assault_signs = $30, brief_history = $31,
        exam_findings = $32, investigations = $33, referrals = $34, other_opinions = $35,
        remarks = $36, doctor_name = $37, doctor_qualifications = $38, slmc_reg_no = $39,
        doctor_designation = $40, ref_no = $41, part_a_pdf_url = $42, part_b_pdf_url = $43,
        part_b_filled_by = $44, part_b_filled_at = $45, lab_request_id = $46, status = $47
      WHERE id = $48
      RETURNING *;
    `;
        const values = [
            m.policeStation, m.mlefNo, m.dateOfIssue, m.examineeName, m.examineeAddress,
            m.examineeAge, m.examineeSex, m.reasonForReferring, m.officerName, m.officerRank,
            m.officerRegNo, m.officerPoliceStation, m.partAFilledBy, m.partAFilledAt,
            m.hospital, m.ward, m.bhtNo, m.admissionDate, m.examDateTime,
            m.dischargeDate, m.examPlace, m.bodyHarmTypes, m.internalInjuries,
            m.causativeWeapon, m.causativeWeaponOther, m.hurtCategory, m.endangersLife,
            m.alcoholExam, m.drugsExam, m.sexualAssaultSigns, m.briefHistory,
            m.examFindings, m.investigations, m.referrals, m.otherOpinions,
            m.remarks, m.doctorName, m.doctorQualifications, m.slmcRegNo,
            m.doctorDesignation, m.refNo, m.partAPdfUrl || m.part_a_pdf_url, m.partBPdfUrl || m.part_b_pdf_url,
            m.partBFilledBy, m.partBFilledAt, m.labRequestId, m.status, id
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getMlefById(id) {
        const query = `SELECT * FROM mlef_forms WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getAllMlefForms() {
        const query = `SELECT * FROM mlef_forms ORDER BY created_at DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default MlefModel;