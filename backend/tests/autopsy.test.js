import request from "supertest";
import app from "../app.js";
import AutopsyModel from "../models/AutopsyModel.js";
import jwt from "jsonwebtoken";
import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";

process.env.JWT_SECRET_KEY = "test-secret-key-for-jest";

describe("Autopsy Controller & Routes", () => {
    let getAutopsyByIdSpy;
    let createAutopsyFormSpy;
    let updateAutopsyFormSpy;
    let getAllAutopsyFormsSpy;
    let jmoToken;

    beforeEach(() => {
        getAutopsyByIdSpy = jest.spyOn(AutopsyModel, "getAutopsyById");
        createAutopsyFormSpy = jest.spyOn(AutopsyModel, "createAutopsyForm");
        updateAutopsyFormSpy = jest.spyOn(AutopsyModel, "updateAutopsyForm");
        getAllAutopsyFormsSpy = jest.spyOn(AutopsyModel, "getAllAutopsyForms");
        jmoToken = jwt.sign({ id: "j1", role: "jmo", name: "Dr. Ruwan Perera" }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
    });

    afterEach(() => jest.restoreAllMocks());

    test("1. GET /api/autopsy rejects unauthorized access", async () => {
        expect((await request(app).get("/api/autopsy")).status).toBe(401);
    });

    test("2. GET /api/autopsy returns all forms", async () => {
        const forms = [{ id: "AUTOPSY-2026-1000", patientId: "p-2026-1000" }];
        getAllAutopsyFormsSpy.mockResolvedValue(forms);
        const response = await request(app).get("/api/autopsy").set("Authorization", `Bearer ${jmoToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(forms);
    });

    test("3. GET /api/autopsy/:id returns a form", async () => {
        const form = { id: "AUTOPSY-2026-1000", patientId: "p-2026-1000" };
        getAutopsyByIdSpy.mockResolvedValue(form);
        const response = await request(app).get("/api/autopsy/AUTOPSY-2026-1000").set("Authorization", `Bearer ${jmoToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(form);
    });

    test("4. GET /api/autopsy/:id returns 404 when absent", async () => {
        getAutopsyByIdSpy.mockResolvedValue(null);
        const response = await request(app).get("/api/autopsy/missing").set("Authorization", `Bearer ${jmoToken}`);
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Autopsy form not found");
    });

    test("5. POST /api/autopsy creates a new form", async () => {
        const form = { id: "AUTOPSY-2026-1000", patientId: "p-2026-1000", articlesSecured: [] };
        getAutopsyByIdSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(form);
        createAutopsyFormSpy.mockResolvedValue(form.id);
        const response = await request(app).post("/api/autopsy").set("Authorization", `Bearer ${jmoToken}`).send(form);
        expect(response.status).toBe(200);
        expect(createAutopsyFormSpy).toHaveBeenCalled();
        expect(response.body).toEqual(form);
    });

    test("6. POST /api/autopsy updates an existing form", async () => {
        const form = { id: "AUTOPSY-2026-1000", patientId: "p-2026-1000", articlesSecured: [] };
        getAutopsyByIdSpy.mockResolvedValue(form);
        updateAutopsyFormSpy.mockResolvedValue(form.id);
        const response = await request(app).post("/api/autopsy").set("Authorization", `Bearer ${jmoToken}`).send(form);
        expect(response.status).toBe(200);
        expect(updateAutopsyFormSpy).toHaveBeenCalled();
    });
});
