module.exports = routesConfig;

/** @ngInject */
function routesConfig($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('dataset', {
      url: '/dataset',
      component: 'datasetControllerComponent'
    })
    .state('wranglingDataSet', {
      url: '/dataset/wrangling',
      component: 'wranglingDataSetControllerComponent'
    })
    .state('wranglingDataSetTableSelection', {
      url: '/dataset/tableSelection',
      component: 'wranglingDataSetTableSelectionControllerComponent'
    })
    .state('customFileDataSet', {
      url: '/dataset/customFile',
      component: 'customFileDataSetControllerComponent'
    })
    .state('viewDataSet', {
      url: '/dataset/view',
      component: 'viewDataSetControllerComponent'
    })
    .state('admin', {
      url: '/admin',
      component: 'adminControllerComponent'
    })
    .state('profile', {
      url: '/profile',
      component: 'profileControllerComponent'
    })
    .state('setup', {
      url: '/setup',
      component: 'setupControllerComponent'
    })
    .state('project', {
      url: '/project/:id',
      component: 'projectControllerComponent'
    })
    ;

  $urlRouterProvider.otherwise('/dataset');
}
