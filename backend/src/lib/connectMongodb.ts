import mongoose from 'mongoose';

let connected = false;

export async function connectDB() {
  if (connected) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL ?? 50),
      minPoolSize: Number(process.env.MONGO_MIN_POOL ?? 0),
      maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_MS ?? 60_000),
      serverSelectionTimeoutMS: Number(process.env.MONGO_SST_MS ?? 8_000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_MS ?? 45_000),
      appName: process.env.MONGO_APP_NAME || 'CampusHubAPI',
    });
    connected = true;
    console.log(' Mongo connected');
  } catch (err) {
    connected = false; // important
    console.error(' Mongo connection failed:', (err as Error).message);
    throw err; // or process.exit(1) in dev
  }
}
