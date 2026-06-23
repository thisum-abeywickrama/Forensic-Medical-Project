import express from "express";
import { createLabRequest, updateLabRequest, getAllLabRequests, getLabRequestById } from "../controllers/labController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/", authenticate, createLabRequest);
router.put("/:id", authenticate, updateLabRequest);
router.get("/", authenticate, getAllLabRequests);
router.get("/:id", authenticate, getLabRequestById);

export default router;
