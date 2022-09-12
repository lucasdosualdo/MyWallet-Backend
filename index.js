import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

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

const transactionSchema = joi.object({
  value: joi.number().required(),
  description: joi.string().required().trim(),
});

app.post("/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const validation = signUpSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send("Preencha os campos corretamente!");
    return;
  }

  try {
    const existingEmail = await db.collection("signup").findOne({ email });
    if (existingEmail) {
      return res.status(409).send("Email ou senha inválidos!"); //trocar
    }

    if (password !== confirmPassword) {
      return res.status(422).send("Insira as senhas corretamente!");
    }

    const passwordList = await db.collection("signup").find({}).toArray();
    const existingPassword = passwordList.filter((value) =>
      bcrypt.compareSync(password, value.password)
    );

    if (existingPassword.length !== 0) {
      return res.status(409).send("Email ou senha inválidos!"); //trocar
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
    res.status(422).send("Preencha os campos corretamente!");
    return;
  }
  try {
    const user = await db.collection("signup").findOne({ email });
    if (!user) {
      return res.status(401).send("Email ou senha inválidos!");
    }
    const correctPassword = bcrypt.compareSync(password, user.password);
    if (!correctPassword) {
      return res.status(401).send("Email ou senha inválidos!");
    }
    const token = uuid();
    await db.collection("sessions").insertOne({
      userId: user._id,
      token,
    });
    const userData = { name: user.name, token: token };

    res.status(201).send(userData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/input", async (req, res) => {
  const { value, description } = req.body;
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  const validation = transactionSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send(err);
    return;
  }
  if (value.includes(" ")) {
    return res.status(422).send("Digite o número corretamente!");
  }
  if (!token) return res.status(401).send("sem o token"); //trocar

  try {
    const session = await db.collection("sessions").findOne({ token });
    console.log(session.token); //excluir

    if (!session) return res.status(401).send("token não encontrado no db"); //trocar

    const user = await db.collection("signup").findOne({
      _id: session.userId,
    });

    if (!user) return res.status(401).send("user não encontrado no db"); //trocar

    await db.collection("transactions").insertOne({
      value,
      description,
      date: dayjs().format("DD/MM"),
      type: "input",
      user: user._id,
    });

    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/output", async (req, res) => {
  const { value, description } = req.body;
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  const validation = transactionSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send(err);
    return;
  }
  if (value.includes(" ")) {
    return res.status(422).send("Digite o número corretamente!");
  }
  if (!token) return res.status(401).send("sem o token"); //trocar

  try {
    const session = await db.collection("sessions").findOne({ token });

    if (!session) return res.status(401).send("token não encontrado no db"); //trocar

    const user = await db.collection("signup").findOne({
      _id: session.userId,
    });

    if (!user) return res.status(401).send("user não encontrado no db"); //trocar

    await db.collection("transactions").insertOne({
      value,
      description,
      date: dayjs().format("DD/MM"),
      type: "output",
      user: user._id,
    });

    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/testando", async (req, res) => {
  const { teste1, teste2 } = req.body;
  try {
    await db.collection("testando").insertOne({
      teste1,
      teste2,
    });
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/myprofile", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  console.log(token);
  if (!token) return res.status(401).send("sem o token"); //trocar
  const session = await db.collection("sessions").findOne({ token });
  console.log(session.token); //excluir

  if (!session) return res.status(401).send("token não encontrado no db"); //trocar

  try {
    const user = await db.collection("signup").findOne({
      _id: session.userId,
    });

    if (!user) return res.status(401).send("user não encontrado no db"); //trocar
    const transactionsList = await db
      .collection("transactions")
      .find({ user: user._id })
      .toArray();

    res.status(201).send(transactionsList); //trocar
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(5000, () => {
  console.log("listening on port 5000");
});
