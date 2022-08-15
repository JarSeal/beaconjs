import { loadAssets, setLang, getLang, getText } from './lang';

describe('lang', () => {
  it('should get and set the current language', () => {
    let lang = getLang();
    expect(lang).toBe('en');
    setLang('fi');
    lang = getLang();
    expect(lang).toBe('fi');
  });

  it('should get a text asset with key and replacers', () => {
    loadAssets();
    setLang('en');
    let text = getText('login');
    expect(text).toBe('Login');
    text = getText('user');
    expect(text).toBe('Users');
    text = getText('passwords_dont_match');
    expect(text).toBe(`Password's don't match`);
    text = getText('minimum_x_characters', [50]);
    expect(text).toBe('Minimum 50 characters');
    setLang('fi');
    text = getText('login');
    expect(text).toBe('Kirjaudu');
    setLang('en');
  });
});
