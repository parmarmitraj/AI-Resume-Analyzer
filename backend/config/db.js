const mongoose = require('mongoose');

let isConnected = false;
let memoryStore = {
  jobs: [],
  applications: [],
  candidates: []
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume_analyzer';
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to failover to in-memory if MongoDB service is offline
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] MongoDB offline or unreachable (${error.message}).`);
    console.log(`[Database] Falling back to In-Memory storage mode (Full functionality preserved).`);
  }
};

const getDBStatus = () => ({
  mode: isConnected ? 'mongodb' : 'in-memory',
  connected: isConnected,
});

module.exports = {
  connectDB,
  getDBStatus,
  memoryStore,
  isMongoConnected: () => isConnected
};
