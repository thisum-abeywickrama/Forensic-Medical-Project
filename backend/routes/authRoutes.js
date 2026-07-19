import express from "express";
import { loginUser, registerUser, getAllUsers, verifyEmail, resendVerification } from "../controllers/authController.js";
import authenticate from "../middlewares/authenticate.js";

const router = express.Router();

router.post("/register", authenticate, registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

router.get("/users", authenticate, getAllUsers);

export default router;