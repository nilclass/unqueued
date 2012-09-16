define(['lib/underscore', 'framework/request'], function(ignored, Request) {

  function buildPattern(path) {
    var re = '^', keys = [];
    var parts = path.split('/');
    parts.forEach(function(part, i) {
      if(part[0] == ':') {
        keys.push(part.replace(/^:/, ''));
        re += '/([^/]+)'
      } else if(part == '*') {
        keys.push('*');
        re += '(?:/(.*)|)'
      } else if(part.length > 0) {
        re += '/' + part;
      } else if(i != 0) { // empty part, that isn't the first one.
        re += '/';
      }
    });
    re += '(?:#.*|)$';
    return { re: re, keys: keys };
  }

  function extractFormParams(form, params) {
    
    if(! params) { params = {} }

    function setParam(key, value, p) {
      if(! p) { p = params; }
      if(! key.indexOf('[')) {
        p[key] = value;
      } else {
        var md = key.match(/^([^\[])+\[([^\]]+)\](.*)$/);
        var parentKey = md[1], thisKey = md[2], rest = md[3];
        if(! p[parentKey]) {
          p[parentKey] = {};
        }
        setParam(thisKey + rest, value, p[parentKey]);
      }
    }

    _.each(form.childNodes, function(node) {
      if(node.tagName === 'INPUT' || node.tagName === 'SELECT') {
        var name = node.getAttribute('name'), type = node.getAttribute('type');
        if(name) {
          if(type === 'checkbox') {
            setParam(name, node.checked ? true : false);
          } else if(type === 'radio') {
            console.info("WARNING: radio buttons not implemented", node);
          } else if(type === 'button' || type === 'submit') {
            // ignored.
          } else {
            setParam(name, node.value);
          }
        }
      } else {
        extractFormParams(params);
      }
    });

    return params;
  }

  var router = {

    routes: [],

    /**
     ** Setup the router, by installing event handlers 
     **/
    setup: function() {
      window.onpopstate = function(event) {
        router.dispatch();
      }

      window.onclick = function(event) {
        if(event.target.tagName == 'A' &&
           event.target.getAttribute('href').match(/^\//)) {
          router.jump(event.target.getAttribute('href'));
          return false;
        }
        return true;
      }
    },

    /**
     ** Dispatch current request. You don't ever need to call this.
     **/
    dispatch: function(params) {

      var cb;
      while(this.onDispatchStack && (cb = this.onDispatchStack.pop())) {
        cb();
      }

      var request = new Request(String(document.location));
      request.addParams(params);
      console.log("DISPATCH", request);

      var routed = false;

      this.routes.some(function(route) {
        var md;
        if(md = request.path.match(route.pattern.re)) {
          route.pattern.keys.forEach(function(key, index) {
            if(key === '*' && md[index + 1]) {
              request.params['*'] = md[index + 1].split('/');
            } else {
              request.params[key] = md[index + 1];
            }
          });

          route.action(request);

          routed = true;

          return true;
        }
      });

      if(! routed) {
        console.log("Routes are: ", this.routes);

        throw "No matching route found: " + request.path;
      }
    },

    /**
     ** Install a route for the given path.
     ** The path can contain named params, prefixed with a colon.
     ** Example:
     **   addRoute('/foo/:bar', function(req) {});
     **
     ** Will match "/foo/xyz" and set req.params.bar to "xyz"
     **
     ** Named params from the path have precedence over query parameters,
     ** so "/foo/xyz?bar=abc" will still set bar to "xyz".
     **/
    addRoute: function(path, action) {
      console.log("ADD ROUTE", path, action);
      this.routes.push({
        path: path.replace(/\/\//g, '/'),
        pattern: buildPattern(path),
        action: action
      });
    },

    /**
     ** Jump to given path, through pushState, then dispatch.
     **/
    jump: function(path) {
      console.log("jump to", path);
      history.pushState(null, null, path);
      this.dispatch();
    },

    /**
     ** Call given function when navigating away from current action.
     **/
    onDispatch: function(callback) {
      if(! this.onDispatchStack) {
        this.onDispatchStack = []
      }
      this.onDispatchStack.push(callback);
    },

    /**
     ** Same as jump(), but drag along params from the form.
     **/
    jumpSubmit: function(path, form) {
      history.pushState(null, null, path);
      var params = extractFormParams(form);
      console.log('submitting params', params);
      this.dispatch(params);
    }

  };

  return router;

});
