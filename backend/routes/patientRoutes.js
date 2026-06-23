import express from "express";
import { registerPatient, getAllPatients } from "../controllers/patientController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, registerPatient);
router.get("/", authenticate, getAllPatients);

export default router;
