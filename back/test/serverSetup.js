import mongoose from 'mongoose';
import http from 'http';

import app from '../app.js';
import config from '../utils/config.js';

let server,
  started = false,
  mgoose;

const startBackend = () => {
  beforeAll(async () => {
    await startBackendBefore();
  });

  afterAll(async () => {
    await startBackendAfter();
  });
};

export const startBackendBefore = async () => {
  if (!started) {
    mgoose = await mongoose
      .connect(config.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      })
      .catch((error) => {
        console.error('\n\nerror connection to MongoDB:', error.message, '\n\n');
      });
    server = http.createServer(app);
    server.listen(config.PORT);
    started = true;
  }
};

export const startBackendAfter = async () => {
  if (started) {
    server.close();
    await mgoose.connection.close();
    started = false;
  }
};

export default startBackend;
