import Mongo from "../db/db.js";
import dayjs from "dayjs";
import { transactionSchema } from "../schemas/transactionSchema.js";
let db = await Mongo();

export async function inputValue(req, res) {
  const { value, description } = req.body;

  const validation = transactionSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send("Preencha os campos corretamente!");
    return;
  }
  if (value.includes(" ")) {
    return res.status(422).send("Digite o número corretamente!");
  }

  try {
    const { user } = res.locals;
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
}

export async function outputValue(req, res) {
  const { value, description } = req.body;

  const validation = transactionSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validation.error) {
    const err = validation.error.details.map((err) => err.message);
    res.status(422).send("Preencha os campos corretamente!");
    return;
  }
  if (value.includes(" ")) {
    return res.status(422).send("Digite o número corretamente!");
  }

  try {
    const { user } = res.locals;
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
}

export async function showtransactions(req, res) {
  try {
    const { user } = res.locals;
    const transactionsList = await db
      .collection("transactions")
      .find({ user: user._id })
      .toArray();

    res.status(201).send(transactionsList);
  } catch (error) {
    res.status(500).send(error.message);
  }
}
