const passwordChangedEmail = {
  emailId: 'password-changed-email',
  fromName: 'Beacon JS',
  defaultEmail: {
    subject: 'Password changed',
    text: `
Your password was changed, $[username]
--------------------------------------

This is a notification that your password was changed.

Do not reply to this email, thank you.

/Beacon JS`,
  },
  langs: {},
};

export default passwordChangedEmail;
