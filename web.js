/*jshint node:true*/
var PAGE_TIMEOUT = 8000,
    SCRAPE_DELAY = 2000;

var request = require("request"),
    express = require("express"),
    geo = require("./geo"),
    app = express(),
    server = require('http').createServer(app).listen(process.env.PORT || 5000),
    io = require("socket.io").listen(server,{'log level':2}),
    counter = 0,
    last= {busses:[]};

var emit;


var url = 'http://www.straeto.is/bitar/bus/livemap/json.jsp?routes=1%2C2%2C3%2C4%2C5%2C6%2C11%2C12%2C13%2C14%2C15%2C17%2C18%2C19%2C21%2C23%2C24%2C26%2C28%2C31%2C35%2C43%2C44%2C51%2C52%2C56%2C57%2C58%2C73%2C74%2C75%2C78%2C79%2CR2%2CR3';

var last_updated;

function scrape() {
  var data;
  console.log("submit request");
  var req = request(url,function(err,res,body) {
    if (err) return io.sockets.emit('error','Error opening source');
    try { data = JSON.parse(body); } catch(e) { return io.sockets.emit('error','Error parsing JSON'); }
    var record = {};
    var busses = [];

    if (last_updated && last_updated == data.last_updated) return;
    Object.keys(data.routes).forEach(function(route) {
      route = data.routes[route];
      if (route.busses) route.busses.forEach(function(bus) {
        if (!bus) return;
        bus.pos = geo.isn2wgs(bus.X,bus.Y);
        bus.TIME = new Date(bus.TIMESTAMPREAL);
        var key = bus.BUSNR+"#"+bus.FROMSTOP+"#"+bus.TOSTOP;
        record[key] = record[key]  || [];
        var lastDist = 1;
        if (last && last[key]) last[key].forEach(function(d) {
          var distance = geo.distance(bus.pos,d.pos);
          if (distance < lastDist) {
            bus.id = d.id;
            if (bus.TIMESTAMPREAL !== d.TIMESTAMPREAL) {
              bus.distance = distance;
              bus.prev = d.pos;
              bus.speed = (bus.distance / ((bus.TIME - d.TIME) / 3600000)) || 0;
              bus.prevspeed = d.speed;
              bus.updated = true;
            } else {
              bus.distance = d.distance;
              bus.prev = d.prev;
              bus.speed = d.speed;
              bus.prevspeed = d.prevspeed;
              bus.updated = false;
            }
            lastDist = distance;
          }
        });
        bus.id = bus.id || (counter+=1);
        record[key].push(bus);
        busses.push(bus);
      });
    });
    console.log("emit");
    emit = {last_updated:data.last_updated,busses:busses};
    io.sockets.emit('update',emit);
    last_updated = data.last_updated;
    last = record;
  });

  var timeOut = setTimeout(function() {
    req.end();
    console.log("Closed (timeout)");
  },PAGE_TIMEOUT);

  req.on("end",function() {
    console.log("ended");
    clearTimeout(timeOut);
    setTimeout(scrape,SCRAPE_DELAY);
  });
}

io.sockets.on("connection", function(socket) {
  socket.emit('update',emit);
});

scrape();

app.use("/",express.static("html/", {maxAge: 0}));
