
define(['lib/remoteStorage-modules-debug'], function() {

  remoteStorage.defineModule('messages', function(client) {

    client.sync('pool/');

    function parseRawMessage(raw) {
      raw.lines
    }

    function removeRecursively(path) {
      var children = client.getListing(path);
      for(var i=0;i<children.length;i++) {
        if(isDir(children[i])) {
          removeRecursively(path + children[i]);
        } else {
          client.remove(path + children[i]);
        }
      }
    }

    // event filter, which discards events of different type, than `type'.
    function typeFilter(type, callback) {
      return function(event) {
        var obj = event.newValue || event.oldValue;

        console.log("Filtering event", event, "for type", type, "obj", obj, obj['@type']);
      
        if(obj && obj['@type']) {
          var parts = obj['@type'].split('/');
          if(parts[parts.length - 1] == type) {
            callback(event);
          }
        }
      }
    }

    function keyFilter(key, callback) {
      return function(event) {
        var id = event.newValue ? event.newValue.id : event.oldValue.id;
        if(client.getListing(indexKeyPath(key) + "/").indexOf(id)) {
          callback(event);
        }
      }
    }

    var definedIndexes = {};

    function indexPath(name) {
      return "indexes/" + name;
    }

    function rawPath(id) {
      return "raw/" + id;
    }

    function indexKeyPath(name, key) {
      return indexPath(name) + "/" + key;
    }

    function isDir(path) {
      return path.substr(-1) == '/';
    }

    function makeSubject(text) {
      return text.length > 250 ? (text.substr(252) + '...') : text;
    }

    function messagePath(id) {
      return "pool/" + id;
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

    function clearFromIndex(name, object) {
      var root = indexPath(name);
      var keys = client.getListing(root + '/');
      var path = null;
      for(var i=0;i<keys.length;i++) {
        path = root + '/' + keys[i] + object.id;
        if(client.getObject(path)) {
          client.remove(path); 
        }
      }
    }

    var index = {

      // notify on index changes
      on: function(eventType, key, callback) {
        client.on(eventType, typeFilter('index-node', keyFilter(key, callback)));
      },


      // force given indices to be synced locally, so they can be queried quickly.
      use: function() {
        
        for(var i=0;i<arguments.length;i++) {
          client.sync(indexPath(name));
        }

        this.watchPool();

      },

      watchPool: function() {
        var index = this;
        remoteStorage.messages.on('change', function(event) {
          if(event.origin == 'remote') {
            if(event.newValue) {
              index.mapObject(event.newValue);
            } else {
              for(var name in definedIndexes) {
                clearFromIndex(name, event.oldValue);
              }
            }
          }
        });
      },

      // define a new index, with given name & mapper.
      define: function(name, mapper, attributes) {
        if(name in definedIndexes) {
          throw "Index already defined: " + name;
        }
        definedIndexes[name] = mapper;
      },

      query: function(name, key) {
        console.log('QUERY', indexKeyPath(name, key));
        return client.getListing(indexKeyPath(name, key) + '/');
      },

      // run mapper for given object, to update indexes.
      // if name is given, only the mapper for the given index will be run.
      mapObject: function(object, name) {

        function emit(key, value) {
          console.log('EMIT(', key, ', ', value, ')');
          client.storeObject(
            'index-node',
            // such that if:
            //   name = 'foo'
            //   object.id = '123'
            //   emit('bar', 'baz')
            // then:
            //   PUT indexes/foo/bar/123
            //   (...)
            //
            //   baz
            //
            indexKeyPath(name, key) + "/" + object.id,
            value
          );
        }

        if(name) {
          clearFromIndex(name, object);
          definedIndexes[name](object, emit);
          remoteStorage.syncNow('/messages/' + indexPath(name) + '/');
        } else {
          for(name in definedIndexes) {
            this.mapObject(object, name);
          }
        }
      },

      rebuild: function(name) {
        this.clearIndex(name);

        var poolItems = client.getListing('pool/'), object;
        for(var i=0;i<poolItems.length;i++) {
          object = client.getObject(messagePath(poolItems[i]));
          this.mapObject(object, name);
        }
      },

      clearIndex: function(name) {
        removeRecursively(indexPath(name) + '/');
      }

    };

    function buildIndexNode(message) {
      return {
        subject: message.subject,
        from: message.from,
        draft: message.draft,
        read: message.read,
        to: message.to
      };
    }

    index.define('read', function(message, emit) {

      if(! message.draft) {
        var value = buildIndexNode(message);
        if(message.read) {
          emit('true', value);
        } else {
          emit('false', value);
        }
      }
    });

    index.define('draft', function(message, emit) {
      if(message.draft) {
        emit('true', buildIndexNode(message));
      }
    });

    var messages = {

      on: function(eventType, callback) {
        client.on(eventType, typeFilter('message', callback));
      },

      getMessage: function(id, callback) {
        return client.getObject(messagePath(id), callback);
      },

      validateMessage: function(message) {

        var errors = {};

        if(! message.id) {
          message.id = getUuid();
        }

        if(message.draft) {
          return errors;
        }

        function addError(key, message) {
          if(! (key in errors)) {
            errors[key] = [];
          }
          errors[key].push(message);
        }

        function validateAttrPresence() {
          var object = arguments[0], key;

          for(var i=1;i<arguments.length;i++) {
            key = arguments[i];
            if(! object[key]) {
              addError(key, "required");
            }
          }
        }

        validateAttrPresence(message, 'from', 'to', 'body');

        if(message.body && (! message.subject)) {
          message.subject = makeSubject(message.body);
        }

        return errors;
      },

      storeMessage: function(message, callback) {

        var errors = this.validateMessage(message);

        if(Object.keys(errors).length > 0) {
          console.log('validated, errors: ', errors);
        } else {
          console.log('validated, no errors.');
        }

        if(Object.keys(errors).length > 0) {
          return callback(errors, null);
        } else {

          client.storeObject('message', messagePath(message.id), message);

          remoteStorage.syncNow(messagePath(''));

          index.mapObject(message);

          return callback(null, message);
        }

      },

      importAllFromRaw: function() {
        var ids = client.getListing(rawPath(''));
        var messages = [];
        for(var i=0;i<ids.length;i++) {
          messages.push(this.importFromRaw(ids[i]));
        }
        return messages;
      },

      // GET message from raw/,
      // parse it,
      // PUT it in pool/,
      // then DELETE it from raw/.
      importFromRaw: function(id) {
        var message = this.getMessage(id);
        if(message) {
          return message;
        }

        var raw = client.getObject(rawPath(id));

        if(! raw) {
          throw "Raw message not found: " + id;
        }

        message = parseRawMessage(raw);

        message.id = id;

        this.storeMessage(message);

        client.remove(rawPath(id));

        remoteStorage.syncNow(rawPath(''));

        return message;
      },

      syncNow: function() {
        remoteStorage.syncNow('/messages/');
      },

      debugClient: client,

      index: index
    }


    return {

      dataHints: {
        "module"
        : "Implements storage of messages, parsing of raw rfc822 data, indexing of messages",

        "objectType message"
        : "represents a message",

        "string message#subject"
        : "subject of the message (e.g. from 'Subject' header)",

        "string message#from"
        : "sender of the message, a URI or rfc822 'From' header",

        "string message#to"
        : "recipient of the message",

        "object message#body"
        : "A { <contentType> : <data> } map of body parts.",

        "boolean message#read"
        : "If true, message has been read",

        "boolean message#draft"
        : "if true, this message is a draft",

        "objectType index-node"
        : "represents a simplified representation of the message for indexes",

        "string index-node#subject"
        : "same as message#subject",

        "string index-node#from"
        : "same as message#from",

        "directory indexes/"
        : "Contains all the indexes",

        "directory indexes/:name/"
        : "Contains the index with the given :name",

        "directory indexes/:name/:key/"
        : "Contains all messages for which the mapper function of this index yielded :key",

        "item      indexes/:name/:key/:id"
        : "An index-node for the message with the given id. Presence denotes, that the message matches that :key within that index named :name.",

        "directory pool/"
        : "Contains message objects",

        "item      pool/:id"
        : "A message object, with keys: subject, from, to, date, body",

        "directory raw/"
        : "Contains raw rfc822 messages, which haven't been parsed to pool/ yet",

        "item      raw/:id"
        : "A raw message object, with key 'lines'. lines is an Array of lines of the original rfc822 message",

        "index read"
        : "all messages, except drafts, sorted by keys 'true' and 'false'",

        "index draft"
        : "all drafts, only key: 'true'"

      },

      exports: messages
    }
  });



  return remoteStorage.messages;

});

