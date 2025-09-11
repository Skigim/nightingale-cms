/**
 * ESLint Rule: no-window-fallbacks
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow using window.* as a fallback/guard; use registry/imports instead',
      recommended: false,
    },
    messages: {
      noFallback:
        'Avoid window fallbacks ({{ code }}). Use the registry (getComponent/registerComponent) or explicit imports instead.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    function usesWindow(node) {
      if (!node) return false;
      switch (node.type) {
        case 'Identifier':
          return node.name === 'window';
        case 'MemberExpression':
          return usesWindow(node.object);
        case 'ChainExpression':
          return usesWindow(node.expression);
        case 'CallExpression':
          return usesWindow(node.callee) || node.arguments.some(usesWindow);
        case 'LogicalExpression':
        case 'BinaryExpression':
          return usesWindow(node.left) || usesWindow(node.right);
        case 'ConditionalExpression':
          return (
            usesWindow(node.test) ||
            usesWindow(node.consequent) ||
            usesWindow(node.alternate)
          );
        case 'UnaryExpression':
          return usesWindow(node.argument);
        default:
          return false;
      }
    }

    function report(node) {
      context.report({
        node,
        messageId: 'noFallback',
        data: { code: sourceCode.getText(node) },
      });
    }

    return {
      LogicalExpression(node) {
        if ((node.operator === '||' || node.operator === '??') && usesWindow(node.left)) {
          report(node);
        }
      },
      IfStatement(node) {
        if (usesWindow(node.test)) {
          report(node.test);
        }
      },
      ConditionalExpression(node) {
        if (usesWindow(node.test)) {
          report(node);
        }
      },
    };
  },
};
