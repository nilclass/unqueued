
define(['framework/views/base', 'lib/underscore'], function(views) {

  // high level input element (i.e. wrapper w/ label + input element)
  // (a bit like formtastic, so most stylesheets that work with that should work
  //  with this)
  views.extend('Input', 'Div', function(label, name, type) {
    views.Div.apply(this, ['input ' + type]);

    var inputId = "input-" + name;

    if(label) {
      this.append(new views.Label(label, inputId));
    }

    this.name = name;
    this.type = type;

    var input = this.createInputField().attr('id', inputId);

    this.append(input);

    input.on('blur', _.bind(function(event) {
      console.log('BLUR', this);
      this.form.updateAttribute(this.name, input.getValue());
    }, this));

  }, {

    bind: function(form) {
      this.form = form;
      return this;
    },

    createInputField: function() {
      return new views.InputField(this.name, this.type || 'text');
    }
  });

  views.extend('TextArea', 'Input', function(name) {
    views.Input.apply(this, [null, name, null]);
  }, {
    createInputField: function() {
      return new views.TextAreaField(this.name);
    }
  });

  views.extend('SelectInput', 'Input', function(prompt, name, options) {
    this.options = options;
    this.prompt = prompt;

    views.Input.apply(this, [null, name, 'select']);
  }, {
    createInputField: function() {
      return new views.Select(this.name, this.options, this.prompt);
    }
  });

  views.extend('Form', 'Element', function(model) {
    views.Element.apply(this, ['form']);
    this.model = model;
  }, {

    labels: {},
    contextStack: [],
    commandCbs: {},

    updateAttribute: function(key, value) {
      console.log('updateAttribute', key, value);
    },

    getInputLabel: function(name) {
      if(name in this.labels) {
        return this.labels[name];
      } else {
        return name.toUpperCase();
      }
    },

    onCommand: function(cmd, callback) {
      if(! callback) {
        throw "No callback given.";
      }
      if(! this.commandCbs[cmd]) {
        this.commandCbs[cmd] = [];
      }
      this.commandCbs[cmd].push(callback);
    },

    getInputName: function(name) {
      var inputName = _.reduce(this.contextStack, function(memo, key, i) {
        return (i == 0) ? key : (memo + '[' + key + ']');
      }, '');
      inputName = inputName.length > 0 ? inputName + '[' + name + ']' : name;
      return inputName;
    },

    addInput: function(name, type) {
      console.log('FORM INPUT', arguments);
      name = this.getInputName(name);
      this.append(new views.Input(this.getInputLabel(name), name, type).bind(this));
    },

    addSelect: function(name, options) {
      console.log('FORM SELECT', arguments);
      name = this.getInputName(name);
      this.append(new views.SelectInput(this.getInputLabel(name), name, options).bind(this));
    },

    addTextArea: function(name) {
      name = this.getInputName(name);
      this.append(new views.TextArea(name).bind(this));
    },

    addGroup: function(name, builder) {
      var wrapper = new views.Element('fieldset', { 'class': 'input-group ' + name, 'data-name': name });
      this.append(wrapper);
      this.contextStack.push(name);
      this.renderContextStack.push(wrapper.root);
      this.append(new views.Label(this.getInputLabel(name)));
      console.log('FORM GROUP BEGIN', name);
      builder.apply(this);
      console.log('FORM GROUP END', name);
      this.renderContextStack.pop();
      this.contextStack.pop();
    },

    addButtons: function() {
      var group = new views.Div('button-group');

      this.append(group);
      this.renderContextStack.push(group.root);
      
      for(var i=0;i<arguments.length;i++) {
        this.addButton(arguments[i], group);
      }

      this.renderContextStack.pop();
    },

    addButton: function(name, parent) {
      this.append(
        new views.Button(this.getInputLabel(name), _.bind(function(event) {
          event.preventDefault();
          this.triggerCommand(name);
          return false;
        }, this))
      );
    },

    triggerCommand: function(command) {
      _.each(this.commandCbs[command], function(cb) {
        cb();
      }, this);
    }

  });

  return views;

});
