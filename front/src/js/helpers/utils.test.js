import { State } from '../LIGHTER';
import { getHashCode, checkAccountVerification } from './utils';

describe('utils', () => {
  it('should create a number hash from a string', () => {
    let hash = getHashCode('');
    expect(hash).toEqual(0);
    hash = getHashCode('myname');
    expect(hash).toEqual(1059270089);
    hash = getHashCode('myname and a longer sentence');
    expect(hash).toEqual(1525206135);
    hash = getHashCode('myname and a longer sentence');
    expect(hash).toEqual(1525206135);
    hash = getHashCode('myname and a longer sentence2');
    expect(hash).toEqual(36749879);
    hash = getHashCode('myname and a longer sentence 2');
    expect(hash).toEqual(1139246757);
  });

  it('should check frontend account verification and provide path if not verified', () => {
    const routeData = { commonData: { appState: new State() } };
    let result = checkAccountVerification(routeData);
    expect(result).toBe(undefined);
    routeData.commonData.appState.set('user.verified', true);
    result = checkAccountVerification(routeData);
    expect(result).toBe(undefined);
    routeData.commonData.appState.set('user.verified', false);
    result = checkAccountVerification(routeData);
    expect(result).toBe('/u/verificationneeded');
  });
});
