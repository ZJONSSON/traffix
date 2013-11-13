var tileUrl = 'https://{s}.tiles.mapbox.com/v3/zjonsson.map-6qn6dl9t/{z}/{x}/{y}.png',
    map = L.map('map').setView([64.138, -21.90], 14),
    layer = new L.TileLayer(tileUrl).addTo(map),
    busses = [];

map.attributionControl.setPrefix('(C) 2013 <a href="http://github.com/zjonsson">Ziggy Jonsson</a> - Realtime data parsed: <a href="http://www.straeto.is/rauntimakort/">Strætó bs</a> - Map tiles by <a href="http://mapbox.com/about/maps/">Mapbox</a>  - Powered by <a href="http://nodejs.org">Node.js</a>, <a href="http://socket.io">socket.io</a>, <a href="http://www.leafletjs.com">Leaflet</A> and <a href="http://www.d3js.org">d3</a>');

// Initialise the <g> inside the map
map._initPathRoot();
var g = d3.select("body")
  .select("svg")
  .append("g");

// Insert marker definitions for arrowheads (both plain and white background)
g.append("defs")
  .selectAll("marker")
    .data(['arrow','arrow_white'])
  .enter()
    .append('marker')
    .attr({
      id : Object,
      viewBox : '0 0 10 10',
      refX : 0,
      refY : 5,
      markerUnits: 'strokeWidth',
      markerWidth : 4,
      markerHeight : 3,
      orient : 'auto'
    })
    .append("path")
    .attr("d","M 0 0 L 10 5 L 0 10 z");


// Connect to the websockets server and redirect any updates to redraw
var socket = io.connect();
socket.on('update', function (data) {
  busses = data.busses;
  redraw(4000);
});

// Std repositioning from Lat/Lng to pixel points
function reposition(d) {
   var point = map.latLngToLayerPoint(d.pos);
      return "translate("+point.x+","+point.y+")";
}

function redraw(duration) {
  // Select all busses and update new data on the primary key (d.id)
  g.selectAll(".bus").data(busses,function(d) { return d.id;})
    .call(function(d) {
      var enter =  d.enter()
        .append("g")
        .attr("class","bus")
        .attr("transform",reposition);

      enter.append("line").attr("class","whiteline");
      enter.append("line").attr("class","blackline");

      enter.append("circle")
        .attr("r",12)
        .style("stroke","black");

      enter.append("text")
      .classed("label",true)
      .attr("transform","translate(0,+5)").text(function(d) { return Math.round(d.speed || 0);});
      d.exit().remove();
    })
    .each(function(d) {
      var i = d3.interpolate(+d.prevspeed|| 0,+d.speed || 0),
          dx = 0,
          dy = 0;

      // If we have prior location and speed we calculate the vector
      if (d.prev && d.speed) {
        var point = map.latLngToLayerPoint(d.pos);
        var prev = map.latLngToLayerPoint(d.prev);
        dx = point.x - prev.x;
        dy = point.y - prev.y;
        var l = (12+d.speed/2)/Math.sqrt(dx*dx+dy*dy);
        dy = dy * l || 0;
        dx=  dx * l || 0;
      }

      var self = d3.select(this)
        // Update color based on updated
        .style("fill",d.updated ? "red" : "gray")
        .transition()
        .duration(duration/2.5);

      self.selectAll("line")
        .attr({x2:dx,y2:dy});

      if (d.updated && duration) self.select("text")
        .tween("text",function() {
          return function(t) {
            this.textContent = Math.round(i(t));
          };
        });
    })
    .transition()
      .ease("linear")
      .duration(duration)
      .attr("transform",reposition);
}

map.on("zoomend",redraw);