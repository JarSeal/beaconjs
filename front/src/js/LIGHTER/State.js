const globalState = {};
// const globalListeners = [];
// const globalListenerCallbacks = [];
// TODO: ADD GLOBAL STATE LISTENER

class State {
  constructor(initState) {
    this.initState = initState;
    this.state = initState || {};
    this.listeners = [];
    this.listenerCallbacks = [];
  }

  set(key, value, listenerCallback, global) {
    // TODO: check if current key is "shorter" than the new key
    // eg. current state { test: 123 } and new state { test: { another: 555 }}
    // currently this causes an error
    // the old key value pair should propably just be removed after the check and replaced with the new
    if (!key) return;

    const keys = key.split('.');
    let oldValue;

    // Flat keys (one level)
    if (keys.length === 1) {
      if (global) {
        globalState[key] = value;
        return;
      }
      oldValue = this.state[keys[keys.length - 1]];
      this.state[key] = value;
      this._checkListeners(oldValue, value, key);
      return;
    }

    // Deep keys
    let pos = global ? globalState[keys[0]] : this.state[keys[0]];
    if (pos === undefined) {
      // Create a new object if not found
      if (global) {
        globalState[keys[0]] = pos = {};
      } else {
        this.state[keys[0]] = pos = {};
      }
    }
    for (let i = 1; i < keys.length - 1; i++) {
      if (pos[keys[i]] === undefined) pos[keys[i]] = {}; // Create a new object if not found
      pos = pos[keys[i]];
    }
    if (!global) {
      oldValue = pos[keys[keys.length - 1]];
      pos[keys[keys.length - 1]] = value;
      this._checkListeners(oldValue, value, key);
    } else {
      pos[keys[keys.length - 1]] = value;
    }

    if (listenerCallback && !global) this.addListener(key, listenerCallback);
  }

  get(key, global) {
    if (!key) return;
    const keys = key.split('.');

    // Flat keys (one level)
    if (keys.length === 1) {
      if (global) return globalState[key];
      return this.state[key];
    }

    // Deep keys
    let pos = global ? globalState[keys[0]] : this.state[keys[0]];
    for (let i = 1; i < keys.length; i++) {
      if (pos === undefined || pos[keys[i]] === undefined) return undefined;
      pos = pos[keys[i]];
    }

    return pos;
  }

  remove(key, global) {
    if (!key) return;
    if (!global) {
      this.removeListener(key);
    }

    const keys = key.split('.');

    // Flat keys (one level)
    if (keys.length === 1) {
      if (global) {
        if (globalState[key] === undefined) return;
        delete globalState[key];
        return;
      }
      if (this.state[key] === undefined) return;
      delete this.state[key];
      return;
    }

    // Deep keys
    let pos = global ? globalState[keys[0]] : this.state[keys[0]];
    for (let i = 1; i < keys.length - 1; i++) {
      if (pos === undefined || pos[keys[i]] === undefined) return;
      pos = pos[keys[i]];
    }
    if (pos === undefined) return;

    delete pos[keys[keys.length - 1]];
  }

  getObject() {
    return this.state;
  }

  addListener(key, callback) {
    this.listeners.push(key);
    this.listenerCallbacks.push(callback);
  }

  removeListener(key) {
    const index = this.listeners.indexOf(key);
    if (index > -1) {
      this.listeners.splice(index, 1);
      this.listenerCallbacks.splice(index, 1);
    }
  }

  _checkListeners(oldValue, value, key) {
    if (oldValue === value) return;
    const index = this.listeners.indexOf(key);
    if (index > -1) {
      this.listenerCallbacks[index](value, oldValue);
    }
  }

  getKeys(from) {
    if (!from) {
      // Flat keys (one level)
      return Object.keys(this.state);
    }

    // Deep keys
    const keys = from.split('.');
    let pos = this.state[keys[0]];
    for (let i = 1; i < keys.length - 1; i++) {
      if (pos === undefined || pos[keys[i]] === undefined) return;
      pos = pos[keys[i]];
    }
    if (pos === undefined) return [];

    return Object.keys(pos);
  }

  getG(key) {
    return this.get(key, true);
  }

  getGObject() {
    return globalState;
  }

  setG(key, value) {
    this.set(key, value, null, true);
  }

  removeG(key) {
    this.remove(key, true);
  }
}

export default State;
