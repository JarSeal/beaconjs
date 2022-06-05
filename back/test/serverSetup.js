import mongoose from 'mongoose';
import http from 'http';

import app from '../app.js';
import config from '../utils/config.js';

let server;

const startBackend = () => {
  beforeAll(async () => {
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
    server.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT} and DB at ${config.MONGODB_URI}`);
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });
};

export default startBackend;
