import { getText } from '../../helpers/lang';
import Component from '../../LIGHTER/Component';
import RouteLink from '../buttons/RouteLink';
import ViewTitle from '../widgets/ViewTitle';

class FourOOne extends Component {
  constructor(data) {
    super(data);
    this.appState = data.appState;
    this.template = '<div>' + `<p>${getText('unauthorised')}</p>` + '</div>';
    this.viewTitle = this.addChild(
      new ViewTitle({
        id: this.id + '-view-title',
        heading: data.title || 401,
        prepend: true,
      })
    );
    this.button = this.addChild(
      new RouteLink({
        id: 'back-to-root',
        link: '/',
        text: getText('back_to_start'),
      })
    );
  }

  paint = () => {
    this.viewTitle.draw();
    this.button.draw();
  };
}

export default FourOOne;
