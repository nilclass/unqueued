
define(['framework/router', 'lib/underscore'], function(router) {
  var views = {
    define: function(name, constructor, prototype) {
      this[name] = constructor;
      this[name].prototype = _.extend({}, this.base, prototype);
    },

    // extend(name, constructor, prototype) OR
    // extend(name, parentName, constructor, prototype)
    extend: function() {
      var args = _.toArray(arguments);
      var name = args.shift(), parentName = args.shift(), constructor, prototype;

      if(typeof(parentName) == 'function') {
        constructor = parentName;
        parentName = name;
      } else {
        constructor = args.shift();
      }

      prototype = args.shift();

      var parent = this[parentName];
      if(! parent) {
        throw 'Can\'t extend undefined view "' + parentName + '".';
      }
      this[name] = constructor;
      console.log("DEFINE VIEW", name, [parent.prototype, prototype]);
      this[name].prototype = _.extend({}, parent.prototype, prototype);
    },
    define: function(name, constructor, prototype) {
      this.extend(name, 'Base', constructor, prototype);
    },
    Base: function() {},
  };

  views.Base.prototype = {

    jump: function(path) {
      router.jump(path);
    }

  };

  return views;
});
