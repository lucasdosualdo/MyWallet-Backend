import express from "express";
import {
  inputValue,
  outputValue,
  showtransactions,
} from "../controllers/transactionsController.js";
import { userMiddleware } from "../middlewares/userMiddleware.js";

const router = express.Router();

router.post("/input", userMiddleware, inputValue);
router.post("/output", userMiddleware, outputValue);
router.get("/myprofile", userMiddleware, showtransactions);

export default router;
