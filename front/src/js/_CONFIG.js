import FourOFour from './components/contentViews/FourOFour';
import FourOOne from './components/contentViews/FourOOne';
import Landing from './components/contentViews/Landing';
import Login from './components/contentViews/Login';
import LoginTwoFA from './components/contentViews/LoginTwoFA';
import Logout from './components/contentViews/Logout';
import NewUser from './components/contentViews/NewUser';
import NewPassRequest from './components/contentViews/NewPassRequest';
import NewPassWToken from './components/contentViews/NewPassWToken';
import VerifyWToken from './components/contentViews/VerifyWToken';
import VerificationNeeded from './components/contentViews/VerificationNeeded';
import Settings from './components/contentViews/Settings';
import OneUser from './components/contentViews/OneUser';
import Universe from './components/contentViews/Universe';
import { getText } from './helpers/lang';
import { checkRouteAccess, checkAccountVerification } from './helpers/storage';
import shared from './shared/index.js';

const conf = shared.CONFIG.UI;

const _conf = {
  langFn: getText,
  lsKeyPrefix: 'bjs_',
  ssKeyPrefix: 'bjs_',
  routes: [
    {
      route: '/',
      id: 'route-landing',
      source: Landing,
      titleId: 'route_title_landing',
      beforeDraw: async (routerData) => {
        const routeAccess = await checkRouteAccess(routerData);
        const accountVerification = checkAccountVerification(routerData);
        return routeAccess || accountVerification;
      },
    },
    {
      route: '/login',
      id: 'route-login',
      source: Login,
      titleId: 'route_title_login',
    },
    {
      route: '/login/two',
      id: 'route-twofa-login',
      source: LoginTwoFA,
      titleId: 'route_title_twofa_login',
    },
    {
      route: '/uni',
      redirect: '/',
    },
    {
      route: '/uni/:universeId',
      id: 'route-universe',
      source: Universe,
      titleId: 'route_universe',
      beforeDraw: async (routerData) => {
        const routeAccess = await checkRouteAccess(routerData);
        const accountVerification = checkAccountVerification(routerData);
        return routeAccess || accountVerification;
      },
    },
    {
      route: '/newuser',
      id: 'route-new-user',
      source: NewUser,
      titleId: 'route_title_new_user',
      beforeDraw: async (routerData) => await checkRouteAccess(routerData),
    },
    {
      route: '/u/newpassrequest',
      id: 'route-new-pass-request',
      source: NewPassRequest,
      titleId: 'new_password',
    },
    {
      route: '/u/newpass/:token',
      id: 'route-new-pass',
      source: NewPassWToken,
      titleId: 'new_password',
    },
    {
      route: '/u/verify/:token',
      id: 'route-verify',
      source: VerifyWToken,
      titleId: 'verify_account',
    },
    {
      route: '/u/verificationneeded',
      id: 'route-verifyneeded',
      source: VerificationNeeded,
      titleId: 'verification_needed',
      beforeDraw: async (routerData) => await checkRouteAccess(routerData),
    },
    {
      route: '/settings',
      redirect: '/settings/default',
    },
    {
      route: '/user/:user',
      id: 'route-one-user',
      source: OneUser,
      titleId: 'route_title_user',
    },
    {
      route: '/settings/:tab',
      id: 'route-settings',
      source: Settings,
      titleId: 'route_title_settings',
      beforeDraw: async (routerData) => await checkRouteAccess(routerData),
    },
    {
      route: '/logout',
      id: 'route-logout',
      titleId: 'route_title_login',
      source: Logout,
    },
    {
      route: '/404/:type/:data',
      id: 'route-four-o-four',
      source: FourOFour,
      is404: true,
      titleId: 'route_title_404',
    },
    {
      route: '/401',
      id: 'route-four-o-one',
      source: FourOOne,
      titleId: 'route_title_401',
    },
  ],
};

export const _CONFIG = Object.assign({}, _conf, conf);
