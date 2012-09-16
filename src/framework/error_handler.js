
/** errorHandler - display global errors in the DOM
 **
 **/
define(['framework/renderer', 'lib/underscore'], function(renderer) {

  return {
    setup: function() {
      this.setupElement();
      this.setupEvents();
    },

    setupElement: function() {
      this.div = document.createElement('div');
      this.div.setAttribute('style', 'white-space:pre;font-family:monospace;color:red;');
      this.div.setAttribute('id', 'exceptions');
      renderer.registerStatic(this.div);
    },

    setupEvents: function() {
      window.onerror = _.bind(function(message, file, line) {
        this.appendError(message, file, line);
      }, this);
    },

    appendError: function(message, file, line) {
      var div = document.createElement('div');
      div.innerHTML = file + ':' + line + ' : ' + message;
      this.div.appendChild(div);
      this.renderIfNeeded();
    },

    renderIfNeeded: function() {
      if(! this.div.parentNode) {
        document.body.appendChild(this.div);
      }
    }
  };

});