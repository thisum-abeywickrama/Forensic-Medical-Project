import request from "supertest";
import app from "../app.js";
import MlrModel from "../models/MlrModel.js";
import jwt from "jsonwebtoken";
import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";

process.env.JWT_SECRET_KEY = "test-secret-key-for-jest";

describe("MLR Controller & Routes", () => {
    let getMlrByIdSpy;
    let createMlrReportSpy;
    let updateMlrReportSpy;
    let getAllMlrReportsSpy;
    let doctorToken;

    beforeEach(() => {
        getMlrByIdSpy = jest.spyOn(MlrModel, "getMlrById");
        createMlrReportSpy = jest.spyOn(MlrModel, "createMlrReport");
        updateMlrReportSpy = jest.spyOn(MlrModel, "updateMlrReport");
        getAllMlrReportsSpy = jest.spyOn(MlrModel, "getAllMlrReports");
        doctorToken = jwt.sign(
            { id: "USR-1002", role: "doctor", name: "Dr. Hansara" },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("1. GET /api/mlr - Reject unauthorized access", async () => {
        const response = await request(app).get("/api/mlr");
        expect(response.status).toBe(401);
    });

    test("2. GET /api/mlr - Return all MLR reports", async () => {
        const mockReports = [{ id: "MLR-2026-1000", patientId: "p-2026-1000" }];
        getAllMlrReportsSpy.mockResolvedValue(mockReports);

        const response = await request(app)
            .get("/api/mlr")
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReports);
    });

    test("3. GET /api/mlr/:id - Return report if found", async () => {
        const mockReport = { id: "MLR-2026-1000", patientId: "p-2026-1000" };
        getMlrByIdSpy.mockResolvedValue(mockReport);

        const response = await request(app)
            .get("/api/mlr/MLR-2026-1000")
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockReport);
    });

    test("4. GET /api/mlr/:id - Return 404 if not found", async () => {
        getMlrByIdSpy.mockResolvedValue(null);

        const response = await request(app)
            .get("/api/mlr/MLR-2026-nonexistent")
            .set("Authorization", `Bearer ${doctorToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("MLR report not found");
    });

    test("5. POST /api/mlr - Save new MLR report successfully", async () => {
        const inputData = {
            id: "MLR-2026-1000",
            patientId: "p-2026-1000",
            notes: "Court report",
            injuries: [{ no: "1", description: "Bruising on the left forearm" }]
        };
        getMlrByIdSpy
            .mockResolvedValueOnce(null) // first call: doesn't exist
            .mockResolvedValueOnce(inputData); // second call: return saved report
        createMlrReportSpy.mockResolvedValue("MLR-2026-1000");

        const response = await request(app)
            .post("/api/mlr")
            .set("Authorization", `Bearer ${doctorToken}`)
            .send(inputData);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(inputData);
    });

    test("6. POST /api/mlr - Reject an incomplete injury before attempting a database write", async () => {
        const response = await request(app)
            .post("/api/mlr")
            .set("Authorization", `Bearer ${doctorToken}`)
            .send({
                id: "MLR-2026-1001",
                patientId: "p-2026-1000",
                injuries: [{ no: "1", description: "" }]
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Each injury must include both an injury number and description");
        expect(getMlrByIdSpy).not.toHaveBeenCalled();
        expect(createMlrReportSpy).not.toHaveBeenCalled();
    });
});
