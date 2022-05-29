const twoFactorAuthEmail = {
  emailId: 'two-factor-auth-email',
  fromName: 'Beacon JS',
  defaultEmail: {
    subject: 'Login Code [$[twoFactorCode]]',
    text: `
Welcome back!
---------------------------

Here is your 2FA Login Code:

<div style="padding: 8px 32px 7px; border: 1px solid #555;border-radius: 8px;font-family: Helvetica, Arial, sans-serif;font-size: 18px; color: #333;text-decoration: none;font-weight:bold;display: inline-block;">

$[twoFactorCode]

</div>

The Login Code ($[twoFactorCode]) is valid for $[twoFactorLife] minutes.

If you are not trying to log in, you can ignore this (only you have this message).

Do not reply to this email, thank you.

/Beacon JS`,
  },
  langs: {},
};

export default twoFactorAuthEmail;
