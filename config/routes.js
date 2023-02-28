/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */



module.exports.routes = {
  'GET /': { action: 'index' },
  'GET /annotations/:taskid/new': { action: 'annotations' },
  'GET /ground-truths/:taskid/new': { action: 'ground-truths' },
  'GET /line-divisions/:taskid/new': { action: 'line-divisions' },
  'GET /403': { action: 'error-403' },
  'GET /404': { action: 'error-404' },
  'GET /500': { action: 'error-500' },
  'GET /simple': { action: 'simple-boxes' },
  'GET /success/:message': { action: 'success' },
  'GET /exports/:exportid': { action: 'exports' },
  'GET /login': { action: 'login' },
  'GET /signup': { action: 'signup' },
  'GET /tasks/new': { action: 'tasks-new' },
  'GET /tasks': { action: 'tasks' },
  'GET /tasks/images-preview/:taskid': { action: 'task-images-preview' },
  'GET /users/new': { action: 'users-new' },
  'GET /users/:id': { action: 'users-edit' },
  'GET /users': { action: 'users' },
  'GET /oops': { action: 'oops' },
  'POST /api/users' : { action: 'api-users-post' },
  'PUT /api/users' : { action: 'api-users-put' },
  'POST /api/sessions' : { action: 'api-sessions-post' },
  'DELETE /api/sessions' : { action: 'api-sessions-delete' },
  'GET /api/workers/:name' : { action: 'api-workers-get'},
  'POST /api/exports/' : { action: 'api-exports-post'},
  'GET /api/images/' : { action: 'api-images-count'},
  'PUT /api/images/:imageid' : { action: 'api-images-put' },
  'DELETE /api/images' : { action: 'api-images-delete' },
  'POST /api/tasks' : { action: 'api-tasks-post' },
  'GET /api/tasks' : { action: 'api-tasks-get' },
  'POST /api/annotations' : { action: 'api-annotations-post' },
  'POST /api/ground-truths' : { action: 'api-ground-truths-post' },
  'POST /api/line-divisions' : { action: 'api-line-divisions-post' },
  'POST /api/labels' : { action: 'api-labels-post' },
  'GET /api/labels' : { action: 'api-labels-get' },
  'DELETE /api/labels' : { action: 'api-labels-delete' },
  'PUT /api/queuedimages/:queuedimageid' : { action: 'api-queuedimages-put' },
  'PUT /api/sequenced-pairs/:sequencedpairid' : { action: 'api-sequencedpairs-put' },
  'GET /uploads/:imageid' : { action: 'static-uploads' },
  'GET /csvs/:csvid' : { action: 'csv-files' },
  'GET /:unknown' : { action: 'error-404' }

};
