module.exports = {
  extends: [
    'angular'
  ],
  globals: {
    '$': true,
    'Upload': true
  },
  rules: {
    'angular/no-service-method': 0,
    'space-before-function-paren': 0,
    'keyword-spacing': 0,
    'no-unused-vars': 1,
    'brace-style': 1,
    'no-lonely-if': 1,
    'no-else-return': 1,
    'guard-for-in': 1
  }
}
