/**
 * Shared test setup — mongodb-memory-server lifecycle hooks.
 * Import this file in integration tests that need an isolated MongoDB.
 *
 * Usage:
 *   import { mongoSetup, mongoTeardown, getUri } from '../setup.js';
 *   before(mongoSetup);
 *   after(mongoTeardown);
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

/**
 * Start an in-memory MongoDB instance and connect Mongoose to it.
 * Call this in beforeAll / before hooks.
 */
export async function mongoSetup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

/**
 * Disconnect Mongoose and stop the in-memory server.
 * Call this in afterAll / after hooks.
 */
export async function mongoTeardown() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

/**
 * Drop all collections — useful in beforeEach to reset state between tests.
 */
export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Returns the URI of the running in-memory server (for manual connections).
 */
export function getUri() {
  return mongod?.getUri();
}
