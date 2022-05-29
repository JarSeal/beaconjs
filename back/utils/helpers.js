import mongoose from 'mongoose';

import User from '../models/user.js';
import { getSettings } from './settingsService.js';

const ObjectId = mongoose.Types.ObjectId;

const isValidObjectId = (id) => {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
};

const createNewEditedArray = async (oldEdited, editorId) => {
  const settings = await getSettings(null, true);
  const maxEditedLogs = settings['max-edited-logs'];
  const edited = oldEdited || [];
  let newEdited = [];
  if (edited.length >= maxEditedLogs) {
    let startIndex = edited.length - maxEditedLogs + 1;
    if (startIndex < 0) startIndex = 0;
    for (let i = startIndex; i < edited.length; i++) {
      if (!edited[i] || Object.keys(edited[i]).length === 0) continue;
      newEdited.push(edited[i]);
    }
  } else {
    newEdited = edited;
  }
  newEdited.push({
    by: ObjectId(editorId),
    date: new Date(),
  });
  return newEdited;
};

const createNewLoginLogsArray = async (oldLogs, newLog) => {
  const settings = await getSettings(null, true);
  const maxDatesLogs = settings['max-login-logs'];
  const logs = oldLogs || [];
  let newLogs = [];
  if (logs.length >= maxDatesLogs) {
    let startIndex = logs.length - maxDatesLogs + 1;
    if (startIndex < 0) startIndex = 0;
    for (let i = startIndex; i < logs.length; i++) {
      if (!logs[i] || Object.keys(logs[i]).length === 0) continue;
      newLogs.push(logs[i]);
    }
  } else {
    newLogs = logs;
  }
  newLogs.push(newLog);
  return newLogs;
};

const checkIfEmailTaken = async (emailToCheck, userId) => {
  const findEmail = await User.findOne({ email: emailToCheck.trim() });
  const findOldEmail = await User.findOne({ 'security.verifyEmail.oldEmail': emailToCheck.trim() });
  return (
    (findEmail !== null && String(findEmail._id) !== userId) ||
    (findOldEmail !== null && String(findOldEmail._id) !== userId)
  );
};

const getUserEmail = (user) => {
  return user.security?.verifyEmail?.verified ? user.email : user.security?.verifyEmail?.oldEmail;
};

export {
  isValidObjectId,
  createNewEditedArray,
  createNewLoginLogsArray,
  checkIfEmailTaken,
  getUserEmail,
};
