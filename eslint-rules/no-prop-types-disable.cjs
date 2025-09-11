/**
 * ESLint Rule: no-prop-types-disable
 * Forbids adding ESLint directive comments that disable react/prop-types.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow // eslint-disable comments for react/prop-types rule',
      recommended: false,
    },
    messages: {
      noDisable: 'Do not disable react/prop-types via ESLint comments. Remove the disable and add proper PropTypes instead.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();

    comments.forEach((comment) => {
      // Normalize comment text
      const text = comment.value.replace(/\s+/g, ' ').toLowerCase();
      // Match forms: eslint-disable, eslint-disable-line, eslint-disable-next-line
      if (
        /eslint-disable(-next-line|-line)?/.test(text) &&
        text.includes('react/prop-types')
      ) {
        context.report({ node: comment, messageId: 'noDisable' });
      }
    });

    return {};
  },
};
