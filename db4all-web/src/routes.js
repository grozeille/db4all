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
      url: '/project',
      component: 'projectControllerComponent'
    })
    .state('projectDetail', {
      url: '/projectDetail/:id',
      component: 'projectDetailControllerComponent'
    })
    .state('entity', {
      url: '/project/:projectId/entity',
      component: 'entityControllerComponent'
    })
    .state('entityDetail', {
      url: '/project/:projectId/entity/:id',
      component: 'entityDetailControllerComponent'
    })
    ;

  $urlRouterProvider.otherwise('/project');
}
