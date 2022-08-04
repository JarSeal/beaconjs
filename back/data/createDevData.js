import mongoose from 'mongoose';

import config from '../utils/config.js';
import { createUsers } from './devData.js';

const USERS_TO_CREATE = 200;

const createDevData = () => {
  if (config.ENV === 'production') {
    console.error('Development data cannot be created in production environment.');
    process.exit(1);
  }
  console.log('---------------\n- Connecting to MongoDB...');
  mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(async () => {
      console.log('- Connected to MongoDB');

      console.log('---------------\n- Adding new users...');
      const newUserCount = await createUsers(USERS_TO_CREATE);
      console.log(`- Added ${newUserCount} new users`);

      console.log('---------------\n-- All done! --');
      process.exit(0);
    })
    .catch((error) => {
      console.error('error connection to MongoDB:', error.message);
    });
};

createDevData();
