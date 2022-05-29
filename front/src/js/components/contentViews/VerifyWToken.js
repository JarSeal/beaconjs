import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import ReadApi from '../forms/ReadApi';
import ViewTitle from '../widgets/ViewTitle';

class VerifyWToken extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
        spinner: true,
      })
    );
    this.readApi;
  }

  init = () => {
    this.viewTitle.draw();
    const token = this.Router.getRouteParams().token;
    if (token.length !== 64) {
      this.addChildDraw({
        id: 'not-valid-token',
        text: getText('token_not_valid_or_outdated'),
      });
      this.viewTitle.showSpinner(false);
      return;
    }
    this.readApi = new ReadApi({ url: '/api/users/verify/' + token });
    this._tryToVerify();
  };

  _tryToVerify = async () => {
    this.viewTitle.showSpinner(true);
    const response = await this.readApi.getData();
    this.viewTitle.showSpinner(false);

    if (response && !response.verified) {
      this.addChildDraw({
        id: 'token-error-msg',
        text: getText('invalid_or_expired_token'),
        class: 'error-text',
      });
      return;
    }

    const username = response.username;
    this.addChildDraw({
      id: 'email-verified-heading',
      tag: 'h3',
      text: getText('thank_you_username', [username]),
    });
    this.addChildDraw({
      id: 'email-verified-msg',
      text: getText('email_and_account_verified'),
    });
  };
}

export default VerifyWToken;
