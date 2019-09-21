import { computed, observer, set } from "@ember/object";
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

export default function wrap(input) {
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
      originalAction.apply(new Proxy(this, handler), args);
    };
  });

  Object.keys(input.watch).forEach(propName => {
    // eslint-disable-next-line ember/no-observers
    defaultData["_ob_" + propName] = observer(propName, input.watch[propName]);
  });
  Object.keys(input.computed).forEach(propName => {
    defaultData[propName] = computed(input.computed[propName]).volatile();
  });
  return Component.extend(defaultData);
}