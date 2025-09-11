// Local ESLint plugin aggregating custom rules
module.exports = {
  rules: {
    'no-prop-types-disable': require('./no-prop-types-disable.cjs'),
  },
};
