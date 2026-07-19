import bcrypt from 'bcrypt';
import pool from './config/db.js';

const USERS = [
  { id: "d1", name: "Dr. Amal Perera", role: "doctor", designation: "Medical Officer", qualifications: "MBBS", slmcRegNo: "SLMC/12345", station: "NHC", email: "dr.perera@forensic.gov", phone: "0771234567", password: "Doctor@123" },
  { id: "d2", name: "Dr. Saman Fernando", role: "doctor", designation: "Senior Medical Officer", qualifications: "MBBS, MD", slmcRegNo: "SLMC/23456", station: "NHC", email: "dr.fernando@forensic.gov", phone: "0772345678", password: "Doctor@456" },
  { id: "a1", name: "Nimal Silva", role: "admin", designation: "Admin Officer", qualifications: null, slmcRegNo: null, station: null, email: "nimal.silva@forensic.gov", phone: "0773456789", password: "Admin@123" },
  { id: "a2", name: "Kamani Dissanayake", role: "admin", designation: "Police Officer", qualifications: null, slmcRegNo: null, station: null, email: "kamani.d@forensic.gov", phone: "0774567890", password: "Admin@456" },
  { id: "l1", name: "Chaminda Wickramasinghe", role: "lab", designation: "Lab Technician", qualifications: null, slmcRegNo: null, station: null, email: "chaminda.w@forensic.gov", phone: "0775678901", password: "Lab@123" },
  { id: "l2", name: "Dilini Jayawardena", role: "lab", designation: "Senior Lab Technician", qualifications: null, slmcRegNo: null, station: null, email: "dilini.j@forensic.gov", phone: "0776789012", password: "Lab@456" },
  { id: "j1", name: "Dr. Ruwan Perera", role: "jmo", designation: "Judicial Medical Officer", qualifications: "MBBS, DLM", slmcRegNo: "SLMC/34567", station: "NHC", email: "dr.ruwan@forensic.gov", phone: "0777890123", password: "Jmo@123" },
];

const POLICE_OFFICERS = [
  { regNo: "PS/7890", name: "Nimal Silva", rank: "Sub Inspector", policeStation: "Colombo Fort" }
];

const PATIENTS = [
  { id: "P2026-001", name: "Ruwan Kumara", dob: "1985-03-15", sex: "Male", address: "123 Galle Road, Colombo 03", nic: "851530423V", email: "ruwan.k@gmail.com", phone: "0711234567", registeredAt: "2026-06-20T08:30:00Z", registeredBy: "a1" },
  { id: "P2026-002", name: "Shamila Perera", dob: "1992-07-22", sex: "Female", address: "45 Kandy Road, Kurunegala", nic: "927040756V", email: "shamila.p@gmail.com", phone: "0712345678", registeredAt: "2026-06-21T09:15:00Z", registeredBy: "a2" },
  { id: "P2026-003", name: "Ajith Bandara", dob: "1978-11-08", sex: "Male", address: "78 Negombo Road, Wattala", nic: "782130589V", email: "ajith.b@gmail.com", phone: "0713456789", registeredAt: "2026-06-21T10:00:00Z", registeredBy: "a1" },
];

const MLEFS = [{
  id: "MLEF-2026-001", patientId: "P2026-001",
  policeStation: "Colombo Fort", mlefNo: "CF/2026/1234", dateOfIssue: "2026-06-20",
  reasonForReferring: "Assault causing bodily harm — section 314 of Penal Code",
  officerRegNo: "PS/7890",
  partAFilledBy: "a1", partAFilledAt: "2026-06-20T08:30:00Z",
  hospital: "National Hospital Colombo", ward: "Surgical Ward 5", bhtNo: "23181",
  admissionDate: "2026-06-20", examDateTime: "2026-06-20T09:40:00Z",
  dischargeDate: null, examPlace: "NHC",
  bodyHarmTypes: ["laceration", "contusion", "abrasion"], internalInjuries: "Nil",
  causativeWeapon: ["blunt"], causativeWeaponOther: "", hurtCategory: "non-grievous", endangersLife: "no",
  alcoholExam: "negative", drugsExam: "negative", sexualAssaultSigns: [],
  briefHistory: "Patient states he was attacked by unknown persons at around 8:00 PM on 19/06/2026 near Maradana Junction.",
  examFindings: "Multiple lacerations over scalp (3cm × 0.5cm), contusions on upper arms and back, abrasions on knees.",
  investigations: "X-Ray skull, X-Ray chest", referrals: "Nil",
  otherOpinions: "Injuries are consistent with blunt force trauma.",
  remarks: "Patient cooperative for examination.",
  refNo: "NHC/MLR/2026/001",
  partBFilledBy: "d1", partBFilledAt: "2026-06-20T10:15:00Z", labRequestId: null,
  status: "complete", createdAt: "2026-06-20T08:30:00Z", createdBy: "d1",
}];

