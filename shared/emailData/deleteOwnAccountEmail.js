const deleteOwnAccountEmail = {
  emailId: 'delete-own-account-email',
  fromName: 'Beacon JS',
  defaultEmail: {
    subject: 'Account deleted',
    text: `
Goodbye
-------

Your account has been deleted and your data will be removed.
- Username: $[username]

You have deleted your own account. Thank you for being user with us!

Do not reply to this email, thank you.

/Beacon JS`,
  },
  langs: {
    fi: {
      subject: 'Tili poistettu',
      text: `
Näkemiin
--------

Tilisi on poistettu ja datasi poistetaan.
- Käyttäjänimi: $[username]

Olet poistanut oman tilisi. Kiitos kun olet ollut yksi käyttäjistämme!

Älkää vastatko tähän sähköpostiin, kiitos.

/Beacon JS`,
    },
  },
};

export default deleteOwnAccountEmail;
