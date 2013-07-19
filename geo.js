module.exports.isn2wgs = function(x,y) {
  var k=0,o=0,m=Math.pow(Math.sqrt((x-=500000)*x+Math.pow(2982044.27322585-(y-=500000),2))/11616778.382033,1.10334624954392);
    while(o-(o=1.5707963267949-2*Math.atan(m*Math.pow(((1-k)/(1+k)),0.04090959566525))) < -0.000001)
      k=0.0818191913305*Math.sin(o);

  return {
    lng : Math.round(((((Math.atan(x/(2982044.27322585-y)))*57.2957795130823)/0.90633380084752)-19)*1000000)/1000000,
    lat : Math.round((o*57.2957795130823)*1000000)/1000000
  };
};

module.exports.distance = function(start,end) {
  var dLat = Math.abs(end.lat - start.lat) * Math.PI/180;
  var dlng = Math.abs(end.lng - start.lng) * Math.PI/180;
  var lat1 = end.lat * Math.PI/180;
  var lng1 = end.lng * Math.PI/180;
  var lat2 = start.lat * Math.PI/180;
  var lng2 = start.lng * Math.PI/180;

  var d1 = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dlng/2) * Math.sin(dlng/2) * Math.cos(lat1) * Math.cos(lat2);
  return (2 * Math.atan2(Math.sqrt(d1), Math.sqrt(1-d1))) * 6371;
};

