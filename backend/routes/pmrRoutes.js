import express from "express";
import { savePmrReport, getAllPmrReports, getPmrById } from "../controllers/pmrController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, savePmrReport);
router.get("/", authenticate, getAllPmrReports);
router.get("/:id", authenticate, getPmrById);

export default router;
