<html>
    <head>
        <meta charset=utf-8 />
        <title>Buildings</title>
        <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
        <script src='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.js'></script>
        <script src='/assets/js/Leaflet.MakiMarkers.js'></script>
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
            map.on('click', add_enemy)
            
            var oIconGreen = L.MakiMarkers.icon({
                icon: "rocket",
                color: "#0b0",
                size: "m"
            });
            var oIconRed = L.MakiMarkers.icon({
                icon: "rocket",
                color: "#f00",
                size: "m"
            });
            
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
            var aEnemies = [];
            
            var aBuildingWayElements = [];
            var aBuildingNodeElements = [];
            
            // init game
            $.ajax({
                url: '/leaflet/get_random_city',
                dataType: 'json',
                success: function(res){
                    if (res.success){
                        var lat = parseFloat(res.data.lat);
                        var lng = parseFloat(res.data.lon);
                        
                        lat = 42.14154;
                        lng = 24.74980;
                        
                        map.setView([lat, lng], 17);
                        mPlayer.setLatLng([lat, lng]).addTo(map);
                        $('#infoPanel').html('Welcome to '+res.data.name+', population: '+res.data.population +'. Find nearest train station!').fadeIn();
                        fetch_buildings();
                    }
                }
            })
            
            function fetch_buildings(){
                var oStartLatLng = mPlayer.getLatLng();
                var sQuery = '[out:json][timeout:25];'+
                            '('+
                              'way["building"](around: 1000, '+oStartLatLng.lat+', '+oStartLatLng.lng+' ); '+
                            ');'+
                            'out body;'+
                            '>;'+
                            'out skel qt;'
                $.ajax({
                    url: 'https://www.overpass-api.de/api/interpreter?data='+sQuery,
                    dataType: 'json',
                    crossDomain: true,
                    success: function(res){
                        for (var i in res.elements){
                            var el = res.elements[i];
                            var id = el.id;
                            if (el.type == 'way') aBuildingWayElements[id] = el;
                            else if (el.type == 'node') aBuildingNodeElements[id] = el;
                        }
                        
                        for (var i in aBuildingWayElements){
                            var iWayId = aBuildingWayElements[i].id;
                            var oFeature = {
                                type: 'Feature',
                                properties: {
                                    
                                },
                                geometry: {
                                    type: 'Polygon',
                                    coordinates: [[]]
                                }
                            }
                            
                            for (var j in aBuildingWayElements[i].nodes){
                                var iNodeId = aBuildingWayElements[i].nodes[j];
                                if (typeof aBuildingNodeElements[iNodeId] != 'undefined'){
                                    aBuildingWayElements[i].nodes[j] = aBuildingNodeElements[iNodeId];
                                    var lat = parseFloat(aBuildingNodeElements[iNodeId].lat);
                                    var lon = parseFloat(aBuildingNodeElements[iNodeId].lon);
                                    oFeature.geometry.coordinates[0].push([lon, lat])
                                }
                            }
                            
                            var style = {
                                color: '#f00',
                                weight: 1,
                                opacity: 0.1
                            }
                            L.geoJson(oFeature, style).addTo(map);
                        }
                    }
                })
            }
            
            function move(dir){
                // move marker
                var angle = 0;
                switch(dir){
                    case 'up': iAngle = 0; break;
                    case 'right': iAngle = 90; break;
                    case 'down': iAngle = 180; break;
                    case 'left': iAngle = 270; break;
                }
                var oCurrentCoords = mPlayer.getLatLng();
                var oNewCoords = getMoveLatLng(oCurrentCoords.lat, oCurrentCoords.lng, 10, iAngle);
                mPlayer.setLatLng(oNewCoords);
                map.panTo(oNewCoords);
                
                // check all enemies visibilities
                for (var i in aEnemies){
                    if (can_see_player(aEnemies[i])){
                        aEnemies[i].setIcon(oIconRed);
                    }
                    else {
                        aEnemies[i].setIcon(oIconGreen);
                    }
                }
            }
            
            function add_enemy(e){
                var oEnemy = L.marker(e.latlng, {icon: oIconGreen}).addTo(map);
                aEnemies.push(oEnemy);
                can_see_player(oEnemy);
            }
            
            function can_see_player(oEnemy){
                // ray 1: enemy - player
                var lat11 = oEnemy.getLatLng().lat;
                var lon11 = oEnemy.getLatLng().lng;
                var lat12 = mPlayer.getLatLng().lat;
                var lon12 = mPlayer.getLatLng().lng;
                
                // ray 2: each polygon's edge - if any of ray2 intersects ray1 - immediately return 
                for (var i in aBuildingWayElements){
                    var oThisBuilding = aBuildingWayElements[i];
                    for (var j = 0; j < oThisBuilding.nodes.length - 1; j++){
                        var oNode1 = oThisBuilding.nodes[j];
                        var oNode2 = oThisBuilding.nodes[j+1];
                        
                        var lat21 = parseFloat(oNode1.lat);
                        var lat22 = parseFloat(oNode2.lat);
                        var lon21 = parseFloat(oNode1.lon);
                        var lon22 = parseFloat(oNode2.lon);
                        
                        if (line_intersects(lat11, lon11, lat12, lon12, lat21, lon21, lat22, lon22)){
                            return true;
                        }
                    }
                }
                return false;
            }
        </script>
    </body>
</html>