import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("project13-mywallet");
});

const signUpSchema = joi.object({
  name: joi.string().required().trim(),
  email: joi.string().required().email(),
  password: joi.string().required().trim(),
  confirmPassword: joi.string().required().trim(),
});

const signInSchema = joi.object({
  email: joi.string().required().email(),
  password: joi.string().required().trim(),
});

const inputSchema = joi.object({
  value: joi.number().required(),
  description: joi.string().required().trim(),
});

app.post("/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const validation = signUpSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send(err);
    return;
  }

  try {
    const existingEmail = await db.collection("signup").findOne({ email });
    if (existingEmail) {
      return res.status(409).send("Email já existente!"); //trocar
    }

    if (password !== confirmPassword) {
      return res.status(422).send("Insira as senhas corretamente!");
    }

    const passwordList = await db.collection("signup").find({}).toArray();
    const existingPassword = passwordList.filter((value) =>
      bcrypt.compareSync(password, value.password)
    );

    if (existingPassword.length !== 0) {
      return res.status(409).send("Senha já existente"); //trocar
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await db.collection("signup").insertOne({
      name,
      email,
      password: passwordHash,
    });
    res.status(201).send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const validation = signInSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send(err);
    return;
  }
  try {
    const user = await db.collection("signup").findOne({ email });
    const correctPassword = bcrypt.compareSync(password, user.password);
    if (!user || !correctPassword) {
      return res.status(401).send("Email ou senha inválidos!");
    }
    const token = uuid();
    console.log(correctPassword, token); //excluir
    await db.collection("sessions").insertOne({
      userId: user._id,
      token,
    });
    res.status(201).send("login ok"); //trocar
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/input", async (req, res) => {
  const { value, description } = req.body;
  const validation = inputSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send(err);
    return;
  }
  if (value.includes(" ")) {
    return res.status(422).send("Digite o número corretamente!");
  }
  await db.collection("input").insertOne({
    value,
    description,
  });

  res.sendStatus(201);
});

app.get("/myprofile", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("sem o token"); //trocar
  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.status(401).send("token não encontrado no db"); //trocar

  const user = await db.collection("signup").findOne({
    _id: session.userId,
  });

  if (!user) return res.status(401).send("user não encontrado no db");
  res.status(201).send("belezinhas"); //trocar
});

app.listen(5000, () => {
  console.log("listening on 5000 port");
});
