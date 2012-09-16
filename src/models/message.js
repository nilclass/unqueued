
define(['framework/models', 'remoteStorage-messages', 'lib/underscore'], function(models, messages) {

  messages.index.use('read');

  var syncInterval = 25000;

  return models.define('Message', function() {
    if(this.attributes.id) {
      this.id = this.attributes.id;
    }
  }, {

    markRead: function(callback) {
      this.updateAttributes({ read: true }, callback);
    },

    markUnread: function(callback) {
      this.updateAttributes({ read: false }, callback);
    },

    updateAttributes: function(attributes, callback) {
      this.loadAll(_.bind(function() {
        console.log("UPDATING ATTRIBUTES", attributes);
        _.each(attributes, function(value, key) {
          this.attr(key, value);
        }, this);
        this.save(callback);
      }, this));
    },

    save: function(callback) {
      messages.storeMessage(this.attributes, function(errors, attrs) {
        var message = new models.Message(attrs);
        if(errors) {
          console.log("error saving message: ", errors);
        } else {
          console.log("Message saved: ", message.id, message.attributes);
        }
        if(callback) {
          callback(errors, message);
        }
      });
    },

    // (re-)load all attributes
    loadAll: function(callback) {
      messages.getMessage(this.id, _.bind(function(attrs) {
        console.log("LOADED", this.id, attrs);
        _.extend(this.attributes, attrs);
        callback();
      }, this));
    }

  },{

    get: function(id) {
      return new models.Message(messages.getMessage(id));
    },

    watch: function() {
      if(this.timer) {
        return;
      }

      this.timer = setInterval(
        _.bind(messages.syncNow, messages), syncInterval
      );

      messages.syncNow();
    },

    unwatch: function() {
      if(this.timer) {
        clearInterval(this.timer);
        delete this.timer;
      }
    },

    view: function(indexName, key) {
      var initialIds = messages.index.query(indexName, key);

      return new models.Collection({
        on: function(eventType, callback) {
          messages.index.on(eventType, key, function(event) {
            console.log('ORIGINAL EVENT', event);
            if(event.newValue && typeof(event.newValue) == 'object') {
              event.newValue = new models.Message(event.newValue);
            }
            if(event.oldValue && typeof(event.oldValue) == 'object') {
              event.oldValue = new models.Message(event.oldValue);
            }
            callback(event);
          });
        },

        list: function() {
          console.log('LIST', this.items);

          if(! this.items) {
            this.load(initialIds);
          }

          return this.items;
        },

        load: function(ids) {
          this.items = _.map(ids, function(id) {
            var msg = messages.getMessage(id);
            console.log('GET MESSAGE', id, msg);
            return new models.Message(msg);
          });
        }
      });
    }
    
  });

});

