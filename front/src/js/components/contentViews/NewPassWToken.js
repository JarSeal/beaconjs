import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import FormCreator from '../forms/FormCreator';
import ViewTitle from '../widgets/ViewTitle';

class NewPassWToken extends Component {
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
    this.form;
  }

  init = () => {
    this.viewTitle.showSpinner(true);
    const token = this.Router.getRouteParams().token;

    this.form = this.addChild(
      new FormCreator({
        id: 'reset-password-w-token-form',
        appState: this.appState,
        editDataId: token,
        addToMessage: { token: token },
      })
    );

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
    if (this.appState.get('user.loggedIn')) {
      this.Router.changeRoute('/', { replaceState: true });
      return;
    }
    this.viewTitle.draw();
    this.form.draw();
  };
}

export default NewPassWToken;
