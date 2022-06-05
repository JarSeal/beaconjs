import axios from 'axios';
import bcrypt from 'bcrypt';

import User from '../models/user';
import shared from '../shared/index.js';

export const createUser = async (userData) => {
  const { username, password, email, name, userLevel, verified } = userData;
  const CONFIG = shared.CONFIG;
  const passwordHash = await bcrypt.hash(password, CONFIG.USER.password.saltRounds);
  const newUser = new User({
    username,
    email,
    name: name || '',
    userLevel,
    passwordHash,
    created: {
      by: null,
      publicForm: true,
      date: new Date(),
    },
    security: {
      loginAttempts: 0,
      coolDown: false,
      coolDownStarted: null,
      lastLogins: [],
      lastAttempts: [],
      newPassLink: {},
      verifyEmail: {
        token: null,
        oldEmail: null,
        verified,
      },
      twoFactor: {},
    },
  });
  const savedNewUser = await newUser.save();
  return savedNewUser;
};

export const checklogin = async (givenBrowserId) => {
  const browserId = givenBrowserId || 'e59b1e5fd129008eecbc4ed3e0c206f9';
  const checkLogin = await axios.post(
    'http://localhost:3001/api/login/access',
    {
      from: 'checklogin',
      browserId,
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    }
  );
  return {
    browserId,
    credentials: {
      headers: {
        cookie: checkLogin.headers['set-cookie'],
      },
    },
  };
};

export const login = async (session, username, password) => {
  const getCSRF = await axios.post(
    'http://localhost:3001/api/login/access',
    {
      from: 'getCSRF',
      browserId: session.browserId,
    },
    session.credentials
  );
  const login = await axios.post(
    'http://localhost:3001/api/login',
    {
      browserId: session.browserId,
      id: 'beacon-main-login',
      password,
      ['remember-me']: false,
      username,
      _csrf: getCSRF.data.csrfToken,
    },
    session.credentials
  );
  return login.data;
};

export const createUserAndLogin = async (userData) => {
  const username = userData?.username || 'testUser1';
  const password = userData?.password || 'testuser';
  const user = await createUser({
    username,
    password,
    verified: userData?.verified || true,
    email: userData?.email || 'sometestuser@sometestuserdomain.com',
    userLevel: userData?.userLevel || 2,
  });
  const session = await checklogin();
  const loggedIn = await login(session, username, password);
  return {
    session,
    login: loggedIn,
    user,
  };
};
