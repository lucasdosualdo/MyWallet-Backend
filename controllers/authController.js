import Mongo from "../db/db.js";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import joi from "joi";

let db = await Mongo();

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

export async function signUpUser(req, res) {
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
      return res.status(409).send("Email ou senha inválidos!");
    }

    if (password !== confirmPassword) {
      return res.status(422).send("Insira as senhas corretamente!");
    }

    const passwordList = await db.collection("signup").find({}).toArray();
    const existingPassword = passwordList.filter((value) =>
      bcrypt.compareSync(password, value.password)
    );

    if (existingPassword.length !== 0) {
      return res.status(409).send("Email ou senha inválidos!");
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
}

export async function signInUser(req, res) {
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
}
