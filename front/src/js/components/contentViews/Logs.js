import { createDate } from '../../helpers/date';
import { getText } from '../../helpers/lang';
import { Component } from '../../LIGHTER';
import RouteLink from '../buttons/RouteLink';
import Table from '../widgets/Table';

class Logs extends Component {
  constructor(data) {
    super(data);
    this.template =
      '<div>' +
      '<div class="created-wrapper" id="created-log">' +
      `<h3>${getText('created')}</h3>` +
      '</div>' +
      '<div class="edited-wrapper" id="edited-logs">' +
      `<h3>${getText('edited')}</h3>` +
      '</div>' +
      '<div class="edited-wrapper" id="last-logins-logs">' +
      `<h3>${getText('last_logins')}</h3>` +
      '</div>' +
      '</div>';
    this.addChild({
      id: 'created-elem',
      attach: 'created-log',
      template: this.data.userData.created
        ? '<div>' +
          `<span>${createDate(this.data.userData.created.date)}</span>` +
          (this.data.userData.created.publicForm ? ` (${getText('public_form')})` : ' by&nbsp;') +
          '</div>'
        : '',
    });
    if (this.data.userData.created && !this.data.userData.created.publicForm) {
      this.addChild(
        new RouteLink({
          id: 'created-by-user-link',
          link: '/user/' + this.data.userData.created.by.username,
          class: 'link',
          text: this.data.userData.created.by.username,
          attach: 'created-elem',
          tag: 'a',
        })
      );
    }
    if (this.data.userData.edited) {
      this.addChild(
        new Table({
          id: 'edited-logs-table',
          attach: 'edited-logs',
          fullWidth: true,
          unsortable: true,
          tableData: this.data.userData.edited,
          tableStructure: this._getEditedTableStructure(),
          rowClickFn: (e, rowData) => {
            if (!rowData.by || !rowData.by.username) return;
            this.Router.changeRoute('/user/' + rowData.by.username, { forceUpdate: true });
          },
        })
      );
    }
    if (this.data.userData.security && this.data.userData.security.lastLogins) {
      this.addChild(
        new Table({
          id: 'lastlogins-logs-table',
          attach: 'last-logins-logs',
          fullWidth: true,
          unsortable: true,
          hideTableHeader: true,
          tableData: this.data.userData.security.lastLogins,
          tableStructure: this._getLoginsTableStructure(),
        })
      );
    }
  }

  paint = () => {
    this.drawChildren();
  };

  _getEditedTableStructure = () => {
    const structure = [
      {
        key: 'date',
        heading: getText('date'),
        sort: 'asc',
        type: 'Date',
      },
      {
        key: 'by.username',
        heading: getText('edited_by'),
      },
    ];
    return structure;
  };

  _getLoginsTableStructure = () => {
    const structure = [
      {
        key: 'date',
        sort: 'asc',
        type: 'Date',
      },
    ];
    return structure;
  };
}

export default Logs;
