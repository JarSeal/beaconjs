import linkButton from './emailComponents/linkButton.js';

const verifyAccountEmail = {
  emailId: 'verify-account-email',
  fromName: 'Beacon JS',
  defaultEmail: {
    subject: 'Verify account email',
    text: `
Almost there, $[username], please verify your E-mail
----------------------------------------------------

Please verify your account's E-mail by clicking this link:

${linkButton('Verify', '$[verifyEmailTokenUrl]')}

Link: $[verifyEmailTokenUrl]

If you do not own this account, you can ignore this message.

Do not reply to this email, thank you.

/Beacon JS`,
  },
  langs: {},
};

export default verifyAccountEmail;
