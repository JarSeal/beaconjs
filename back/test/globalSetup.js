import mongoose from 'mongoose';

import config from '../utils/config.js';
import createPresetForms from '../controllers/forms/createPresetForms.js';

let conn;

const globalSetup = async () => {
  await mongoose
    .connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(async (connection) => {
      conn = connection;
      console.log(`\n\nconnected to MongoDB (${config.MONGODB_URI})`);
      await createPresetForms(true);
      console.log('\nPresetForms created\n');
    })
    .catch((error) => {
      console.error('\n\nerror connection to MongoDB:', error.message, '\n\n');
    });
};

export const getConn = () => conn;

export default globalSetup;
