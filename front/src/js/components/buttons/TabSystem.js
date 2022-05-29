import { Component } from '../../LIGHTER';
import RouteLink from './RouteLink';
import './TabSystem.scss';

// Attributes:
// - tabs = Array[Object]
//     -> tab Object {
//          label: String [required],
//          id: String [required],
//          routeLink: String,
//          class: Array[String] or String,
//          disabled: Boolean,
//          setLabelInTitle: Boolean,
//          show: Boolean,
//        }
class TabSystem extends Component {
  constructor(data) {
    super(data);
    this.tabs = data.tabs;
    this.template = '<div class="tab-system"></div>';

    // Create tabs buttons
    this.buttons = [];
    for (let i = 0; i < data.tabs.length; i++) {
      let attributes,
        id = data.tabs[i].id;
      if (data.tabs[i].disabled) attributes = { disabled: '' };
      this.buttons.push(
        this.addChild(
          new RouteLink({
            id,
            class: data.tabs[i].class,
            text: data.tabs[i].label,
            link: data.tabs[i].routeLink,
            setLabelInTitle: data.tabs[i].setLabelInTitle,
            attributes,
          })
        )
      );
    }
  }

  paint = () => {
    for (let i = 0; i < this.buttons.length; i++) {
      if (this.tabs[i].show === false) continue;
      this.buttons[i].draw();
      if (this.buttons[i].data.setLabelInTitle && this.buttons[i].isCurrent) {
        document.title = this.buttons[i].data.text + ' | ' + document.title;
      }
    }
  };

  getCurrent = () => {
    for (let i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].isCurrent) {
        return this.data.tabs[i];
      }
    }
  };
}

export default TabSystem;
