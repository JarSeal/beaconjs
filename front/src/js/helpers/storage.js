import axios from 'axios';
import { Logger } from '../LIGHTER';
import { _CONFIG } from '../_CONFIG';

const checkRouteAccess = async (routeData) => {
  if (!routeData || !routeData.route) {
    const logger = new Logger('checkRouteAccess: *****');
    logger.error('Could not check route access, routeData or routeData.route missing.');
    throw new Error('Call stack');
  }
  const id = routeData.route.id;
  const appState = routeData.commonData.appState;
  const routeAccess = appState.get('serviceSettings._routeAccess');
  if (routeAccess) {
    if (routeAccess[id] === false) {
      return '/login';
    }
  } else {
    const url = _CONFIG.apiBaseUrl + '/api/login/access';
    const payload = {
      ids: [
        {
          from: 'form',
          id,
        },
      ],
    };
    try {
      const response = await axios.post(url, payload, { withCredentials: true });
      const access = response.data[id];
      if (!access) {
        if (!response.data.loggedIn) {
          const redirectRoute = '?r=' + routeData.curRoute.replace(routeData.basePath, '');
          return '/logout' + redirectRoute;
        }
        return '/login';
      }
    } catch (exception) {
      const logger = new Logger('checkRouteAccess: *****');
      logger.error('Could not check route access', exception);
      throw new Error('Call stack');
    }
  }
};

const getAdminRights = async () => {
  const url = _CONFIG.apiBaseUrl + '/api/login/access';
  const payload = { from: 'admin' };
  try {
    const response = await axios.post(url, payload, { withCredentials: true });
    const access = response.data;
    return access;
  } catch (exception) {
    const logger = new Logger('getAdminRights: *****');
    logger.error('Could not get admin rights', exception);
    throw new Error('Call stack');
  }
};

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

export { checkRouteAccess, getAdminRights, getHashCode, checkAccountVerification };
