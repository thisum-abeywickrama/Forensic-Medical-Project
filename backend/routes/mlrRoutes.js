import express from "express";
import { saveMlrReport, getAllMlrReports, getMlrById } from "../controllers/mlrController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, saveMlrReport);
router.get("/", authenticate, getAllMlrReports);
router.get("/:id", authenticate, getMlrById);

export default router;
