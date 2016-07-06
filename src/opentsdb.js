cubism_contextPrototype.opentsdb = function(host) {
  if (!arguments.length) {
    host = "";
  }
  var source = {},
      context = this;

  function buildExpression(e, step) {
    
    if (e.constructor === String) {
      return e;
    }
    else if (e.constructor !== Object) {
      return undefined;
    }
    
    var out = "";
    out += e.aggregator ? e.aggregator : "sum";
    out += ":";
    // zero fill policy ensures that there is data for all step intervals
    if (e.downsample) {
      out += e.downsample.interval ? e.downsample.interval : step + "ms";
      out += "-";
      out += e.downsample.aggregator ? e.downsample.aggregator : "avg";
      out += "-";
      out += e.downsample.fillpolicy ? e.downsample.fillpolicy : "zero";
    }
    else {
      out += step + "ms-avg-zero";
    }
    out += ":";
    out += e.metric ? e.metric : "metric";
    return out;
  }
      
  source.metric = function(expression, title, dataCallback, fillCallback) {
    
    if (!dataCallback && typeof title === "function") {
      dataCallback = title;
      title = undefined;
    }
  
    var expr = buildExpression(expression, step);
  
    if (!title) title=expr;
    return context.metric(function(start, stop, step, callback) {
      
      d3.json('http://' + host + "/api/query"
        // TODO support millisecond precision
        + "?start=" + (start.valueOf() / 1000) 
        + "&end=" + (stop.valueOf() / 1000)
        + "&m=" + encodeURIComponent(expr), 
          
        function(data) {
          
          if (!data) return callback(new Error("unable to load data"));
          data = d3.entries(data[0].dps);
          
          data.forEach(function(d) { d.key = +d.key; });
          
          // d3.entries returns undefined order
          var sorted = data
            .sort(function(a,b) {
              return d3.ascending(a.key, b.key);
            });
            
          if (fillCallback) {
              
            // interpolate additional data that is "missing"
            var out = d3.range(start.valueOf()/1000, stop.valueOf()/1000, step/1000)
              .map(function(d) { return {key:d, value:fillCallback()}; })
            
            for (var i = 0, j = 0; i < out.length && j < sorted.length; i++) {
              if (out[i].key == sorted[j].key) {
                
                if (dataCallback) {
                  out[i].value = dataCallback(sorted[j]);
                }
                else {
                  out[i].value = sorted[j].value;
                }
                
                out[i]._set = true;
                j++;
              }
            }
            callback(null, out.map(function(d) { return d.value; }));
          }
          else
          {
            callback(null, sorted.map(function(d) { return d.value; }));
          }
        });
    }, title);
  };

  // Returns the OpenTSDB server
  source.toString = function() {
    return host;
  };

  return source;
};
