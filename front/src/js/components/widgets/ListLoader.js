import axios from 'axios';
import { Component } from '../../LIGHTER';
import { _CONFIG } from '../../_CONFIG';

// Attributes for data:
// - api = API to call when the list is loaded
// - component = the component that will show the data
class ListLoader extends Component {
  constructor(data) {
    super(data);
    data.class = 'item-list';
    this.api = data.api;
    this.component = data.component;
    this.loading = false;
    this.list = [];
    this.listComponents = [];
    this.updateList();
  }

  paint = () => {
    for (let i = 0; i < this.listComponents.length; i++) {
      this.listComponents[i].draw();
    }
  };

  updateList = () => {
    this._loadData();
  };

  _loadData = async () => {
    this.loading = true;
    const url = _CONFIG.apiBaseUrl + this.api;
    const response = await axios.get(url, { withCredentials: true });
    this.list = response.data;
    this.buildList();
    this.rePaint();
  };

  buildList = () => {
    this.clearList();
    for (let i = 0; i < this.list.length; i++) {
      this.listComponents.push(
        this.addChild(
          new this.component({
            id: this.id + '-item-' + i,
            index: i,
            item: this.list[i],
          })
        )
      );
    }
  };

  erase = () => {
    this.clearList();
  };

  clearList = () => {
    for (let i = 0; i < this.listComponents.length; i++) {
      this.listComponents[i].discard(true);
    }
    this.listComponents = [];
  };
}

export default ListLoader;
