
define(['framework/controller', 'models/message', 'views/messages'], function(Controller, Message, views) {

  return new Controller('inbox', {

    layout: 'root',

    actions: {

      index: function() {

        this.onCleanup(function() {
          Message.unwatch();
        });

        Message.watch();

        this.render('index', {
          views: {
            messages: new views.SortedInbox(
              { label: "Unread", collection: Message.view('read', false) },
              { label: "Read", collection: Message.view('read', true) },
              { label: "Drafts", collection: Message.view('draft', true) }
            )
          }
        });
      },

      compose: function(req) {
        var id = req.params['*'] && req.params['*'][0];

        var message = id ? Message.get(id) : new Message();

        this.render('compose', {
          views: {
            compose: new views.MessageComposer(message, _.bind(function() {
              // close callback
              this.jump('');
            }, this))
          }
        });

      },

      show: function(req) {
        var id = req.params['*'][0];

        if(id && id.length > 0) {

          var message = Message.get(id);

          message.markRead();

          this.render('show', {
            views: {
              full: new views.FullMessage(message)
            }
          });
        } else {
          this.jump('');
        }
      }

    }

  });

});

