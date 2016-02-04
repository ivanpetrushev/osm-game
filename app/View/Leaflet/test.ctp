<html>
    <head>
        <meta charset=utf-8 />
        <title>Create layers using HTML5 canvas</title>
        <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
        <script src='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.js'></script>
        <script src='https://code.jquery.com/jquery-2.2.0.min.js'></script>
        
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
            map.setView([42.3619, -71.0606], 17);
            
            //*
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

                // add fog - possibly use http://projects.calebevans.me/jcanvas/docs/addLayers/ 
                var cFog = document.createElement('canvas');
                cFog.width = tileSize;
                cFog.height = tileSize;
                cFog.style.top = canvas.style.top;
                cFog.style.left = canvas.style.left;
                cFog.class = "leaflet-tile leaflet-tile-loaded fog";
                
                var ctxFog = cFog.getContext('2d');
                // add fog of war
                var pattern = ctxFog.createPattern(document.getElementById('fillPattern'), 'repeat');
                ctxFog.rect(0, 0, tileSize, tileSize);
                ctxFog.fillStyle = pattern;
                ctxFog.fill();
                
                
                // draw something on base layer
                var ctx = canvas.getContext('2d');
                // add debug text
                ctx.fillText(tilePoint.toString(), 50, 50);
                
                // add sample borders
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = '#000';
                ctx.fillRect(10, 10, 246, 246);
                
                // add test rect
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#f00';
                ctx.fillRect(10, 15, 10, 15);
                
                var oCoords = map.layerPointToLatLng(tilePoint);
                $(canvas).attr('data-lat', oCoords.lat);
                $(canvas).attr('data-lng', oCoords.lng);
                $(canvas).attr('data-zoom', zoom);
                $(canvas).attr('id', 'tile-'+ Math.round(Math.random() * 100000000))
                
//                console.log(tilePoint, map.layerPointToLatLng(tilePoint))
            };

            canvasTiles.addTo(map);
            
            var mPlayer = L.marker([42.3619, -71.0606]).addTo(map);
            
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
        </script>
    </body>
</html>