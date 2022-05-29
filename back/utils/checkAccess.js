const checkAccess = (request, check, settings) => {
  if (!check) return false;
  let userLevel = 0,
    userId;

  if (settings && !checkSettings(check, settings, request.session)) return false;

  if (checkIfLoggedIn(request.session)) {
    userLevel = request.session.userLevel;
    userId = request.session._id;
  }

  // Check user level and verification
  if (userLevel >= check.useRightsLevel) {
    if (isUserUnverified(request.session, check.formId)) return false;
    return true;
  }

  // Check user list
  if (check.useRightsUsers && check.useRightsUsers.length) {
    for (let i = 0; i < check.useRightsUsers.length; i++) {
      if (userId === check.useRightsUsers[i]) return true;
    }
  }

  // Check groups
  // TODO

  return false;
};

const checkIfLoggedIn = (sess) => {
  if (!sess || !sess.loggedIn) return false;
  return true;
};

const isUserUnverified = (sess, formId) => {
  const whiteListedFormIds = [
    'read-profile',
    'edit-profile-form',
    'change-password-form',
    'edit-expose-profile-form',
    'delete-profile-form',
    'new-email-verification',
    'verify-w-token',
    'read-one-user',
  ];
  if (sess.verified === false && !whiteListedFormIds.includes(formId)) {
    return true;
  }
  return false;
};

// Maybe move to settingsService?
const checkSettings = (check, settings, session) => {
  const loggedIn = checkIfLoggedIn(session);
  if (check.formId === 'route-new-user') {
    if (loggedIn) return false;
    return settings['public-user-registration'];
  } else if (check.formId === 'new-user-form') {
    if (loggedIn) {
      return settings['user-level-required-to-register'] <= session.userLevel;
    }
    return settings['public-user-registration'];
  }
  return true;
};

export { checkAccess, checkIfLoggedIn };
