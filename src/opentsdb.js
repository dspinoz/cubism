cubism_contextPrototype.opentsdb = function(host,port) {
  if (!arguments.length) {
    host = "";
    port = 4242;
  }
  var source = {},
      context = this;

  source.metric = function(expression) {
    return context.metric(function(start, stop, step, callback) {
      d3.json(host + "/api/query"
          //+ "?expression=" + encodeURIComponent(expression)
          + "&start=" + cubism_cubeFormatDate(start)
          + "&stop=" + cubism_cubeFormatDate(stop)
          //+ "&step=" + step
        , function(data) {
          if (!data) return callback(new Error("unable to load data"));
          callback(null, data.map(function(d) { return d.value; }));
        });
    }, expression += "");
  };

  // Returns the OpenTSDB server
  source.toString = function() {
    return host + ":" + port;
  };

  return source;
};
