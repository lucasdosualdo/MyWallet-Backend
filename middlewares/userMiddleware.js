import Mongo from "../db/db.js";

let db = await Mongo();

export async function userMiddleware(req, res, next) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token)
    return res.status(401).send("Sem permissão para inserir o valor.");
  try {
    const session = await db.collection("sessions").findOne({ token });
    if (!session)
      return res.status(401).send("Sem permissão para inserir o valor.");
    const user = await db.collection("signup").findOne({
      _id: session.userId,
    });
    if (!user)
      return res.status(401).send("Sem permissão para inserir o valor.");
    res.locals.user = user;
    next();
  } catch (error) {
    res.status(500).send(error.message);
  }
}
