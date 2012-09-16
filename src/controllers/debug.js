
define(['framework/controller', 'views/debug'], function(Controller, views) {

  return new Controller('debug', {

    layout: 'root',

    actions: {

      index: function() {

        var actions = new views.DebugActions();
        var tree = new views.DataTree();
        var details = new views.NodeData();

        tree.onItemClick(function(item) {
          details.setNode(item);
        });

        actions.onCommand('changed', function() {
          tree.reload();
        });
        
        this.render('index', {
          views: {
            actions: actions,
            messages_tree: tree,
            details: details
          }
        });
      }

    }

  });

});