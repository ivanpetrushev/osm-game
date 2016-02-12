<!DOCTYPE html>
<html>
    <head>
        <meta charset=utf-8 />
        <title>Enemies</title>
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
            #ctScoreboard {
                display: none;
                position: absolute;
                padding: 10px;
                border: 1px solid black;
                background-color: rgba(255, 255, 255, 0.8);
                top: 40vh;
                left: 0;
                right: 0;
                margin-left: auto;
                margin-right: auto;
                width: 300px;
                text-align: center;
            }
            #ctScoreboard input[type=submit] {
                margin: 10px auto;
                width: 100px;
                padding: 5px;
            }
            #ctScoreboard input[type=text] {
                border: none;
                border-bottom: 4px solid red;
                width: 3ch;
                font-size: 2em;
                color: red;
            }
            
            #ctHighscores {
                display: none;
                position: absolute;
                padding: 10px;
                border: 1px solid black;
                background-color: rgba(255, 255, 255, 0.8);
                top: 20vh;
                left: 0;
                right: 0;
                margin-left: auto;
                margin-right: auto;
                width: 500px;
                max-height: 50vh;
                overflow-y: scroll;
                overflow-x: hidden;
            }
            #ctHighscores table {
                width: 100%;
                border-collapse: collapse;
            }
            #ctHighscores table th,
            #ctHighscores table td {
                border: 1px solid black;
                padding: 5px;
            }
            
            #menu {
                display: block;
                position: absolute;
                padding: 10px;
                border: 1px solid black;
                background-color: rgba(255, 255, 255, 0.8);
                top: 10px;
                left: 10px;
                width: 100px;
                z-index: 9;
            }
            #menu li {
                list-style: none;
                cursor: pointer;
                border-left: 2px solid green;
                padding-left: 5px;
            }
            #menu li:hover {
                border-right: 2px solid green;
            }
        </style>
    </head>
    <body>
        <ul id="menu">
            <li class="scores">Scores</li>
        </ul>
        <div id='ctMap'></div>
        <div id='infoPanel'></div>
        <div id="ctScoreboard">
            <h1>You won! </h1>
            <p>Game finished in <span class="time"></span>s.</p>
            <form method="post" action="/score/update" >
                <input type="hidden" name="city_name" />
                <input type="hidden" name="time" />
                <input type="hidden" name="cnt_moves" />
                <input type="hidden" name="cnt_enemies" />
                Player name: <input type="text" name="player_name" required maxlength="3" autocomplete="off"/> <br />
                <input type="submit" />
            </form>
        </div>
        <div id="ctHighscores">
            <table>
                <tr><th>Player</th><th>Time</th><th>City</th></tr>
                <? foreach ($scores as $item):?>
                <tr>
                    <td><?=htmlentities($item['Score']['player_name'], ENT_QUOTES, "UTF-8")?></td>
                    <td><?=htmlentities($item['Score']['time'], ENT_QUOTES, "UTF-8")?></td>
                    <td><?=htmlentities($item['Score']['city_name'], ENT_QUOTES, "UTF-8")?></td>
                </tr>
                <? endforeach; ?>
            </table>
        </div>
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
            var aEnemies = [];
            
            var tsGameStart = 0;
            var bGameRunning = true;
            
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
                        $('input[name="city_name"]').val(res.data.name);
                        fetch_targets();
                        //fetch_enemies();
                        
                        tsGameStart = new Date().getTime();
                    }
                }
            })
            
            function fetch_targets(){
                var oStartLatLng = mPlayer.getLatLng();
                var sQuery = '[out:json][timeout:25];'+
                            '('+
                              'node["railway"~"station|halt"](around: 10000, '+oStartLatLng.lat+', '+oStartLatLng.lng+' ); '+
                              'way["railway"~"station|halt"](around: 10000, '+oStartLatLng.lat+', '+oStartLatLng.lng+' ); '+
                            ');'+
                            '(._;>;);'+
                            'out body;'+
                            '>;'
                $.ajax({
                    url: 'https://www.overpass-api.de/api/interpreter?data='+sQuery,
                    dataType: 'json',
                    crossDomain: true,
                    success: function(res){
                        var aChildNodes = [];
                        for (var i in res.elements){
                            var el = res.elements[i];
                            if (el.type == 'node' && typeof el.tags != 'undefined' && el.tags.railway != 'undefined'){
                                aTargetLocations.push(el);
                            }
                            if (el.type == 'node' && typeof el.tags == 'undefined'){
                                aChildNodes.push(el);
                            }
                        }
                        
                        
                        // scan child nodes for ways
                        for (var i in res.elements){
                            var el = res.elements[i];
                            if (el.type == 'way'){
                                var iCentralLat = 0;
                                var iCentralLon = 0;
                                var iCntNodes = 0;
                                for (var j in el.nodes){
                                    for (var k in aChildNodes){
                                        if (el.nodes[j] == aChildNodes[k].id){
                                            iCentralLat += parseFloat(aChildNodes[k].lat);
                                            iCentralLon += parseFloat(aChildNodes[k].lon);
                                            iCntNodes++;
                                        }
                                    }
                                }
                                
                                iCentralLat /= iCntNodes;
                                iCentralLon /= iCntNodes;
                                
                                var o = {lat: iCentralLat, lon: iCentralLon};
                                aTargetLocations.push(o);
                            }
                        }
                        
                        if (aTargetLocations.length > 0){
                            $('#infoPanel').append('<br /> '+aTargetLocations.length+ ' targets around! <br /><div id="distance"></div><div id="enemies"></div>');
                            for(var i in aTargetLocations){
                                var oTarget = aTargetLocations[i];
                                var icon = L.icon({
                                    iconUrl: '/img/icons/16x16/add_green.png'
                                })
                                L.marker([oTarget.lat, oTarget.lon], {icon: icon}).addTo(map);
                                L.circle([oTarget.lat, oTarget.lon], 100).addTo(map);
                            }
                            
                            fetch_enemies();
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
            
            function fetch_enemies(){
                var oStartLatLng = mPlayer.getLatLng();
                var sQuery = '[out:json][timeout:25];'+
                            '('+
                              'node["shop"](around: 2000, '+oStartLatLng.lat+', '+oStartLatLng.lng+' ); '+
                            ');'+
                            'out 40;' // limit 
                $.ajax({
                    url: 'https://www.overpass-api.de/api/interpreter?data='+sQuery,
                    dataType: 'json',
                    crossDomain: true,
                    success: function(res){
                        if (res.elements.length > 0){
                            $('#enemies').html(res.elements.length + ' enemies found!');
                            for(var i in res.elements){
                                var icon = L.icon({
                                    iconUrl: '/img/icons/16x16/deactivation.png'
                                })
                                var oEnemy = L.marker([res.elements[i].lat, res.elements[i].lon], {icon: icon});
                                oEnemy.addTo(map);
                                aEnemies.push(oEnemy);
                            }
                        }
                        else {
                            $('#enemies').html('No enemies around!');
                        }
                    }
                })
            }
            
            function move(dir){
                if (! bGameRunning) return;
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
                
                if (typeof mPlayer.cnt_moves == 'undefined'){
                    mPlayer.cnt_moves = 0;
                }
                mPlayer.cnt_moves++;
                
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
                    // win
                    bGameRunning = false;
                    
                    var tsGameEnd = new Date().getTime();
                    var iGameDuration = Math.ceil((tsGameEnd - tsGameStart) / 1000 );
                    
                    $('input[name="time"]').val(iGameDuration);
                    $('#ctScoreboard .time').html(iGameDuration);
                    $('input[name="cnt_enemies"]').val(aEnemies.length);
                    $('input[name="cnt_moves"]').val(mPlayer.cnt_moves);
                    $('#ctScoreboard').slideToggle();
                    $('#ctScoreboard input[type=text]').focus();
                }
                
                // move enemies using "Change in LOS rate" algorithm
                var oBounds = map.getBounds();
                for (var i in aEnemies){
                    var oEnemyLatLng = aEnemies[i].getLatLng();
                    if (oBounds.contains(oEnemyLatLng)){
                        // if distance is below 20 consider the player dead
                        var iOldDistance = mPlayer.getLatLng().distanceTo(aEnemies[i].getLatLng());
                        
                        var iAngle = bearing(oEnemyLatLng.lat, oEnemyLatLng.lng, oNewCoords.lat, oNewCoords.lng);
                        var iComputedAngle = iAngle;
                        var iLosDiff = 0;
                        if (typeof aEnemies[i].last_angle == 'undefined'){
                            aEnemies[i].last_angle = iAngle;
                        }
                        
                        iLosDiff = Math.abs(iAngle - aEnemies[i].last_angle);
                        if (iLosDiff > 1 && iOldDistance > 100){ // correct for interception
                            if (iAngle > aEnemies[i].last_angle) {
                                iComputedAngle = iAngle + 20 * iLosDiff;
                            }
                            else {
                                iComputedAngle = iAngle - 20 * iLosDiff;
                            }
                        }
                        aEnemies[i].last_angle = iAngle;
                        
                        var oMoveCoords = getMoveLatLng(oEnemyLatLng.lat, oEnemyLatLng.lng, 8, iComputedAngle);
                        aEnemies[i].setLatLng(oMoveCoords);
                        
                        var iNewDistance = mPlayer.getLatLng().distanceTo(aEnemies[i].getLatLng());
                        if (iNewDistance < 20){
                            alert('You die!');
                        }
                    }
                }
            }
            
            $('#menu .scores').on('click', function(e){
                $('#ctHighscores').slideToggle();
            })
        </script>
    </body>
</html>