import { getText } from '../../../helpers/lang';
import { Component } from '../../../LIGHTER';
import SettingsGroup from '../../widgets/SettingsGroup';
import ViewTitle from '../../widgets/ViewTitle';
import ReadApi from '../../forms/ReadApi';

class MySettings extends Component {
  constructor(data) {
    super(data);
    this.template = '<div class="settings-tab-view"></div>';
    this.users = [];
    this.appState = this.Router.commonData.appState;
    this.Dialog = this.appState.get('Dialog');
    this.settingsComponents = [];
    this.settingsData = [];
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-sub-view-title',
        heading: getText('my_settings'),
        tag: 'h3',
        spinner: true,
      })
    );
    this.formDataApi = new ReadApi({ url: '/api/forms/user-settings-form' });
    this.settingsDataApi = new ReadApi({ url: '/api/settings' });
  }

  init = () => {
    this.viewTitle.draw();
    this._loadMySettings();
  };

  _loadMySettings = async () => {
    const formData = await this.formDataApi.getData();
    const settingsData = await this.settingsDataApi.getData();
    if (formData.redirectToLogin || settingsData.redirectToLogin) {
      this.viewTitle.showSpinner(false);
      this.Router.changeRoute('/logout?r=' + this.Router.getRoute(true));
      return;
    }
    if (formData.error || settingsData.error) {
      this.viewTitle.showSpinner(false);
      this.addChildDraw({
        id: 'error-getting-my-settings',
        template: `<div class="error-text">${getText('could_not_get_data')}</div>`,
      });
    }

    this._createsettingsComponents(formData, settingsData);
  };

  _createsettingsComponents = (formData, settingsData) => {
    const fieldsets = formData.fieldsets;
    for (let i = 0; i < fieldsets.length; i++) {
      const fs = fieldsets[i];
      const data = {
        fsId: fs.id,
        fsTitleId: fs.fieldsetTitleId,
        fsDescriptionId: fs.descriptionId,
        fields: [],
      };
      for (let j = 0; j < fs.fields.length; j++) {
        const fieldId = fs.fields[j].id;
        let value, mongoId;
        for (let k = 0; k < settingsData.length; k++) {
          if (settingsData[k].settingId === fieldId) {
            value = settingsData[k].value;
            mongoId = settingsData[k].id;
            break;
          }
        }
        if (!value) value = fs.fields[j].defaultValue;
        data.fields.push({
          id: fieldId,
          mongoId,
          type: fs.fields[j].type,
          value,
          labelId: fs.fields[j].labelId,
          descriptionId: fs.fields[j].descriptionId,
          defaultValue: fs.fields[j].defaultValue,
          options: fs.fields[j].options,
        });
      }
      this.addChildDraw(
        new SettingsGroup({
          id: 'user-settings-g-' + fs.id,
          settingsData: data,
          formId: 'user-settings-form',
          updateSettings: this._loadMySettings,
        })
      );
    }

    this.viewTitle.showSpinner(false);
  };
}

export default MySettings;
