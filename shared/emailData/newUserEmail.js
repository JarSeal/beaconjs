import linkButton from './emailComponents/linkButton.js';

const newUserEmail = {
  emailId: 'new-user-email',
  fromName: 'Beacon JS',
  defaultEmail: {
    subject: 'New Account Registered',
    text: `
Welcome
-------

Your new account has been registered.
- Username: $[username]

You can either [login]($[mainBeaconUrl]) or if you don't have a password,  
you can [create a new password]($[newPassRequestUrl]) for you.

${linkButton('Login', '$[mainBeaconUrl]')}

Do not reply to this email, thank you.

/Beacon JS`,
  },
  langs: {
    fi: {
      subject: 'Uusi tili rekisteröity',
      text: `
Tervetuloa
----------

Uusi tilinne on rekisteröity.
- Käyttäjänimi: $[username]

Voit joko [kirjautua sisään]($[mainBeaconUrl]) tai jos sinulla ei ole salasanaa,  
voit luoda [uuden salasanan]($[newPassRequestUrl]) itsellesi.

<a href="$[mainBeaconUrl]" target="_blank" style="padding: 8px 32px 7px; border: 1px solid #555;border-radius: 8px;font-family: Helvetica, Arial, sans-serif;font-size: 14px; color: #ffffff;text-decoration: none;font-weight:bold;display: inline-block;background: #333;">
    Kirjaudu
</a>

Älkää vastatko tähän sähköpostiin, kiitos.

/Beacon JS`,
    },
  },
};

export default newUserEmail;
