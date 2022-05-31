import mongoose from 'mongoose';

import config from '../utils/config.js';
import createPresetForms from '../controllers/forms/createPresetForms.js';

const globalSetup = async () => {
  await mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(async (conn) => {
      await createPresetForms(true);
      console.log('\nPresetForms created\n');
      conn.connection.close();
    })
    .catch((error) => {
      console.error('\n\nerror connection to MongoDB:', error.message, '\n\n');
    });
};

export default globalSetup;
