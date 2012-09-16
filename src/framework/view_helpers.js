
define(['framework/router', 'framework/views'], function(router, views) {

  var helpers = {
    view: function(id) {
      return '<div id="' + id + '"></div>';
    },
    startForm: function(path) {
      return '<form onsubmit="try{router.jumpSubmit(\'' + path + '\', this);}catch(exc){console.error(exc)};return false;">';
    },
    endForm: '</form>',

    input: function(label, name, type) {
      return (new views.Input(label, name, type)).render().outerHTML;
    }
  };

  return helpers;

});
