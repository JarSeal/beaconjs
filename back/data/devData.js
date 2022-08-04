import bcrypt from 'bcrypt';

import shared from '../shared/index.js';
import User from '../models/user.js';
import { createRandomString } from '../../shared/parsers.js';

export const createUsers = async (count) => {
  // Delete users (except super admin)
  const allUsers = await User.find();
  for (let i = 0; i < allUsers.length; i++) {
    if (allUsers[i].userLevel !== 9) {
      await User.deleteOne({ username: allUsers[i].username });
    }
  }

  // TODO: Add some clearly named test users
  // ..like Keijo, userlevel 2 - SiteAdmin, userlevel 8 etc.

  let usersCreated = 0;
  const lettersOnly = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const password = 'adminator';
  let user = await _getUserObject('Admin', password, 9);
  let checkUserExistance = await User.findOne({ username: user.username });
  let checkUserExistance2 = await User.findOne({ email: user.email });
  if (!checkUserExistance && !checkUserExistance2) {
    let newUser = new User(user);
    await newUser.save();
    usersCreated++;
  }

  for (let i = 0; i < count; i++) {
    const usernameLength = Math.floor(Math.random() * (15 - 6 + 1)) + 6;
    const username = createRandomString(usernameLength, lettersOnly);
    const userLevel = Math.random() > 0.9 ? 8 : Math.random() > 0.6 ? 1 : 2;
    const uFirstNameLength = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
    const uLastNameLength = Math.floor(Math.random() * (18 - 6 + 1)) + 6;
    const uName =
      Math.random() > 0.2
        ? createRandomString(uFirstNameLength, lettersOnly) +
          ' ' +
          createRandomString(uLastNameLength, lettersOnly)
        : '';
    user = await _getUserObject(username, password, userLevel, uName);
    checkUserExistance = await User.findOne({ username });
    checkUserExistance2 = await User.findOne({ email: user.email });
    if (!checkUserExistance && !checkUserExistance2) {
      let newUser = new User(user);
      await newUser.save();
      usersCreated++;
    }
  }

  return usersCreated;
};

const _createEmail = () => {
  const justLetters = 'abcdefghijklmnopqrstuvwxyz';
  return `${createRandomString(4, justLetters)}.${createRandomString(
    4,
    justLetters
  )}@${createRandomString(6, justLetters)}.${createRandomString(3, justLetters)}`;
};

const _createPasswordHash = async (password) => {
  const userConfig = shared.CONFIG.USER;
  const hash = await bcrypt.hash(password, userConfig.password.saltRounds);
  return hash;
};

const _getUserObject = async (username, password, userLevel, name) => {
  if (userLevel === undefined) userLevel = 1;
  return {
    username,
    password,
    userLevel,
    email: _createEmail(),
    name: name || '',
    passwordHash: await _createPasswordHash(password),
    created: {
      by: null,
      publicForm: true,
      date: new Date(),
    },
    exposure: {
      username: 0,
      name: 2,
      email: 2,
      created_date: 2,
    },
  };
};
