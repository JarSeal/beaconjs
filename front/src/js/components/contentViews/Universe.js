import axios from 'axios';
import { Component } from '../../LIGHTER';
import * as parsers from '../../shared';
import { _CONFIG } from '../../_CONFIG';
import ViewTitle from '../widgets/ViewTitle';

class NewUser extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.universeId;
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: '',
      })
    );
  }

  init = () => {
    if (
      this.Router.curRouteData.params &&
      this.Router.curRouteData.params.universeId &&
      parsers.validateSimpleId(this.Router.curRouteData.params.universeId)
    ) {
      this.universeId = this.Router.curRouteData.params.universeId;
      this.getData();
    } else {
      const path404 =
        '/404/universe/' +
        (this.Router.curRouteData.params ? this.Router.curRouteData.params.universeId : '');
      this.Router.changeRoute(path404);
      return;
    }
  };

  paint = () => {
    this.viewTitle.draw({ spinner: true });
  };

  getData = async () => {
    this.viewTitle.showSpinner(true);

    const path = '/api/universes/' + this.universeId;
    const response = await axios.get(_CONFIG.apiBaseUrl + path, { withCredentials: true });
    const uniData = response.data;

    if (!uniData) {
      this.Router.changeRoute('/404/universe/' + this.universeId);
      return;
    }

    this.viewTitle.showSpinner(false);
    setTimeout(() => {
      this.viewTitle.updateHeading(uniData.title);
    }, this.viewTitle.spinnerFadeTime + this.viewTitle.spinnerFadeTime / 4);
  };
}

export default NewUser;
