define(['lib/underscore'], function() {

  function parseUrl(url) {
    var md = url.match(/^(https?):\/\/([^\/]+)(\/[^?]*)(?:\?(.*)|)$/)
    return {
      scheme: md[1],
      hostAndPort: md[2],
      path: md[3],
      query: md[4] || ''
    }
  }

  var Request = function(url) {
    var uri = parseUrl(url);
    this.uri = uri;
    this.path = uri.path;
    var params = this.params = {};

    if(uri.query) {
      var parts = uri.query.split('&');
      parts.forEach(function(p) {
        var kv = p.split('=');
        params[ kv[0] ] = decodeURIComponent(kv[1]);
      });
    }
  }

  Request.prototype = {
    addParams: function(params) {
      _.extend(this.params, params);
    }
  }

  return Request;

});
