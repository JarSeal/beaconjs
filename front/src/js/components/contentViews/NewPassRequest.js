import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import FormCreator from '../forms/FormCreator';
import ViewTitle from '../widgets/ViewTitle';

class NewPassRequest extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
      })
    );
    this.form = this.addChild(
      new FormCreator({
        id: 'new-pass-request-form',
        appState: this.appState,
      })
    );
  }

  init = () => {
    const updateMainMenu = this.appState.get('updateMainMenu');
    updateMainMenu({
      tools: [
        {
          id: 'to-login-button',
          type: 'button',
          text: getText('login'),
          click: () => {
            this.Router.changeRoute('/login');
          },
        },
      ],
    });
  };

  paint = () => {
    if (this.appState.get('user.loggedIn') || !this.appState.get('serviceSettings.forgotPass')) {
      this.Router.changeRoute('/', { replaceState: true });
      return;
    }
    this.viewTitle.draw();
    this.form.draw();
  };
}

export default NewPassRequest;
