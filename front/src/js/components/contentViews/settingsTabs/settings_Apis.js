import { Component } from '../../../LIGHTER';
import ViewTitle from '../../widgets/ViewTitle';
import { getText } from '../../../helpers/lang';
import ReadApi from '../../forms/ReadApi';
import TableWithSearch from '../../widgets/TableWithSearch';

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
        rowClickFn: (e, rowData) => {
          console.log('CLICK', rowData);
        },
        afterChange: async (queryParams) => {
          console.log('CHANGE', queryParams);
          this.apisData = await this.tableDataApi.getData(queryParams);
          this.apisTable.updateTable(
            { tableData: this.apisData?.result || [], totalCount: this.apisData?.totalCount || 0 },
            true
          );
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
    console.log('TADAA', this.apisData);
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
