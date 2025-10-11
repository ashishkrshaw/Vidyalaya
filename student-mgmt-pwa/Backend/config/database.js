// MongoDB connection setup
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
let mongoClient;
let mongoDb;

async function connectMongo() {
  if (!mongoUri) throw new Error('MONGODB_URI not set in .env');
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    console.log('Connected to MongoDB');
  }
  return mongoDb;
}

module.exports = {
  connectMongo,
  // ...existing exports for other data stores (e.g., SQLite/MySQL)
};
