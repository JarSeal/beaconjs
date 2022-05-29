import linkButton from './emailComponents/linkButton.js';

const newPassLinkEmail = {
  emailId: 'new-pass-link-email',
  fromName: 'Beacon JS',
  defaultEmail: {
    subject: 'Reset Password Link',
    text: `
Your Link is Ready, $[username]
---------------------------

You requested a link to reset your password. Here you go:

${linkButton('Reset my password', '$[newPassWTokenUrl]')}

Link: $[newPassWTokenUrl]

If you did not request this, you can ignore this (only you have this message). This link will expire in $[linkLife] minutes.

Do not reply to this email, thank you.

/Beacon JS`,
  },
  langs: {},
};

export default newPassLinkEmail;
