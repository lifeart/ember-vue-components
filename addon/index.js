import { observer, set } from "@ember/object";
import Component from "@ember/component";
const noop = function() {};

const handler = {
  get(target, name) {
    if (typeof target[name] === "object" && target[name] !== null) {
      return new Proxy(target[name], handler);
    }
    return target[name];
  },
  set(target, name, value) {
    set(target, name, value);
    return true;
  },
  has(target, name) {
    return name in target;
  }
};

export function wrap(input) {
  const defaultData = {
    beforeCreate: input.beforeCreate || noop,
    beforeUpdate: input.beforeUpdate || noop,
    beforeDestroy: input.beforeDestroy || noop,
    beforeMounted: input.beforeMounted || noop,
    created: input.created || noop,
    mounted: input.mounted || noop,
    updated: input.updated || noop,
    destroyed: input.destroyed || noop,
    tagName: "",
    willDestroyElement() {
      this.beforeDestroy();
    },
    didDestroyElement() {
      this.destroyed();
    },
    init() {
      this.beforeCreate();
      this._super(...arguments);
      this.dataKeys = {};
      if (typeof input.data === "object") {
        this.dataKeys = JSON.parse(JSON.stringify(input.data));
      } else if (typeof input.data === "function") {
        this.dataKeys = input.data();
      }
      this.setProperties(this.dataKeys);
      this.created();
      this.beforeMounted();
    },
    willUpdate() {
      this.beforeUpdate();
      this.triggerComputeds();
    },
    didInsertElement() {
      this.mounted();
    },
    didRender() {
      this.updated();
    },
    triggerComputeds() {
      Object.keys(input.computed).forEach(key => {
        this.notifyPropertyChange(key);
      });
    },
    actions: input.actions || input.methods || {}
  };

  if (input.template) {
    defaultData.layout = input.template;
  }

  Object.keys(defaultData.actions).forEach(actionName => {
    const originalAction = defaultData.actions[actionName];
    defaultData.actions[actionName] = function(...args) {
      return originalAction.apply(new Proxy(this, handler), args);
    };
  });

  Object.keys(input.watch).forEach(propName => {
    const originalObserver = input.watch[propName];
    // eslint-disable-next-line ember/no-observers
    defaultData["_ob_" + propName] = observer(propName, function(...args) {
      return originalObserver.apply(new Proxy(this, handler), args);
    });
  });
  Object.keys(input.computed).forEach(propName => {
    const cp = input.computed[propName];
    const isCpFunction = typeof cp === "function";
    const descr = {
      get: isCpFunction ? cp : cp.get,
      set: isCpFunction
        ? function() {
            throw new Error(`Unable to rewrite computed property ${propName}!`);
          }
        : cp.set,
      enumerable: false,
      configurable: true
    };
    Object.defineProperty(defaultData, propName, descr);
    //defaultData[propName] = computed(input.computed[propName]).volatile();
  });
  return Component.extend(defaultData);
}
