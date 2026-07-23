import express from "express";
import { saveAutopsyForm, getAllAutopsyForms, getAutopsyById } from "../controllers/autopsyController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, saveAutopsyForm);
router.get("/", authenticate, getAllAutopsyForms);
router.get("/:id", authenticate, getAutopsyById);

export default router;
