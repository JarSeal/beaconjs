import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import FormCreator from '../forms/FormCreator';
import ViewTitle from '../widgets/ViewTitle';
import './Login.scss';

class LoginTwoFA extends Component {
  constructor(data) {
    super(data);
    this.appState = this.Router.commonData.appState;
    const username = this.appState.get('user.username');
    if (!username || this.appState.get('user.loggedIn')) {
      this.Router.changeRoute('/', { replaceState: true });
    }

    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
      })
    );

    this.login2FAForm = this.addChild(
      new FormCreator({
        id: 'beacon-twofa-login',
        appState: this.appState,
        afterFormSentFn: this._afterLogin,
        onErrorsFn: (error, response, setFormMsg) => {
          const cooldownTime = response?.data?.cooldownTime;
          if (cooldownTime) {
            setFormMsg(getText('cooldown_login_message', [cooldownTime]));
          }
        },
        addToMessage: {
          username,
          browserId: this.appState.get('browserId'),
        },
      })
    );
  }

  paint = () => {
    this.viewTitle.draw();
    if (this.appState.get('user.loggedIn')) {
      this.Router.changeRoute('/', { replaceState: true });
      return;
    }
    this.login2FAForm.draw();
  };

  _afterLogin = (response) => {
    if (response?.data?.loggedIn) {
      this.appState.set('user.username', response.data.username);
      this.appState.set('user.loggedIn', true);
      this.appState.set('user.userLevel', response.data.userLevel);
      this.appState.set('user.verified', response.data.accountVerified);
      this.appState.set('serviceSettings', response.data.serviceSettings);
      let nextRoute = '/';
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('r');
      if (redirect && redirect.length) nextRoute = redirect;
      this.Router.changeRoute(nextRoute);
    }
  };
}

export default LoginTwoFA;
