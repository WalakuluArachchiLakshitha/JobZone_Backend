import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

export default async function globalSetup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Store the URI and instance so globalTeardown can stop it
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
  process.env.NODE_ENV = "test";

  // Make the instance available to globalTeardown via a global variable
  globalThis.__MONGOD__ = mongod;
}
