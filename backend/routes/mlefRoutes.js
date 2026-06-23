import express from "express";
import { saveMlefForm, getAllMlefForms, getMlefById } from "../controllers/mlefController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, saveMlefForm);
router.get("/", authenticate, getAllMlefForms);
router.get("/:id", authenticate, getMlefById);

export default router;
