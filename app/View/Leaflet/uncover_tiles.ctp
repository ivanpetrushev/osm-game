<html>
    <head>
        <meta charset=utf-8 />
        <title>Create layers using HTML5 canvas</title>
        <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
        <script src='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.js'></script>
        <script src='/assets/js/jquery-2.2.0.min.js'></script>
        
        <link href='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.css' rel='stylesheet' />
        <style>
            body { margin:0; padding:0; }
            #ctMap { position:absolute; top:0; bottom:0; width:100%; }
        </style>
    </head>
    <body>
        <img id="fillPattern" src="/assets/images/tile-texture-256.jpg" style="display: none" />
        <div id='ctMap'></div>
        <script>
            L.mapbox.accessToken = 'pk.eyJ1IjoiaXZhbmF0b3JhIiwiYSI6ImNpazd1dmFpbjAwMDF3MW04MjFlMXJ6czMifQ.jeVzm6JIjhsdc5MRhUsd8w';
            
            var oTileJson = {
                tiles: [
                    'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
                minzoom: 0,
                maxzoom: 18
            };
            
//            oTileJson = 'mapbox.streets';
            var map = L.mapbox.map('ctMap', oTileJson, {
                zoomControl: false
            });
            map.setView([42.1445, 24.74412], 17);
            
            var aTestMarkers = [];
            
            /*
            // Disable drag and zoom handlers.
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.keyboard.disable();

            // Disable tap handler, if present.
            if (map.tap) map.tap.disable();
            //*/
            

        // Since it's using the HTML5 Canvas API, it is not
        // compatible with IE8 and below. See full documentation:
        // https://www.mapbox.com/mapbox.js/api/v2.2.4/l-tilelayer-canvas/
            var canvasTiles = L.tileLayer.canvas();

            canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
//                console.log('canvas', canvas)
                var tileSize = this.options.tileSize;
                var ctx = canvas.getContext('2d');

                // draw fog of war
                var pattern = ctx.createPattern(document.getElementById('fillPattern'), 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, tileSize, tileSize);
                
//                var oCoords = map.layerPointToLatLng(tilePoint); // wrong ?
                var oCoords = {
                    lat: tile2lat(tilePoint.y, zoom),
                    lng: tile2long(tilePoint.x, zoom),
                }
//                L.marker(oCoords).addTo(map);
                $(canvas).attr('data-lat', oCoords.lat);
                $(canvas).attr('data-lng', oCoords.lng);
                $(canvas).attr('data-tile-x', tilePoint.x);
                $(canvas).attr('data-tile-y', tilePoint.y);
                $(canvas).attr('data-tile-zoom', zoom);
                $(canvas).attr('id', 'tile-'+ Math.round(Math.random() * 100000000))
                
                $(canvas).attr('data-clear-x', 0)
                $(canvas).attr('data-clear-y', 0)
        
        /*
                setInterval(function(){
                    var x = parseInt($(canvas).attr('data-clear-x'));
                    var y = parseInt($(canvas).attr('data-clear-x'));
                    $(canvas).attr('data-clear-x', x+10);
                    $(canvas).attr('data-clear-y', y+10);
                    
                    var context = ctx;
                    context.save();
                    context.globalCompositeOperation = 'destination-out';
                    context.beginPath();
                    context.arc(x, y, 50, 0, 2 * Math.PI, false);
                    context.fill();
                    context.restore();
                }, 300)
                */
                
//                console.log(tilePoint, map.layerPointToLatLng(tilePoint))
            };

            canvasTiles.addTo(map);
            
            var mPlayer = L.marker([42.1445, 24.74412]).addTo(map);
            uncoverFOW();
            
            $(document).ready(function(){
                $(document).keydown(function(e){
//                    console.log('keydown', e)
                    if (e.keyCode == 37) move('left');
                    if (e.keyCode == 38) move('up');
                    if (e.keyCode == 39) move('right');
                    if (e.keyCode == 40) move('down');
                })
            })
            
            function move(dir){
                // move marker
                var angle = 0;
                switch(dir){
                    case 'up': angle = 0; break;
                    case 'right': angle = 90; break;
                    case 'down': angle = 180; break;
                    case 'left': angle = 270; break;
                }
                var oCurrentCoords = mPlayer.getLatLng();
                var oNewCoords = getMoveLatLng(oCurrentCoords.lat, oCurrentCoords.lng, 10, angle);
//                console.log('move', dir, oCurrentCoords, oNewCoords);
                mPlayer.setLatLng(oNewCoords);
                map.panTo(oNewCoords);
                console.log('player', mPlayer);
                
                uncoverFOW();
            }
            
            function getMoveLatLng(lat, lng, d, angle){
                // Earth Radious in meters
                var R = 6378140;

                // Degree to Radian
                var lat_rad = lat * (Math.PI/180);
                var lon_rad = lng * (Math.PI/180);
                var bearing = angle * (Math.PI/180);

                var new_lat_rad = Math.asin(Math.sin(lat_rad)*Math.cos(d/R) + Math.cos(lat_rad)*Math.sin(d/R)*Math.cos(bearing));
                var new_lon_rad = lon_rad + Math.atan2(Math.sin(bearing)*Math.sin(d/R)*Math.cos(lat_rad),Math.cos(d/R)-Math.sin(lat_rad)*Math.sin(new_lat_rad));

                // back to degrees
                var new_lat = new_lat_rad * (180/Math.PI);
                var new_lon = new_lon_rad * (180/Math.PI);

                // 6 decimal for Leaflet and other system compatibility
                new_lat = new_lat.toFixed(6);
                new_lon = new_lon.toFixed(6);

                // Push in array and get back
                return {
                    lat: new_lat,
                    lng: new_lon
                }
            }
            
            function tile2long(x,z) {
                return (x/Math.pow(2,z)*360-180);
            }
            function tile2lat(y,z) {
                var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
                return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
            }
            
            function uncoverFOW(){
                var oNewCoords = mPlayer.getLatLng();
                
                // find which tile are we at
                $('.leaflet-tile').each(function(x){
                    var lat = $(this).attr('data-lat');
                    var lng = $(this).attr('data-lng');
                    var tile_x = parseInt($(this).attr('data-tile-x'));
                    var tile_y = parseInt($(this).attr('data-tile-y'));
                    var tile_zoom = parseInt($(this).attr('data-tile-zoom'));
                    var tile_id = $(this).attr('id');
                    
                    if (typeof lat == 'undefined' || typeof lng == 'undefined') return;
                    
                    var top_lat = tile2lat(tile_y, tile_zoom);
                    var top_lng = tile2long(tile_x, tile_zoom);
                    var bottom_lat = tile2lat(tile_y+1, tile_zoom); 
                    var bottom_lng = tile2long(tile_x+1, tile_zoom);
//                    console.log(top_lat, bottom_lat, ' vs ', top_lng, bottom_lng, tile_zoom)
//                    console.log('this', top_lng, 'east', bottom_lng, ' coords lng', parseFloat(oNewCoords.lng))

                    if (top_lat > parseFloat(oNewCoords.lat) && parseFloat(oNewCoords.lat) > bottom_lat){
                        if (top_lng < parseFloat(oNewCoords.lng) && parseFloat(oNewCoords.lng) < bottom_lng){
//                            console.log('possible found? ', tile_id)

                            for (var i in aTestMarkers){
                                map.removeLayer(aTestMarkers[i]);
                            }
                            var xx = L.marker([top_lat, top_lng]).addTo(map); // debug
                            aTestMarkers.push(xx);
                            
                            var x = map.project(oNewCoords, tile_zoom)
//                            console.log('prkiect? ', x, tile_x, tile_y)
                            var offsetTile = $('#'+tile_id).offset();
                            var offsetPlayer = $(mPlayer._icon).offset();
//                            console.log('offsetTile', offsetTile, 'offsetPlayer',  offsetPlayer)
                            
                            var iLocalX = offsetPlayer.left - offsetTile.left;
                            var iLocalY = offsetPlayer.top - offsetTile.top;
//                            console.log('local x', iLocalX, 'local y', iLocalY)
                            
                            var context = document.getElementById(tile_id).getContext('2d');
                            context.save();
                            context.globalCompositeOperation = 'destination-out';
                            context.beginPath();
                            var iRadius = 500; // 50
                            context.arc(iLocalX, iLocalY, iRadius, 0, 2 * Math.PI, false);
                            context.fill();
                            context.restore();
                        }
                    }
                });
            }
        </script>
    </body>
</html>