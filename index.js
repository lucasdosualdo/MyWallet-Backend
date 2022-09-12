import express from "express";
import cors from "cors";
import Mongo from "./db/db.js";
import dotenv from "dotenv";
import authRouters from "./routers/authRouters.js";
import transactionsRouters from "./routers/transactionsRouters.js";

let db = await Mongo();

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

app.use(authRouters);
app.use(transactionsRouters);

app.listen(5000, () => {
  console.log("listening on port 5000");
});
