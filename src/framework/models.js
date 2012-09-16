
define(['framework/renderer', 'lib/remoteStorage-modules-debug', 'lib/underscore'], function(renderer) {

  function makeStubs() {
    return _.reduce(arguments, function(memo, stub) {
      memo[stub] = function() { throw "Not implemented: " + stub; }
      return memo;
    }, {});
  }

  function getUuid() {
    var uuid = '',
    i,
    random;

    for ( i = 0; i < 32; i++ ) {
      random = Math.random() * 16 | 0;
      if ( i === 8 || i === 12 || i === 16 || i === 20 ) {
        uuid += '-';
      }
      uuid += ( i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random) ).toString( 16 );
    }
    return uuid;
  }


  var baseModel = function(attributes) {
    if(attributes) {
      this.attributes = _.extend({}, this.attributes, attributes);
    } else {
      this.attributes = { id: getUuid() };
    }
  }

  baseModel.prototype = _.extend({
    attributes: {},

    attr: function(key, value) {
      console.log('attr', key, value, this);
      if(typeof(value) != 'undefined') {
        this.attributes[key] = value;
        return this;
      } else {
        return this.attributes[key];
      }
    }

  }, makeStubs('save'));

  var modelStatics = _.extend({
    setup: function() {},
  }, makeStubs('all'));

  var Collection = function(methods) {
    _.extend(this, methods);
  }

  Collection.prototype = makeStubs('list', 'on');

  return {

    Collection: Collection,

    setup: function() {

      remoteStorage.claimAccess.apply(remoteStorage, arguments);

      this.connectWidget = document.createElement('div');

      renderer.registerStatic(this.connectWidget, _.bind(function() {
        remoteStorage.displayWidget(this.connectWidget);
      }, this));

      // all modules have been loaded, setup() of the models can happen:
      _.each(this, function(model, name) {
        if(name.match(/^[A-Z]/) && (typeof(model.setup) === 'function')) {
          model.setup.apply(model);
        }
      }, this);

    },

    define: function(name, constructor, prototype, statics) {
      var model = function() {
        baseModel.apply(this, arguments);
        constructor.apply(this, arguments);
      }
      model.prototype = _.extend({}, baseModel.prototype, prototype);
      _.extend(model, modelStatics, statics);
      this[name] = model;
      return model;
    },

    remoteStorage: remoteStorage
  };
});
