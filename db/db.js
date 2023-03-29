import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

export default async function Mongo() {
  let connection;
  try {
    await mongoClient.connect();
    connection = await mongoClient.db(process.env.MONGO_DB);
    return connection;
  } catch (error) {
    console.error(error);
    return error;
  }
}
