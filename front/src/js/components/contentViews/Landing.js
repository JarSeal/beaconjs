import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import Button from '../buttons/Button';
import DialogForms from '../widgets/dialogs/dialog_Forms';
import UniverseItem from '../widgets/listItems/UniverseItem';
import ListLoader from '../widgets/ListLoader';
import ViewTitle from '../widgets/ViewTitle';

class Landing extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.mainScreenInitiated = false;
    this.mainScreenCompos = [];
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
      })
    );
    this.dialogForms = new DialogForms({ id: 'landing-dialog-forms' });
  }

  init = () => {
    this.appState.get('updateMainMenu')({
      tools: [
        {
          id: 'edit-user-tool',
          type: 'button',
          text: 'New',
          click: () => {
            this._showNewUniDialog();
          },
        },
      ],
    });
  };

  initMainScreen = () => {
    this.viewTitle.draw();
    if (this.mainScreenInitiated) return;
    this.mainScreenCompos.push(this.addChild({ id: 'universe-wrapper', class: 'list-wrapper' }));
    this.mainScreenCompos.push(
      this.addChild(
        new Button({
          id: 'add-uni-button',
          attach: 'universe-wrapper',
          attributes: { title: getText('create_new_universe') },
          text: '+',
          class: ['list-add-button', 'list-item'],
          click: () => {
            this._showNewUniDialog();
          },
        })
      )
    );
    this.universesList = this.addChild(
      new ListLoader({
        id: 'universes-list',
        api: '/api/universes',
        attach: 'universe-wrapper',
        component: UniverseItem,
      })
    );
    this.mainScreenCompos.push(this.universesList);
  };

  paint = () => {
    this.initMainScreen();
    for (let i = 0; i < this.mainScreenCompos.length; i++) {
      this.mainScreenCompos[i].draw();
    }
  };

  _showNewUniDialog = () => {
    this.dialogForms.createEmptyFormDialog({
      id: 'new-universe-form',
      title: getText('create_new_universe'),
      afterFormSentFn: () => {
        this.universesList.updateList();
      },
      onErrorsFn: () => {
        this.universesList.updateList();
      },
    });
  };
}

export default Landing;
