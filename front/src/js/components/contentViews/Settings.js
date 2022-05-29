import { getText } from '../../helpers/lang';
import { getAdminRights } from '../../helpers/storage';
import { Component } from '../../LIGHTER';
import TabSystem from '../buttons/TabSystem';
import ViewTitle from '../widgets/ViewTitle';
import FourOOne from './FourOOne';
import AdminSettings from './settingsTabs/settings_Admin';
import MyProfile from './settingsTabs/settings_MyProfile';
import MySettings from './settingsTabs/settings_MySettings';
import UsersList from './settingsTabs/settings_Users';

class Settings extends Component {
  constructor(data) {
    super(data);
    const defaultTab = 'my-profile';
    this.curTab = defaultTab;
    this.template = '<div></div>';
    this.adminRights = {};
    this.tabSystem;
    this.tabs = [];
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title,
      })
    );
    this.appState = this.Router.commonData.appState;
  }

  init = async () => {
    const params = this.Router.curRouteData.params;
    if (params && params.tab === 'default') {
      this.Router.changeRoute('/settings/' + this.curTab, {
        forceUpdate: true,
        replaceState: true,
      });
      return;
    }

    this.adminRights = await getAdminRights();
    if (this.adminRights.loggedIn === false) {
      this.Router.changeRoute('/logout?r=' + this.Router.getRoute(true));
      return;
    }

    this._defineTabs();
    this.tabSystem = this.addChild(
      new TabSystem({
        id: 'settings-tabs',
        tabs: this.tabs,
      })
    );

    this.rePaint();
  };

  paint = () => {
    this.viewTitle.draw();
    if (this.tabSystem) {
      this.tabSystem.draw();
      const currentTab = this.tabSystem.getCurrent();
      if (currentTab) {
        this.addChild(new currentTab.component({ id: 'view-' + currentTab.id })).draw();
      } else {
        this.addChild(new FourOOne({ id: 'four-o-one-tab', title: '401' })).draw();
      }
    }
  };

  _defineTabs = () => {
    const isVerified = this.appState.get('user.verified') !== false;
    const define = [
      {
        id: 'my-profile',
        label: getText('my_profile'),
        component: MyProfile,
      },
      {
        id: 'my-settings',
        label: getText('my_settings'),
        show: isVerified,
        component: MySettings,
      },
      {
        id: 'users',
        label: getText('users'),
        adminUseRights: 'read-users',
        show: isVerified && this.adminRights.useRights.includes('read-users'),
        component: UsersList,
      },
      {
        id: 'admin-settings',
        label: getText('admin_settings'),
        adminUseRights: 'read-users', // TODO change to admin settings
        show: isVerified && this.adminRights.useRights.includes('read-users'), // TODO change to admin settings
        component: AdminSettings,
      },
    ];

    for (let i = 0; i < define.length; i++) {
      this.tabs.push({
        ...define[i],
        routeLink: '/settings/' + define[i].id,
        setLabelInTitle: true,
      });
    }
  };
}

export default Settings;
