import axios from 'axios';
import bcrypt from 'bcrypt';

import User from '../models/user';
import UserSetting from '../models/userSetting';
import shared from '../shared/index.js';
import config from '../utils/config';

const _chechEnv = () => {
  if (config.ENV !== 'test') {
    throw new Error('Wrong environment (not "test")!');
  }
};

const defaultUser = {
  username: 'testUser1',
  password: 'testuser',
  email: 'sometestuser@sometestuserdomain.com',
  name: '',
  userLevel: 2,
};

const superAdminUser = {
  username: 'superAdmin',
  password: 'testuser',
  email: 'sometestuseradmin@sometestuserdomain.com',
  name: '',
  userLevel: 9,
};

const allUsers = [superAdminUser, defaultUser];

export const createUser = async (userData) => {
  _chechEnv();
  const { username, password, email, name, userLevel, verified } = userData;
  // Check here if user is already created
  const checkUser = await User.findOne({ username });
  if (checkUser) return checkUser;
  const userConfig = shared.CONFIG.USER;
  const passwordHash = await bcrypt.hash(password, userConfig.password.saltRounds);
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
  let savedNewUser;
  try {
    savedNewUser = await newUser.save();
  } catch (error) {
    throw new Error('Error in saving new user');
  }
  return savedNewUser;
};

export const checklogin = async (givenBrowserId) => {
  _chechEnv();
  const browserId = givenBrowserId || 'e59b1e5fd129008eecbc4ed3e0c206f9';
  const checkLogin = await axios.post(`${config.getApiBaseUrl('http://localhost')}/login/access`, {
    from: 'checklogin',
    browserId,
  });
  return {
    loggedIn: checkLogin.data.loggedIn,
    browserId,
    credentials: {
      headers: {
        cookie: checkLogin.headers['set-cookie'],
      },
    },
  };
};

export const getCSRF = async (cookieAndBrowserId) => {
  _chechEnv();
  const CSRF = await axios.post(
    `${config.getApiBaseUrl('http://localhost')}/login/access`,
    {
      from: 'getCSRF',
      browserId: cookieAndBrowserId.browserId,
    },
    cookieAndBrowserId.credentials
  );
  return CSRF.data.csrfToken;
};

export const login = async (userData, session) => {
  _chechEnv();
  if (!session) session = await checklogin();
  const { username, password } = userData;
  const CSRF = await getCSRF({ credentials: session.credentials, browserId: session.browserId });
  const login = await axios.post(
    `${config.getApiBaseUrl('http://localhost')}/login`,
    {
      browserId: session.browserId,
      id: 'beacon-main-login',
      password,
      ['remember-me']: false,
      username,
      _csrf: CSRF,
    },
    session.credentials
  );
  session.loggedIn = login.data.loggedIn;
  return { user: login.data, session };
};

export const createUserAndLogin = async (userData) => {
  _chechEnv();
  let user = defaultUser;
  if (userData === 'superAdmin') user = superAdminUser;
  const username = userData?.username || user.username;
  const password = userData?.password || user.password;
  const createdUser = await createUser({
    username,
    password,
    verified: userData?.verified || true,
    email: userData?.email || user.email,
    userLevel: userData?.userLevel || user.userLevel,
  });
  let session = await checklogin();
  if (session.loggedIn) {
    await doLogout(session.credentials);
    session = await checklogin();
  }
  const loggedIn = await login({ username, password }, session);
  return {
    session,
    login: loggedIn,
    user: createdUser,
    username,
    password,
  };
};

export const setUserSetting = async (id, userId, value) => {
  _chechEnv();
  const sett = await UserSetting.findOne({ settingId: id, userId: userId });
  if (sett) {
    await UserSetting.findOneAndUpdate({ settingId: id, userId }, { value });
  } else {
    const newSett = new UserSetting({
      settingId: id,
      userId,
      value,
      defaultValue: '',
      type: 'string',
    });
    await newSett.save();
  }
};

export const doLogout = async (credentials) => {
  _chechEnv();
  await axios.post(
    `${config.getApiBaseUrl('http://localhost')}/login/access`,
    {
      from: 'logout',
    },
    credentials
  );
  const session = await checklogin();
  return {
    session,
    login: null,
    user: null,
    username: null,
    password: null,
  };
};

export const resetAllUsers = async (loginData) => {
  await doLogout(loginData?.session?.credentials);
  for (let i = 0; i < allUsers.length; i++) {
    await User.deleteOne({ username: allUsers[i].username });
  }
  const userConfig = shared.CONFIG.USER;
  for (let i = 0; i < allUsers.length; i++) {
    const passwordHash = await bcrypt.hash(allUsers[i].password, userConfig.password.saltRounds);
    const newUser = new User({
      username: allUsers[i].username,
      email: allUsers[i].email,
      name: allUsers[i].name || '',
      userLevel: allUsers[i].userLevel,
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
          verified: allUsers[i].verified || true,
        },
        twoFactor: {},
      },
    });
    await newUser.save();
  }
  return loginData;
};
