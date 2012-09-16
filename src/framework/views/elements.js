
define(['framework/views/base', 'lib/underscore'], function(views) {

  // any element
  views.define('Element', function(tagName, attributes) {
    views.Base.apply(this);
    this.root = document.createElement(tagName);
    _.each(attributes, function(value, key) {
      this.attr(key, value);
    }, this);
    this.renderContextStack = [this.root];
  }, {
    attr: function(key, value) {
      if(value) {
        this.root.setAttribute(key, value);
        return this;
      } else {
        return this.root.getAttribute(key);
      }
    },

    text: function(text) {
      this.root.innerHTML = text;
      return this;
    },

    on: function(eventType, cb) {
      this.root['on' + eventType] = _.bind(cb, this);
    },

    append: function(view) {
      this.renderContext().appendChild(view.render());
    },

    renderContext: function() {
      return _.last(this.renderContextStack);
    },

    render: function() {
      return this.root;
    },

    hide: function() {
      this.root.style.display = 'none';
    },

    show: function() {
      this.root.style.display = 'block';
    },

    remove: function() {
      if(this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }
    }
  });

  /**
   ** BASIC
   **/

  // a div...
  views.extend('Div', 'Element', function(classNames) {
    views.Element.apply(this, ['div', { 'class': classNames }]);
  });

  // a label :)
  views.extend('Label', 'Element', function(text, inputId) {
    views.Element.apply(this, ['label', { 'for' : inputId }]);
    this.text(text);
  });

  // a single input element
  views.extend('InputField', 'Element', function(name, type) {
    this.name = name;
    views.Element.apply(this, ['input', { name: name, type: type }]);
  }, {
    getValue: function() {
      return this.root.value;
    }
  });

  views.extend('CheckboxElement', 'InputField', function(name) {
    views.InputField.apply(this, [name, 'checkbox']);
  }, {
    getChecked: function() {
      return this.root.checked;
    },

    setChecked: function(value) {
      this.root.checked = value;
    }

  });

  views.extend('Select', 'InputField', function(name, options, prompt) {
    this.options = options;
    this.name = name;
    this.prompt = prompt;

    views.Element.apply(this, ['select'], {
      name: name
    });

    this.append(
      new views.Element('option').text(this.prompt || '')
    );

    _.each(this.options, function(label, key) {
      this.append(
        new views.Element('option', { name: key }).text(label)
      )
    }, this);
    
  });

  views.extend('TextAreaField', 'InputField', function(name) {
    this.name = name;

    views.Element.apply(this, ['textarea'], {
      name: name
    });

  });

  views.extend('Button', 'Element', function(label, callback) {
    views.Element.apply(this, ['button']);

    this.text(label);
    this.on('click', callback);

  });

  views.extend('Text', 'Div', function(text, attrs) {
    var klass = (attrs ? attrs['class'] : null) || '';
    views.Div.apply(this, ['formatted-text ' + klass]);
    if(attrs) {
      delete attrs['class'];
    }
    _.each(attrs, function(value, key) {
      this.attr(key, value);
    }, this);
    this.text(text);
  });

  return views;

});
