import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { jest, describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import pool from "../config/db.js";
import PatientModel from "../models/PatientModel.js";
import MlrModel from "../models/MlrModel.js";
import MlefModel from "../models/MlefModel.js";
import LabModel from "../models/LabModel.js";
import PmrModel from "../models/PmrModel.js";

// Load environment variables for the test if not already loaded
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

describe("Database Integration Tests (1NF & 3NF Compliance)", () => {
    // Prefix for test IDs to safely delete them later
    const TEST_PREFIX = "TEST-INT-";
    const patientId = `${TEST_PREFIX}PATIENT`;
    const mlrId = `${TEST_PREFIX}MLR`;
    const mlefId = `${TEST_PREFIX}MLEF`;
    const labId = `${TEST_PREFIX}LAB`;
    const pmrId = `${TEST_PREFIX}PMR`;

    // Ensure database connection is valid before running tests
    beforeAll(async () => {
        try {
            await pool.query("SELECT 1");
        } catch (error) {
            console.error("Failed to connect to the database. Ensure .env is correct.", error);
            throw error;
        }
    });

    afterAll(async () => {
        // Clean up test data
        try {
            // Because of foreign key constraints, order of deletion matters, 
            // but since we are deleting by prefix, we can delete in order of dependency.
            await pool.query(`DELETE FROM pmr_forms WHERE id LIKE $1`, [`${TEST_PREFIX}%`]);
            await pool.query(`DELETE FROM mlr_reports WHERE id LIKE $1`, [`${TEST_PREFIX}%`]);
            await pool.query(`DELETE FROM mlef_forms WHERE id LIKE $1`, [`${TEST_PREFIX}%`]);
            await pool.query(`DELETE FROM lab_requests WHERE id LIKE $1`, [`${TEST_PREFIX}%`]);
            await pool.query(`DELETE FROM patients WHERE id LIKE $1`, [`${TEST_PREFIX}%`]);
        } catch (error) {
            console.error("Cleanup failed:", error);
        } finally {
            await pool.end();
        }
    });

    test("1. PatientModel - Insert and Retrieve with 3NF FK (registered_by_id)", async () => {
        const patientData = {
            id: patientId,
            name: "Test Patient",
            dob: "1990-01-01",
            sex: "Male",
            address: "Test Address",
            nic: "123456789V",
            email: "test@example.com",
            phone: "0770000000",
            registeredBy: "a1", // This is the ID of Nimal Silva in seed-db
            registeredAt: new Date().toISOString()
        };

        // Create
        await PatientModel.createPatient(patientData);

        // Retrieve
        const fetched = await PatientModel.getPatientById(patientId);
        
        expect(fetched).toBeDefined();
        expect(fetched.id).toBe(patientId);
        // The LEFT JOIN should have resolved 'a1' to 'Nimal Silva'
        expect(fetched.registered_by).toBe("Nimal Silva");
    });

    test("2. MlrModel - Insert and Retrieve 1NF Child Tables & string_agg", async () => {
        const mlrData = {
            id: mlrId,
            patientId: patientId,
            deathCausingCount: "1",
            specialInvestigations: "None",
            furtherNotes: "Test Notes",
            patientSmellLiquor: "No",
            underInfluenceLiquor: "No",
            doctorName: "d1", // ID of Dr. Amal Perera
            dateOfDespatch: "2026-07-20",
            status: "draft",
            createdBy: "d1",
            
            // These should be inserted into child tables, and retrieved as comma separated strings
            bluntWeaponNos: "1, 2, 5",
            cutNos: "3",
            sharpCuttingNos: "4, 6"
        };

        // Create
        await MlrModel.createMlrReport(mlrData, [], []); // empty injuries arrays for simplicity

        // Retrieve
        const fetched = await MlrModel.getMlrById(mlrId);
        
        expect(fetched).toBeDefined();
        expect(fetched.id).toBe(mlrId);
        
        // Check 3NF resolution for doctorName
        expect(fetched.doctor_name).toBe("Dr. Amal Perera");
        
        // Check 1NF child table aggregation (order might vary, so we check inclusion or match)
        expect(fetched.blunt_weapon_nos.includes("1")).toBe(true);
        expect(fetched.blunt_weapon_nos.includes("2")).toBe(true);
        expect(fetched.blunt_weapon_nos.includes("5")).toBe(true);
        
        expect(fetched.cut_nos).toBe("3");
        
        expect(fetched.sharp_cutting_nos.includes("4")).toBe(true);
        expect(fetched.sharp_cutting_nos.includes("6")).toBe(true);
        
        // Ensure empty fields return correctly and don't break
        expect(fetched.stab_nos).toBe("");
    });

    test("3. MlefModel - Insert and Retrieve with 3NF FK", async () => {
        const mlefData = {
            id: mlefId,
            patientId: patientId,
            policeStation: "Test Station",
            mlefNo: "MLEF/TEST/1",
            dateOfIssue: "2026-07-20",
            reasonForReferring: "Test Reason",
            officerRegNo: "PS/7890",
            
            partAFilledBy: "a2", // ID of Kamani Dissanayake
            partAFilledAt: new Date().toISOString(),
            partBFilledBy: "d2", // ID of Dr. Saman Fernando
            
            // Child table arrays
            bodyHarmTypes: ["laceration", "abrasion"],
            causativeWeapon: ["blunt"]
        };

        await MlefModel.createMlefForm(mlefData);

        const fetched = await MlefModel.getMlefById(mlefId);
        
        expect(fetched).toBeDefined();
        expect(fetched.id).toBe(mlefId);
        
        // Check 3NF resolution
        expect(fetched.part_a_filled_by).toBe("Kamani Dissanayake");
        expect(fetched.doctor_name).toBe("Dr. Saman Fernando");
        
        // Check array JSON fetching
        expect(fetched.body_harm_types).toContain("laceration");
        expect(fetched.body_harm_types).toContain("abrasion");
    });

    test("4. LabModel - Insert and Retrieve with 3NF FK", async () => {
        const labData = {
            id: labId,
            patientId: patientId,
            requestedBy: "d1",
            formType: "mlef",
            formId: mlefId,
            urgency: "routine",
            clinicalHistory: "Test History",
            status: "pending",
            testTypes: ["blood", "urine"]
        };

        await LabModel.createLabRequest(labData);

        const updateData = {
            labTechName: "l1", // ID for Chaminda Wickramasinghe, mapped to lab_tech_id inside model
            status: "completed",
            testResults: "All clear"
        };
        
        await LabModel.updateLabRequest(labId, updateData);

        const fetched = await LabModel.getLabRequestById(labId);
        
        expect(fetched).toBeDefined();
        // Check 3NF resolution for requestedBy
        expect(fetched.requested_by_name).toBe("Dr. Amal Perera");
        // Check 3NF resolution for lab tech
        expect(fetched.lab_tech_name).toBe("Chaminda Wickramasinghe");
    });

    test("5. PmrModel - Insert and Retrieve with 3NF FK", async () => {
        const pmrData = {
            id: pmrId,
            patientId: patientId,
            inquestNo: "INQ/TEST",
            doctorConducting: "j1", // ID for Dr. Ruwan Perera
            jmoName: "j1",
            status: "draft",
            createdBy: "j1"
        };

        await PmrModel.createPmrReport(pmrData, []);

        const fetched = await PmrModel.getPmrById(pmrId);
        
        expect(fetched).toBeDefined();
        expect(fetched.doctor_conducting).toBe("Dr. Ruwan Perera");
        expect(fetched.jmo_name).toBe("Dr. Ruwan Perera");
    });
});
