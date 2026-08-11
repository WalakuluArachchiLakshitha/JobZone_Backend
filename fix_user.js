import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    const res = await db.collection('users').updateOne(
      { email: 'employer113@gmail.com' },
      { $set: { role: 'employer' } }
    );
    console.log('Updated role to employer. Modified count:', res.modifiedCount);
    process.exit(0);
  })
  .catch(err => console.error(err));
