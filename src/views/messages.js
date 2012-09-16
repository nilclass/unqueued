
define(['framework/views'], function(views) {

  var messageViews = _.extend({}, views);

  messageViews.extend('MessageRow', 'ContainerItem', function(message) {
    views.ContainerItem.apply(this, arguments);

    this.subject = new views.Div('subject')
    this.append(this.subject);

    this.updateData(message);

    this.on('click', _.bind(function() {

      if(message.attr('draft')) {
        this.jump('/inbox/compose/' + message.id);
      } else {
        this.jump('/inbox/show/' + message.id);
      }
    }, this));

  }, {

    updateData: function(message) {
      console.log("UPDATE DATA", message);
      
      this.subject.text(message.attr('subject'));
    },
  });

  messageViews.extend('MessageList', 'Container', function(messages) {
    views.Container.apply(this, arguments);
    this.attr('class', this.attr('class') + ' message-list');
  }, {

    buildItem: function(message) {
      console.log('BUILD ITEM', message);
      return new messageViews.MessageRow(message);
    },

    getIdentifier: function(message) {
      return message.id;
    }

  });

  messageViews.extend('MessageForm', 'Form', function(model) {
    views.Form.apply(this, [model]);

    this.updateAttribute = _.bind(this.model.attr, this.model);

    this.addButtons('send', 'save', 'close');

    this.addInput("from");
    this.addInput("to");
    this.addInput("subject");
    this.addTextArea("body");

    this.addButtons('send', 'save', 'close');

    this.on('submit', function(event) {
      event.preventDefault();
      return false;
    });

    this.updateData(model);

  }, {

    labels: {
      from: "From",
      to: "To",
      subject: "Subject",
      send: "Send",
      close: "Close Editor",
      save: "Save Draft"
    }

  });

  messageViews.extend('MessageComposer', 'Div', function(model, closeCallback) {
    views.Div.apply(this, ['message-composer']);

    this.append(new views.Element('h2').text("Compose"));

    var form = new messageViews.MessageForm(model);

    form.onCommand('send', function() { model.save(); closeCallback(); }); // << CHANGEME!!!
    form.onCommand('save', function() { model.attr('draft', true); model.save(); closeCallback(); });
    form.onCommand('close', closeCallback);

    this.append(form);
  });

  messageViews.extend('MessageActions', 'Form', function(message) {
    views.Form.apply(this, [message]);

    this.addButtons('unread', 'delete');

    this.onCommand('unread', _.bind(function() {
      message.markUnread(_.bind(function() {
        this.jump('/inbox');
      }, this));

    }, this));

    this.onCommand('delete', function() {
      throw "Not implemented!";
    });

  }, {
    
    labels: {
      'unread': "Mark unread",
      'delete': "Delete"
    }

  });

  messageViews.extend('FullMessage', 'Div', function(model) {
    views.Div.apply(this, ['full-message']);

    var body = model.attr('body');

    this.append(new messageViews.MessageActions(model));

    this.append(new views.Text(body['text/plain'], { style: 'font-family:monospace' }));
  });

  messageViews.extend('InboxSection', 'Div', function(section) {
    views.Div.apply(this, ['inbox-section']);

    this.append(new views.Element('h2').text(section.label));
    this.append(new messageViews.MessageList(section.collection));

  });

  messageViews.extend('SortedInbox', 'Div', function() {
    views.Div.apply(this, ['sorted-inbox']);

    _.each(arguments, function(section) {
      this.append(new messageViews.InboxSection(section));
    }, this);

  });

  return messageViews;

});

