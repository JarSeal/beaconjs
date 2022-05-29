import express from 'express';
import 'express-async-errors';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import csrf from 'csurf';

import config from './utils/config.js';
import usersRouter from './controllers/users.js';
import loginRouter from './controllers/login.js';
import formsRouter from './controllers/forms.js';
import universesRouter from './controllers/universes.js';
import settingsRouter from './controllers/settings.js';
import healthRouter from './controllers/health.js';
import middleware from './utils/middleware.js';
import logger from './utils/logger.js';
import createPresetForms from './controllers/forms/createPresetForms.js';
import { createRandomString } from '../shared/parsers.js';

const app = express();
process.env.TZ = 'Europe/London';
logger.info('connecting to', config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    logger.info('connected to MongoDB');
    createPresetForms();
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message);
  });

app.use(cookieParser());
app.use(
  session({
    secret: config.SECRET,
    cookie: {
      maxAge: 3600000, // 1000 = 1 second
      secure: false,
      sameSite: 'lax',
    },
    saveUninitialized: false,
    resave: false,
    unset: 'destroy',
    rolling: true,
  })
);
app.use(
  cors({
    origin: [
      'http://localhost:8080',
      'https://localhost:8080',
      'http://localhost:3001',
      'https://localhost:3001',
    ],
    credentials: true,
    exposedHeaders: ['set-cookie'],
  })
);
app.use('/', express.static('build'));
app.use('/teest', express.static('build/teest'));
app.use(express.json());
app.use(middleware.requestLogger);

if (process.env.SERVE_STATIC === 'production') {
  app.use(express.static('front'));
}

app.use((req, res, next) => {
  const c = csrf({ cookie: false });
  c(req, res, () => {
    validateToken(req, res, next, c);
  });
});
const validateToken = (req, res, next, c) => {
  if (req.path === '/api/login/access') {
    const timestamp = +new Date();
    req.session.csrfSecret = timestamp + '-' + createRandomString(24);
    const token = req.csrfToken();
    req.body['_csrf'] = token;
  }

  // Check if token has expired
  const maxTime = 10000; // milliseconds (1000 = 1 second)
  const tokenTime = req.session.csrfSecret.split('-')[0];
  if (parseInt(tokenTime) + maxTime < +new Date()) {
    // Expired
    req.body['_csrf'] = 'expired';
  }
  c(req, res, next);
};

app.use('/api/login', loginRouter);
app.use('/api/users', usersRouter);
app.use('/api/forms', formsRouter);
app.use('/api/universes', universesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/health', healthRouter);

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

export default app;
