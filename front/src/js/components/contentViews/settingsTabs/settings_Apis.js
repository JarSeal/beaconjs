import { Component, SessionStorage, LocalStorage } from '../../../LIGHTER';
import ViewTitle from '../../widgets/ViewTitle';
import { getText } from '../../../helpers/lang';
import ReadApi from '../../forms/ReadApi';
import TableWithSearch from '../../widgets/TableWithSearch';
import { getHashCode } from '../../../helpers/utils';

class ApiSettings extends Component {
  constructor(data) {
    super(data);
    this.template = '<div class="settings-tab-view"></div>';
    this.appState = this.Router.commonData.appState;
    this.Dialog = this.appState.get('Dialog');
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-sub-view-title',
        heading: getText('api_settings'),
        tag: 'h3',
        spinner: true,
      })
    );
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
    this.tableDataApi = new ReadApi({ url: '/settings/apis' });
    this.apisData = [];
    this.apisTable = this.addChild(
      new TableWithSearch({
        id: 'apis-table',
        fullWidth: true,
        tableData: this.apisData?.result || [],
        totalCount: this.apisData?.totalCount || 0,
        showStats: true,
        tableStructure: this._getTableStructure(),
        searchHotKey: 's',
        searchFields: 'formId,path,method',
        tableParams: params,
        rowClickFn: (e, rowData) => {
          console.log('CLICK', rowData);
        },
        afterChange: async (queryParams) => {
          this.apisData = await this.tableDataApi.getData(queryParams);
          this.apisTable.updateTable(
            { tableData: this.apisData?.result || [], totalCount: this.apisData?.totalCount || 0 },
            true
          );
          if (!username || !storage) return;
          const dataString = JSON.stringify(queryParams);
          storage.setItem(storageHandle, dataString);
        },
      })
    );
  }

  init = () => {
    this.viewTitle.draw();
    this._loadApis();
    this.apisTable.draw({
      tableData: this.apisData?.result || [],
      totalCount: this.apisData?.totalCount || 0,
    });
  };

  _loadApis = async () => {
    this.apisData = await this.tableDataApi.getData();
    this.viewTitle.showSpinner(false);
    if (this.apisData.error) return;
    this.apisTable.updateTable({
      tableData: this.apisData?.result || [],
      totalCount: this.apisData?.totalCount || 0,
    });
  };

  _getTableStructure = () => {
    const structure = [
      {
        key: 'formId',
        heading: getText('form_id'),
        sort: 'desc',
      },
      {
        key: 'path',
        heading: getText('path'),
      },
      {
        key: 'method',
        heading: getText('method'),
      },
      {
        key: 'type',
        heading: getText('type'),
      },
      {
        key: 'created.date',
        heading: getText('created'),
        type: 'Date',
      },
    ];
    return structure;
  };
}

export default ApiSettings;
