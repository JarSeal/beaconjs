import mongoose from 'mongoose';

import config from '../utils/config.js';
import createPresetData from '../data/createPresetData.js';

const globalSetup = async () => {
  await mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(async (conn) => {
      await createPresetData(true);
      console.log('\n\nPresetForms created');
      await conn.connection.close();
    })
    .catch((error) => {
      console.error('\n\nError connecting to MongoDB:', error.message, '\n\n');
    });
};

export default globalSetup;
