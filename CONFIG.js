export const USER = {
  username: {
    minLength: 5,
  },
  name: {
    minLength: 0,
    required: false,
  },
  email: {
    required: true,
    // unique: true,
  },
  password: {
    minLength: 6,
    saltRounds: 10,
  },
};

export const UI = {
  langs: ['en'],
  apiBaseUrl: 'http://localhost:3001',
  baseUrl: 'http://localhost:8080',
  basePath: '/beacon',
  titlePrefix: '',
  titleSuffix: ' | Beacon',
  bbarSize: 64,
};

export const ROUTE_ACCESS = [
  {
    path: '/',
    formId: 'route-landing',
    useRightsLevel: 2,
    editorRightsLevel: 8,
  },
  {
    path: '/login',
    formId: 'route-login',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/login/two',
    formId: 'route-twofa-login',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/uni/:universeId',
    formId: 'route-universe',
    useRightsLevel: 2,
    editorRightsLevel: 8,
  },
  {
    path: '/newuser',
    formId: 'route-new-user',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/u/newpassrequest',
    formId: 'route-new-pass-request',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/u/newpass',
    formId: 'route-new-pass',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/u/verify/:token',
    formId: 'route-verify',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/u/verificationneeded',
    formId: 'route-verifyneeded',
    useRightsLevel: 2,
    editorRightsLevel: 8,
  },
  {
    path: '/user/:user',
    formId: 'route-one-user',
    useRightsLevel: 0,
    editorRightsLevel: 8,
  },
  {
    path: '/settings',
    formId: 'route-settings',
    useRightsLevel: 2,
    editorRightsLevel: 8,
  },
  {
    path: '/404',
    formId: 'route-four-o-four',
    useRightsLevel: 0,
    editorRightsLevel: 8,
    locked: true,
  },
  {
    path: '/401',
    formId: 'route-four-o-one',
    useRightsLevel: 0,
    editorRightsLevel: 8,
    locked: true,
  },
];

export const USER_LEVELS = [
  {
    userLevel: 9,
    labelId: 'user_level_9',
  },
  {
    userLevel: 8,
    labelId: 'user_level_8',
  },
  {
    userLevel: 2,
    labelId: 'user_level_2',
  },
  {
    userLevel: 1,
    labelId: 'user_level_1',
  },
  {
    userLevel: 0,
    labelId: 'user_level_0',
  },
];

export default {
  USER,
  UI,
  ROUTE_ACCESS,
  USER_LEVELS,
};
