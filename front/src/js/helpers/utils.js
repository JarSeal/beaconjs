const getHashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  if (hash < 0) return Math.abs(hash);
  return hash;
};

const checkAccountVerification = (routeData) => {
  const appState = routeData.commonData.appState;
  const isVerified = appState.get('user.verified');
  if (isVerified === false) {
    return '/u/verificationneeded';
  }
};

export { getHashCode, checkAccountVerification };
