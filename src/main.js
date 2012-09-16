

require.config = {
  baseUrl: 'src'
}

define(
  ['framework/router',
   'framework/error_handler',
   'framework/models',
   'controllers/root',
   'controllers/inbox',
   'controllers/debug'
  ], function(router, errorHandler, models, rootController, inboxController, debugController) {
    window.router = router;
    errorHandler.setup();
    router.setup();
    models.setup('messages');

    rootController.setup();
    inboxController.setup();
    debugController.setup();

    remoteStorage.displayWidget('remotestorage-connect');

});