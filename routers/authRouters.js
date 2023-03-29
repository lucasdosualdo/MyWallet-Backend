import express from "express";
import { signUpUser, signInUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signUpUser);
router.post("/signin", signInUser);

export default router;
