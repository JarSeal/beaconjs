import mongoose from 'mongoose';
import http from 'http';

import app from '../app.js';
import config from '../utils/config.js';

let server,
  started = false;

const startBackend = () => {
  beforeAll(async () => {
    if (!started) {
      await mongoose
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
  });

  afterAll(async () => {
    if (started) {
      server.close();
      await mongoose.connection.close();
      started = false;
    }
  });
};

export default startBackend;
