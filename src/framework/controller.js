/** Controller - context based actions
 **
 ** Example controller:
 **   new Controller('messages', {
 **     layout: 'root',
 **     actions: {
 **       index: function(request) {
 **         this.render('index', { messages: Message.all() });
 **       }
 **     }
 **   });
 **/
define(['framework/router', 'framework/renderer', 'lib/underscore'], function(router, renderer) {

  var Controller = function(name, options) {

    if(typeof(name) !== 'string') {
      throw "Invalid controller name: " + name;
    }

    this.name = name;
    this.routePrefix = '/' + name;
    _.extend(this, options);
    if(! this.actions) {
      this.actions = {};
    }

  }

  Controller.prototype = {

    /**
     ** SETUP
     **/

    setup: function() {
      console.log("SETUP CONTROLLER " + this.name);
      router.addRoute(this.routePrefix + '/:action/*', _.bind(function(request) {
        this.callAction(request.params.action, arguments);
      }, this));
      router.addRoute(this.routePrefix, _.bind(function(request) {
        this.callAction('index', arguments);
      }, this));
    },

    /**
     ** FILTERS
     **/

    filters: { before: [], after: [] },

    beforeFilter: function(handler) {
      this.filters.before.push(handler);
    },

    afterFilter: function(handler) {
      this.filters.after.push(handler);
    },

    runFilters: function(type) {
      _.each(this.filters[type], function(filter) {
        filter.apply(this);
      }, this);
    },

    /**
     ** ACTIONS
     **/

    addAction: function(name, handler) {
      this.actions[name] = handler;
    },

    callAction: function(name, args) {
      var action = this.actions[name];
      if(! action) {
        console.error("Undefined action: " + this.name + '/' + name);
        return;
      }

      this.runFilters('before');
      action.apply(this, args);
      this.runFilters('after');
    },

    /**
     ** RENDERING
     **/

    render: function(template, locals) {
      console.log('render', template, locals);

      locals = locals || {};

      this.renderLayout(_.bind(function() {

        renderer.template(
          this.name + '/' + template + '.html',
          locals,
          _.bind(function() {
            this.renderViews(locals.views);            
          }, this)
        );

      }, this));
    },

    renderView: _.bind(renderer.renderView, renderer),
    renderViews: _.bind(renderer.renderViews, renderer),

    renderLayout: function(cb) {
      if(this.layout && ! (renderer.layoutRendered && renderer.layoutName == this.layout)) {
        renderer.setLayout(this.layout, cb);
      } else {
        cb();
      }
    },

    /**
     ** NAVIGATION
     **/

    jump: function(path) {
      if(path[0] != '/' && (path.length > 0)) {
        path = this.routePrefix + '/' + path;
      } else if(path.length == 0) {
        path = this.routePrefix;
      }
      router.jump(path);
    },

    onCleanup: function(callback) {
      router.onDispatch(callback);
    }

  }

  return Controller;

});
