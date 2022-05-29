import { getText } from '../../helpers/lang';
import { Component, LocalStorage } from '../../LIGHTER';
import Button from '../buttons/Button';
import FormCreator from '../forms/FormCreator';
import ViewTitle from '../widgets/ViewTitle';
import './Login.scss';

class Login extends Component {
  constructor(data) {
    super(data);
    this.appState = this.Router.commonData.appState;
    this.ls = new LocalStorage('bjs_');

    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
      })
    );

    const rememberedUser = {};
    const rememberUser = this.ls.getItem('u');
    if (rememberUser) {
      rememberedUser.username = rememberUser;
      rememberedUser['remember-me'] = true;
    }
    this.loginFormWrapper = this.addChild({ id: 'login-form-wrapper' });
    this.loginForm = this.addChild(
      new FormCreator({
        id: 'beacon-main-login',
        appState: this.appState,
        attach: 'login-form-wrapper',
        fieldInitValues: rememberedUser,
        afterFormSentFn: this._afterLogin,
        onErrorsFn: (error, response, setFormMsg) => {
          const cooldownTime = response.data.cooldownTime;
          if (cooldownTime) {
            setFormMsg(getText('cooldown_login_message', [cooldownTime]));
          }
        },
        addToMessage: {
          browserId: this.appState.get('browserId'),
        },
      })
    );
  }

  init = () => {
    this.Dialog = this.appState.get('Dialog');
    const publicUserRegistration = this.appState.get('serviceSettings')['canCreateUser'];
    if (publicUserRegistration) {
      const updateMainMenu = this.appState.get('updateMainMenu');
      updateMainMenu({
        tools: [
          {
            id: 'register-new-user-button',
            type: 'button',
            text: getText('new_user'),
            click: () => {
              this.Router.changeRoute('/newuser');
            },
          },
        ],
      });
    }
  };

  paint = () => {
    this.viewTitle.draw();
    if (this.appState.get('user.loggedIn')) {
      this.Router.changeRoute('/', { replaceState: true });
    } else {
      this.loginFormWrapper.draw();
      this.loginForm.draw();
      this.addChildDraw({
        id: 'extra-links-wrapper',
        class: 'login-extra-links',
      });
      if (this.appState.get('serviceSettings.forgotPass')) {
        this.addChildDraw(
          new Button({
            id: 'forgot-password-button',
            text: getText('forgot_password') + '?',
            attach: 'extra-links-wrapper',
            class: ['login-extra-link', 'link'],
            click: () => {
              this.Dialog.appear({
                component: FormCreator,
                componentData: {
                  id: 'new-pass-request-form',
                  appState: this.appState,
                  beforeFormSendingFn: () => {
                    this.Dialog.lock();
                  },
                  afterFormSentFn: () => {
                    this.Dialog.unlock();
                  },
                  onErrorsFn: () => {
                    this.Dialog.unlock();
                  },
                  formLoadedFn: () => {
                    this.Dialog.onResize();
                  },
                },
                title: getText('forgot_password'),
              });
            },
          })
        );
      }
    }
  };

  _afterLogin = (response) => {
    if (response?.data?.proceedToTwoFa) {
      this.appState.set('user.username', response.data.username);
      this.appState.set('user.loggedIn', false);
      this._rememberMe(response);
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('r');
      this.Router.changeRoute('/login/two' + (redirect ? `?r=${redirect}` : ''));
    } else if (response?.data?.loggedIn) {
      this.appState.set('user.username', response.data.username);
      this.appState.set('user.loggedIn', true);
      this.appState.set('user.userLevel', response.data.userLevel);
      this.appState.set('user.verified', response.data.accountVerified);
      this.appState.set('serviceSettings', response.data.serviceSettings);
      this._rememberMe(response);
      let nextRoute = '/';
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('r');
      if (redirect && redirect.length) nextRoute = redirect;
      this.Router.changeRoute(nextRoute);
    }
  };

  _rememberMe = (response) => {
    if (response.data.rememberMe) {
      this.ls.setItem('u', response.data.username);
      this.ls.setItem('ut', new Date().getTime());
    } else {
      this.ls.removeItem('u');
      this.ls.removeItem('ut');
    }
  };
}

export default Login;
