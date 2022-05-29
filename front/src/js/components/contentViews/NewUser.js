import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import FormCreator from '../forms/FormCreator';
import ViewTitle from '../widgets/ViewTitle';

class NewUser extends Component {
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
        id: 'new-user-form',
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
    this.viewTitle.draw();
    this.form.draw();
  };
}

export default NewUser;
