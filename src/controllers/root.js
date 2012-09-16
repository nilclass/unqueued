
define(['framework/controller'], function(Controller) {

  return new Controller('root', {

    routePrefix: '/',

    layout: 'root',

    actions: {

      index: function() {
        this.render('index');
      }

    }

  });

});