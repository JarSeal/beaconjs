import { Component, LocalStorage, Logger, SessionStorage } from '../../../LIGHTER';
import axios from 'axios';
import { getText } from '../../../helpers/lang';
import { _CONFIG } from '../../../_CONFIG';
import Table from '../../widgets/Table';
import { getHashCode } from '../../../helpers/storage';
import ViewTitle from '../../widgets/ViewTitle';
import ReadApi from '../../forms/ReadApi';
import DialogForms from '../../widgets/dialogs/dialog_Forms';

class UsersList extends Component {
  constructor(data) {
    super(data);
    this.template = '<div class="settings-tab-view"></div>';
    this.users = [];
    this.Dialog = this.Router.commonData.appState.state.Dialog;
    this.appState = this.Router.commonData.appState;
    const tableSortingSetting = this.appState.get('serviceSettings')['tableSorting'];
    let storage;
    if (tableSortingSetting === 'session') {
      storage = new SessionStorage('bjs_');
    } else if (tableSortingSetting === 'browser') {
      storage = new LocalStorage('bjs_');
    }
    let username, storageHandle, params;
    if (storage) {
      username = this.appState.get('user.username');
      storageHandle = getHashCode(username + data.id);
      params = JSON.parse(storage.getItem(storageHandle));
    }
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-sub-view-title',
        heading: getText('users'),
        tag: 'h3',
        spinner: true,
      })
    );
    this.usersDataApi = new ReadApi({ url: '/api/users' });
    this.dialogForms = new DialogForms({ id: 'settings-users-dialog-forms' });
    this.usersTable = this.addChild(
      new Table({
        id: 'users-table',
        fullWidth: true,
        tableData: this.users,
        showStats: true,
        selectable: true,
        showRowNumbers: true,
        showGroupSize: 25,
        tableParams: params,
        afterChange: (data) => {
          if (!username || !storage) return;
          const dataString = JSON.stringify(data);
          storage.setItem(storageHandle, dataString);
        },
        filterHotkey: 'f',
        filter: true,
        tableStructure: this._getTableStructure(),
        rowClickFn: (e, rowData) => {
          this.Router.changeRoute('/user/' + rowData.username);
        },
        tools: [
          {
            id: 'multi-delete-tool',
            text: getText('delete'),
            clickFn: (e, selected) => {
              if (!selected.length) return;
              this.dialogForms.createDeleteDialog({
                id: 'delete-users',
                title: getText('delete_users') + ': ',
                formDesc:
                  getText('delete_many_users_confirmation') + '\n' + this._listUsernames(selected),
                addToMessage: { users: selected.map((sel) => sel.id) },
                afterFormSentFn: async () => {
                  await this._loadUsers();
                },
                onErrorsFn: async () => {
                  await this._loadUsers();
                },
              });
            },
          },
        ],
      })
    );
    this._loadUsers();
  }

  init = () => {
    this.viewTitle.draw();
    const canCreateUser = this.appState.get('serviceSettings')['canCreateUser'];
    if (canCreateUser) {
      const updateMainMenu = this.appState.get('updateMainMenu');
      updateMainMenu({
        tools: [
          {
            id: 'register-new-user-tool-button',
            type: 'button',
            text: getText('new_user'),
            click: () => {
              this.dialogForms.createEmptyFormDialog({
                id: 'new-user-form',
                title: getText('new_user'),
                afterFormSentFn: async () => {
                  await this._loadUsers();
                },
                onErrorsFn: async () => {
                  await this._loadUsers();
                },
              });
            },
          },
        ],
      });
    }
  };

  paint = () => {
    this.usersTable.draw({ tableData: this.users.length ? this.users : [] });
  };

  _loadUsers = async () => {
    this.viewTitle.showSpinner(true);
    this.users = await this.usersDataApi.getData();
    if (this.users.redirectToLogin) {
      this.viewTitle.showSpinner(false);
      this.Router.changeRoute('/logout?r=' + this.Router.getRoute(true));
      return;
    }
    if (this.users.error) {
      this.viewTitle.showSpinner(false);
      this.addChildDraw({
        id: 'error-getting-my-settings',
        template: `<div class="error-text">${getText('could_not_get_data')}</div>`,
      });
    }

    this.usersTable.updateTable(this.users);
    this.viewTitle.showSpinner(false);
  };

  _deleteUsers = async (users) => {
    if (!users || !users.length) return;
    const url = _CONFIG.apiBaseUrl + '/api/users';
    try {
      const response = await axios.delete(url, { withCredentials: true, users });
      return response;
    } catch (exception) {
      const logger = new Logger('Delete users: *****');
      logger.error('Could not delete users', exception, users);
      throw new Error('Call stack');
    }
  };

  _getTableStructure = () => {
    const structure = [
      {
        key: 'username',
        heading: getText('username'),
        sort: 'desc',
      },
      {
        key: 'name',
        heading: getText('name'),
      },
      {
        key: 'email',
        heading: getText('email'),
      },
      {
        key: 'userLevel',
        heading: getText('user_level'),
      },
      {
        key: 'created.date',
        heading: getText('created'),
        type: 'Date',
      },
      {
        key: 'editUser',
        heading: getText('edit'),
        type: 'Action',
        actionFn: (e, rowData) => {
          this.dialogForms.createEditDialog({
            id: 'edit-user-form',
            title: getText('edit_user') + ': ' + rowData.username,
            editDataId: rowData.id,
            addToMessage: { userId: rowData.id },
            afterFormSentFn: async () => {
              await this._loadUsers();
            },
            onErrorsFn: async () => {
              await this._loadUsers();
            },
          });
        },
      },
      {
        key: 'deleteUser',
        heading: getText('delete'),
        type: 'Action',
        actionText: getText('del'),
        actionFn: (e, rowData) => {
          this.dialogForms.createDeleteDialog({
            id: 'delete-users',
            title: getText('delete_user') + ': ' + rowData.username,
            formDesc: getText('delete_single_user_confirmation', [rowData.username]),
            addToMessage: { users: [rowData.id] },
            afterFormSentFn: async () => {
              await this._loadUsers();
            },
            onErrorsFn: async () => {
              await this._loadUsers();
            },
          });
        },
      },
    ];
    return structure;
  };

  _listUsernames = (selected) => {
    let names = '';
    for (let i = 0; i < selected.length; i++) {
      if (i !== 0) names += ', ';
      names += selected[i].username;
    }
    return names;
  };
}

export default UsersList;