const LAB_REQUESTS = [{
  id: "LAB-2026-001", patientId: "P2026-002",
  requestedBy: "d2",
  requestedAt: "2026-06-21T10:30:00Z", formType: "mlef", formId: "MLEF-2026-001",
  testTypes: ["blood_alcohol", "drug_screen"], urgency: "urgent",
  clinicalHistory: "Patient brought by police. Alleged assault. Suspected alcohol consumption.",
  status: "pending", testResults: null, observations: null, conclusion: null, labTechId: null, completedAt: null,
}];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Beginning transaction...");
    await client.query("BEGIN");

    console.log("Clearing existing tables...");
    await client.query("TRUNCATE lab_request_test_types, lab_requests, pmr_identifiers, pmr_forms, mlr_grievous_entries, mlr_injuries, mlr_non_grievous_nos, mlr_reports, mlef_body_harm_types, mlef_causative_weapons, mlef_sexual_assault_signs, mlef_forms, police_officers, patients, users CASCADE;");

    console.log("Seeding users...");
    const saltRounds = 10;
    for (const u of USERS) {
      const passwordHash = await bcrypt.hash(u.password, saltRounds);
      // Seeded demo accounts are pre-verified: their addresses are placeholders
      // that cannot receive mail. Real accounts verify via the login flow.
      const userQuery = `
        INSERT INTO users (id, name, role, designation, qualifications, slmc_reg_no, station, email, phone, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await client.query(userQuery, [u.id, u.name, u.role, u.designation, u.qualifications, u.slmcRegNo, u.station, u.email, u.phone, passwordHash]);
    }

    console.log("Seeding police officers...");
    for (const po of POLICE_OFFICERS) {
      const poQuery = `
        INSERT INTO police_officers (reg_no, name, rank, police_station)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(poQuery, [po.regNo, po.name, po.rank, po.policeStation]);
    }

    console.log("Seeding patients...");
    for (const p of PATIENTS) {
      const patientQuery = `
        INSERT INTO patients (id, name, dob, sex, address, nic, email, phone, registered_by_id, registered_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await client.query(patientQuery, [p.id, p.name, p.dob, p.sex, p.address, p.nic, p.email, p.phone, p.registeredBy, p.registeredAt]);
    }

    console.log("Seeding MLEFs...");
    for (const m of MLEFS) {
      const mlefQuery = `
        INSERT INTO mlef_forms (
          id, patient_id, police_station, mlef_no, date_of_issue, reason_for_referring, officer_reg_no,
          part_a_filled_by_id, part_a_filled_at, hospital, ward, bht_no,
          admission_date, exam_date_time, discharge_date, exam_place, internal_injuries,
          causative_weapon_other, hurt_category, endangers_life, alcohol_exam,
          drugs_exam, brief_history, exam_findings, investigations, referrals,
          other_opinions, remarks, ref_no, part_b_filled_by, part_b_filled_at, lab_request_id, status, created_at, created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )
      `;
      await client.query(mlefQuery, [
        m.id, m.patientId, m.policeStation, m.mlefNo, m.dateOfIssue, m.reasonForReferring, m.officerRegNo,
        m.partAFilledBy, m.partAFilledAt, m.hospital, m.ward, m.bhtNo,
        m.admissionDate, m.examDateTime, m.dischargeDate, m.examPlace, m.internalInjuries,
        m.causativeWeaponOther, m.hurtCategory, m.endangersLife, m.alcoholExam,
        m.drugsExam, m.briefHistory, m.examFindings, m.investigations, m.referrals,
        m.otherOpinions, m.remarks, m.refNo, m.partBFilledBy, m.partBFilledAt, m.labRequestId, m.status, m.createdAt, m.createdBy
      ]);

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
    }

    console.log("Seeding lab requests...");
    for (const r of LAB_REQUESTS) {
      const labQuery = `
        INSERT INTO lab_requests (
          id, patient_id, requested_by, requested_at, form_type, form_id, 
          urgency, clinical_history, status, test_results, observations, conclusion,
          lab_tech_id, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;
      await client.query(labQuery, [
        r.id, r.patientId, r.requestedBy, r.requestedAt, r.formType, r.formId,
        r.urgency, r.clinicalHistory, r.status, r.testResults, r.observations, r.conclusion,
        r.labTechId, r.completedAt
      ]);

      if (r.testTypes && r.testTypes.length > 0) {
        for (const test of r.testTypes) {
          await client.query('INSERT INTO lab_request_test_types (lab_request_id, value) VALUES ($1, $2)', [r.id, test]);
        }
      }
    }

    await client.query("COMMIT");
    console.log("Database seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database seeding failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log("Database connection closed.");
  }
}

seed();
