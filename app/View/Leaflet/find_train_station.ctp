<html>
    <head>
        <meta charset=utf-8 />
        <title>Find nearest train station</title>
        <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
        <script src='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.js'></script>
        <script src='/assets/js/jquery-2.2.0.min.js'></script>
        <script src='/assets/js/functions.js'></script>
        
        <link href='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.css' rel='stylesheet' />
        <style>
            body { margin:0; padding:0; }
            #ctMap { position:absolute; top:0; bottom:0; width:100%; }
            #infoPanel {
                position: absolute;
                padding: 5px;
                border: 1px solid black;
                background-color: rgba(255, 255, 255, 0.8);
                top: 10px;
                left: 0;
                right: 0;
                margin-left: auto;
                margin-right: auto;
                width: 500px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <img id="fillPattern" src="/assets/images/tile-texture-256.jpg" style="display: none" />
        <div id='ctMap'></div>
        <div id='infoPanel'></div>
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
            
            var map = L.mapbox.map('ctMap', oTileJson, {
                zoomControl: false
            });
            //map.setView([42.1445, 24.74412], 17);
            
            // Disable drag and zoom handlers.
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.keyboard.disable();

            // Disable tap handler, if present.
            if (map.tap) map.tap.disable();
            
            // add player and ability to move it
            var mPlayer = L.marker();
            $(document).ready(function(){
                $(document).keydown(function(e){
                    if (e.keyCode == 37) move('left');
                    if (e.keyCode == 38) move('up');
                    if (e.keyCode == 39) move('right');
                    if (e.keyCode == 40) move('down');
                })
            })
            
            var aTargetLocations = [];
            
            // init game
            $.ajax({
                url: '/leaflet/get_random_city',
                dataType: 'json',
                success: function(res){
                    if (res.success){
                        var lat = parseFloat(res.data.lat);
                        var lng = parseFloat(res.data.lon);
                        map.setView([lat, lng], 17);
                        mPlayer.setLatLng([lat, lng]).addTo(map);
                        $('#infoPanel').html('Welcome to '+res.data.name+', population: '+res.data.population +'. Find nearest train station!').fadeIn();
                        fetch_targets();
                    }
                }
            })
            
            function fetch_targets(){
                var oStartLatLng = mPlayer.getLatLng();
                var sQuery = '[out:json][timeout:25];'+
                            '('+
                              'node["railway"~"station|halt"](around: 10000, '+oStartLatLng.lat+', '+oStartLatLng.lng+' ); '+
                            ');'+
                            'out body;'
                console.log('fire', sQuery)
                $.ajax({
                    url: 'https://www.overpass-api.de/api/interpreter?data='+sQuery,
                    dataType: 'json',
                    crossDomain: true,
                    success: function(res){
                        console.log('got', res)
                        if (res.elements.length > 0){
                            $('#infoPanel').append('<br /> '+res.elements.length+ ' targets around! <br /><span id="distance"></span>');
                            for(var i in res.elements){
                                var oTarget = res.elements[i];
                                aTargetLocations.push(oTarget);
                                var icon = L.icon({
                                    iconUrl: '/img/icons/16x16/add_green.png'
                                })
                                L.marker([oTarget.lat, oTarget.lon], {icon: icon}).addTo(map);
                                L.circle([oTarget.lat, oTarget.lon], 100).addTo(map);
                            }
                        }
                        else {
                            $('#infoPanel').append('<br /> No targets around! Automatically restarting...');
                            setTimeout(function(){
                                window.location.reload(true);
                            }, 3000)
                            
                        }
                    }
                })
            }
            
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
                mPlayer.setLatLng(oNewCoords);
                map.panTo(oNewCoords);
                
                // calculate distance and anounce nearest
                for (var i in aTargetLocations){
                    var loc = aTargetLocations[i];
                    aTargetLocations[i].distance = mPlayer.getLatLng().distanceTo([loc.lat, loc.lon]);
                }
                
                var oNearest = aTargetLocations[0];
                for (var i = 1; i < aTargetLocations.length; i++){
                    if (aTargetLocations[i].distance < oNearest.distance){
                        oNearest = aTargetLocations[i];
                    }
                }
                $('#distance').html('Distance: '+Math.round(oNearest.distance));
                
                if (oNearest.distance < 100){
                    alert('You win!')
                }
            }
        </script>
    </body>
</html>