import { extractVariables, replaceVariables } from './emailService';

const text = `Your Link is Ready, $[username]
  ---------------------------
  You requested a link to reset your password. Here you go:
  Reset my password: $[newPassWTokenUrl]')}
  Link: $[newPassWTokenUrl]
  If you did not request this, you can ignore this (only you have this message). This link will expire in $[linkLife] minutes.
  Do not reply to this email, thank you.
  /Beacon JS`;

describe('emailService', () => {
  it('should extract all interpolated variables from the text and return an array', () => {
    const extract = extractVariables(text);
    expect(extractVariables().length).toEqual(0);
    expect(extractVariables('').length).toEqual(0);
    expect(extract).toEqual(['username', 'newPassWTokenUrl', 'linkLife']);
  });

  it('should replace all interpolated variables with emailParams corresponding values', () => {
    const subjectAndText = {
      subject: 'Hello $[username]!',
      text: 'My username is $[username]. The URL is $[newPassWTokenUrl]. It is valid for $[linkLife] minutes. Kind regards, $[username].',
    };
    const emailParams = {
      username: 'SomeWeirdUsername',
      newPassWTokenUrl: 'www.someurl.turd',
      linkLife: 10,
    };
    const { subject, text } = replaceVariables(subjectAndText, emailParams);
    expect(subject).toEqual('Hello SomeWeirdUsername!');
    expect(text).toEqual(
      'My username is SomeWeirdUsername. The URL is www.someurl.turd. It is valid for 10 minutes. Kind regards, SomeWeirdUsername.'
    );
    const { subject: subject2, text: text2 } = replaceVariables(
      { subject: '', text: 'Some text.' },
      emailParams
    );
    expect(subject2).toEqual('');
    expect(text2).toEqual('Some text.');
  });
});
