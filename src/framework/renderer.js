
define(
  ['lib/underscore', 'framework/view_helpers'],
  function(ignored, viewHelpers) {

    // root path of all templates.
    var ROOT = '/templates';

    // cache of template sources.
    var templateCache = {};

    return {

      /**
       ** LAYOUT
       **
       ** The layout is a static template, that is wrapped around the content.
       ** It will be rendered once, when setLayout() is called, but not on
       ** subsequent calls, unless the given name is different.
       **
       ** A layout MUST contain a content container, based on it's name.
       ** Example (in a layout called "foo"):
       **   <div id="foo-content"></div>
       **
       ** When render() is called, it will render within #foo-content.
       ** If no layout is set, it will render directly on the body.
       **/

      // name of current layout
      layoutName: null,
      // once layout is rendered, element to put the content
      contentContainer: null,
      // whether a layout is currently rendered
      layoutRendered: false,

      /**
       * Set layout to the one given by name. Once the layout is rendered, the
       * given callback will be called. If it already is the currently set layout,
       * the callback will be called immediately.
       **/
      setLayout: function(name, cb) {
        var oldName = this.layoutName;
        this.layoutName = name;
        if(this.layoutRendered && oldName == name) {
          cb();
        } else {
          this.renderLayout(cb);
        }
      },

      /**
       * Render currently set layout (by possibly overwriting a layout that's
       * already rendered), then call given callback.
       **/
      renderLayout: function(cb) {
        console.log('renderer.renderLayout("' + this.layoutName + '")', '--', cb);
        this.contentContainer = document.body;
        this.template('layouts/' + this.layoutName + '.html', {}, _.bind(function() {
          this.renderStatics();
          this.contentContainer = document.getElementById(
            this.layoutName + '-content'
          );
          if(cb) { cb(); }
        }, this));
      },

      /**
       ** STATICS
       **
       ** Statics are additional static DOM elements, which will be prepended
       ** to the body, after the layout has been rendered.
       ** Statics can be associated with a callback, which will be called, once
       ** they are set.
       ** The callback will be called on any layout switch (through setLayout()).
       **/

      // list of static elements, that get prepended to the layout.
      statics: [],

      /**
       * Add a static to the list, with the (optional) callback 'cb'.
       **/
      registerStatic: function(element, cb) {
        this.statics.push({
          element: element,
          callback: cb
        });
      },

      /**
       * Render all statics registered at this point, and call their callbacks.
       **/
      renderStatics: function() {
        console.log("RENDER STATICS", this.statics);
        _.each(this.statics, function(def) {
          document.body.insertBefore(def.element, document.body.firstElementChild);
          if(def.callback) { def.callback(); }
        }, this);
      },

      /**
       ** RENDERING
       **/

      /**
       * Render given source (expected to be a _.template compatible template),
       * with given locals, and append to contentContainer (see LAYOUTS for details
       * on what that is).
       **/
      render: function(source, locals) {
        ( this.contentContainer ||
          document.body ).innerHTML = _.template(source, locals);
      },

      /**
       * Given a map of the form { <id> : <view> }, render each view inside
       * the element with the given id. You need to make sure, these elements
       * actually exist.
       **/
      renderViews: function(viewMap) {
        _.each(viewMap, function(view, id) {
          this.renderView(id, view);
        }, this);
      },

      /**
       * Get element with given id, clear it's content, then render the
       * given view inside.
       **/
      renderView: function(id, view) {
        var element = document.getElementById(id);
        if(! element) {
          throw "View container not found: " + id;
        }
        element.innerHTML = '';
        element.appendChild(view.render());
      },

      /**
       * Prepare given locals, by extending them with common view helpers.
       **/
      prepareLocals: function(givenLocals) {
        return _.extend({}, givenLocals, viewHelpers);
      },

      /**
       * Render the template at given path, with the given locals.
       * This MAY trigger an ajax request, so anything that needs
       * to happen after the template is rendered, should go in the
       * given callback.
       **/
      template: function(path, locals, cb) {
        this.getTemplate(path, _.bind(function(source) {
          this.render(source, this.prepareLocals(locals));
          if(cb) cb();
        }, this));
      },

      /**
       * Load a template, either from remote or from local cache.
       * The given callback will be called with the template's source.
       **/
      getTemplate: function(path, cb) {
        if(templateCache[path]) {
          console.log("template from cache: " + path);
          cb(templateCache[path]);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', ROOT + '/' + path);
          xhr.onload = function() {
            var source = xhr.responseText;
            templateCache[path] = source;
            console.log("template from remote: " + path);
            cb(source);
          }
          xhr.send();
        }
      }
    }

  }
);
