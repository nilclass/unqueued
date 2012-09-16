
define(['framework/views/base', 'lib/underscore'], function(views) {

  views.extend('ContainerItem', 'Div', function(item) {
    views.Div.apply(this, ['container-item']);
    this.onActivateCbs = [];
    this.item = item;

    function closestItem(element) {
      if(/(?:^|\s)container\-item(?:$|\s)/.test(element.getAttribute('class'))) {
        return element;
      } else if(element.parentNode) {
        return closestItem(element.parentNode);
      } else {
        return null;
      }
    }

    this.on('click', _.bind(function(event) {
      var targetItem = closestItem(event.target);
      if(targetItem == this.root) {
        event.preventDefault();
        this.triggerActivate();
        return false;
      }
    }, this));

  }, {
    updateData: function(item) {},

    onActivate: function(callback) {
      this.onActivateCbs.push(callback);
    },

    triggerActivate: function() {
      _.each(this.onActivateCbs, function(cb) {
        cb(this);
      }, this);
    }
  });

  views.extend('Container', 'Div', function(collection, options) {
    views.Div.apply(this, ['container']);
    this.collection = collection;

    this.onItemCbs = [];

    this.options = (typeof(options) == 'object') ? options : {};

    this.reload();

  }, {

    elements: [],

    buildItem: function(item) {
      throw "Not implemented: buildItem(item)";
    },

    getIdentifier: function(item) {
      throw "Not implemented: getIdentifier(item)";
    },

    onItemClick: function(callback) {
      this.onItemCbs.push(callback)
    },

    triggerItemClick: function(item) {
      console.log('triggered click', item, this.onItemCbs.length);
      _.each(this.onItemCbs, function(callback) {
        callback(item);
      });
    },

    reload: function() {

      this.clear();

      var list;

      if(this.options.stupid) {
        list = this.collection;
      } else {
        list = this.collection.list();
        this.collection.on('change', _.bind(this.onItemChange, this));
      }

      // fire change for all current items. this should probably be handled by
      // remoteStorage itself.
      _.each(list, function(item) {
        this.onItemChange({
          newValue: item
        });
      }, this);
    },

    clear: function() {
      this.text('');
    },

    addItem: function(item) {
      var element = this.buildItem(item);
      element.container = this;

      element.onActivate(_.bind(function(node) {
        console.log('click', node);
        this.triggerItemClick(node.item);
      }, this));

      this.elements[this.getIdentifier(item)] = element;
      this.append(element);
    },

    updateItem: function(item) {
      var id = this.getIdentifier(item);
      if(id in this.elements) {
        this.elements[id].updateData(item);
      } else {
        this.addItem(item);
      }
    },

    removeItem: function(item) {
      var id = this.getIdentifier(item);
      if(id in this.elements) {
        this.elements[id].remove();
        delete this.elements[id];
      }
    },

    onItemChange: function(change) {
      console.log("CHANGE", arguments);
      ( (change.oldValue && change.newValue) ?
        this.updateItem(change.newValue) :
        ( change.oldValue ?
          this.removeItem(change.oldValue) :
          this.addItem(change.newValue) ) )
    }
  });

  return views;

});

