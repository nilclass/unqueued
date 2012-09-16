
define(['framework/views', 'remoteStorage-messages', 'lib/underscore'], function(views, messages) {

  var debugViews = _.extend({}, views);

  function basename(path) {
    var parts = path.split('/');
    if(parts[parts.length - 1].length == 0) {
      return parts[parts.length - 2] + '/';
    } else {
      return parts[parts.length - 1];
    }
  }

  function formatJson(json) {
    var preBreak = /(?:[\}\"\]],|^[\{\[]|\:[\{\[])/g, postBreak = /[\}\]]$/g, preSpace = /\"\:/g;

    json = json.replace(preBreak, function(c) { return c + "\n"; }).
      replace(postBreak, function(c) { return "\n" + c; }).
      replace(preSpace, function(c) { return c + " " });
    return _.map(json.split("\n"), function(line) {
      if(line.length >= 128) {
        return line.substr(0, 128) + '...';
      } else {
        return line;
      }
    }).join("\n");
    return json;
  }

  debugViews.extend('DebugActions', 'Form', function() {
    views.Form.apply(this, [null]);

    this.addButtons('rebuild-read', 'rebuild-draft');

    this.onCommand('rebuild-read', _.bind(function() {
      messages.index.rebuild('read');
      this.triggerCommand('changed');
    }, this));

    this.onCommand('rebuild-draft', _.bind(function() {
      messages.index.rebuild('draft');
      this.triggerCommand('changed');
    }, this));

  }, {

    labels: {
      'rebuild-read': 'Rebuild index "read"',
      'rebuild-draft': 'Rebuild index "draft"'
    }

  });

  debugViews.extend('DataTreeNode', 'ContainerItem', function(path) {
    views.ContainerItem.apply(this, arguments);

    this.label = new views.Label();
    this.append(this.label);

    if(path.substr(-1) == '/') {
      this.nodeType = 'directory';
      this.subtree = new debugViews.DataTree(path);
      this.append(this.subtree);

      // let clicks bubble up the tree...
      this.subtree.onItemClick(_.bind(function(item) {
        this.container.triggerItemClick(item)
      }, this));
    } else {
      this.nodeType = 'file';
    }

    this.updateData(path);

  }, {

    updateData: function(path) {
      this.label.text(basename(path));
    }

  });

  debugViews.extend('DataTree', 'Container', function(parentPath) {
    this.parentPath = parentPath || '';
    var keys = messages.debugClient.getListing(this.parentPath);
    // stupid=true denotes that "keys" isn't a models.Collection, but a
    // simple array.
    views.Container.apply(this, [keys, { stupid: true }]);
  }, {

    buildItem: function(key) {
      return new debugViews.DataTreeNode(this.parentPath + key);
    },

    getIdentifier: function(key) {
      return key;
    }

  });

  debugViews.extend('NodeData', 'Text', function() {
    views.Text.apply(this, ['']);

  }, {

    setNode: function(path) {
      this.node = messages.debugClient.getObject(path);
      console.log('setNode', path, this.node);
      this.text(formatJson(JSON.stringify(this.node)));
    }

  });

  

  return debugViews;

});

