import React from 'react';
import hoistStatics from 'hoist-non-react-statics';

const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
);

export function injectDeps(context, _actions) {
  const actions = {};
  for (let namespace in _actions) {
    if (_actions.hasOwnProperty(namespace)) {
      actions[namespace] = {};
      let namespaceActions = _actions[namespace];
      for (let namespaceAction in namespaceActions) {
        if (namespaceActions.hasOwnProperty(namespaceAction)) {
          actions[namespace][namespaceAction] = {};
          let actionFuncs = namespaceActions[namespaceAction];
          let actionFuncsExist = false;
          for (let actionFunc in actionFuncs) {
            if (actionFuncs.hasOwnProperty(actionFunc) &&
              typeof actionFuncs[actionFunc] === 'function'
            ) {
              actions[namespace][namespaceAction][actionFunc] =
                actionFuncs[actionFunc].bind(null, context);
              actionFuncsExist = true;
            }
          }
          if (!actionFuncsExist &&
            actions.hasOwnProperty(namespace) &&
            typeof actionFuncs === 'function'
          ) {
            actions[namespace][namespaceAction] =
              actionFuncs.bind(null, context);
          }
        }
      }
    }
  }

  return function (Component) {
    const ComponentWithDeps = React.createClass({
      childContextTypes: {
        context: React.PropTypes.object,
        actions: React.PropTypes.object
      },

      getChildContext() {
        return {
          context,
          actions
        };
      },

      render() {
        return (<Component {...this.props} />);
      }
    });

    ComponentWithDeps.displayName = `WithDeps(${getDisplayName(Component)})`;
    return hoistStatics(ComponentWithDeps, Component);
  };
}

const defaultMapper = (context, actions) => ({
  context: () => context,
  actions: () => actions
});

export function useDeps(mapper = defaultMapper) {
  return function (Component) {
    const ComponentUseDeps = React.createClass({
      render() {
        const {context, actions} = this.context;
        const mappedProps = mapper(context, actions);

        const newProps = {
          ...this.props,
          ...mappedProps
        };

        return (<Component {...newProps} />);
      },

      contextTypes: {
        context: React.PropTypes.object,
        actions: React.PropTypes.object
      }
    });

    ComponentUseDeps.displayName = `UseDeps(${getDisplayName(Component)})`;
    return hoistStatics(ComponentUseDeps, Component);
  };
}
