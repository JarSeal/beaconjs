import { Component } from '../../../LIGHTER';

// Attributes for data:
// - item = data to show
// - index = list item array index number
class UniverseItem extends Component {
  constructor(data) {
    super(data);
    data.class = 'list-item';
    this.template = '<button></button>';
    this.item = data.item;
    this.index = data.index;
    this.title = this.addChild({
      id: this.id + '-title',
      tag: 'h3',
      text: data.item.title,
    });
  }

  addListeners = () => {
    this.addListener({
      id: this.id + '-item-click',
      type: 'click',
      fn: this._gotoRoute,
    });
  };

  paint = () => {
    this.title.draw();
  };

  _gotoRoute = (e) => {
    e.preventDefault();
    this.Router.changeRoute('/uni/' + this.item.universeId);
  };
}

export default UniverseItem;
