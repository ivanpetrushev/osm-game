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
var oTileJson = 'mapbox.streets';

var map = L.mapbox.map('ctMap', oTileJson, {
    zoomControl: false
});

// Disable drag and zoom handlers.
map.dragging.disable();
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
map.keyboard.disable();

// Disable tap handler, if present.
if (map.tap) map.tap.disable();

map.on('click', function(e){
    var oDstLatLng = e.latlng;
    var oSrcLatLng = oPlayer.getLatLng();
    var iAngle = bearing(oSrcLatLng.lat, oSrcLatLng.lng, oDstLatLng.lat, oDstLatLng.lng);
    oPlayer.move('dummy', iAngle);
})

// add player and ability to move it
var oPlayer = new Player();

$(document).ready(function(){
    $(document).keydown(function(e){
        if (e.keyCode == 37) oPlayer.move('left');
        if (e.keyCode == 38) oPlayer.move('up');
        if (e.keyCode == 39) oPlayer.move('right');
        if (e.keyCode == 40) oPlayer.move('down');
    })
})

var aTargetLocations = [];
var aEnemies = [];

var tsGameStart = 0;
var bGameRunning = true;

var aBuildings = [];
var aBuildingNodeElements = [];

// init game
// maybe we have preset coordinates in URL?
var oInitParams = {};
var aMatches = window.location.href.match(/pursuit\/(.+?)\/(.+?)$/);
if (aMatches){
    oInitParams.lat = parseFloat(aMatches[1]);
    oInitParams.lon = parseFloat(aMatches[2]);
}

$.ajax({
    url: '/leaflet/get_random_city',
    dataType: 'json',
    data: oInitParams,
    success: function(res){
        if (res.success){
            var lat = parseFloat(res.data.lat);
            var lng = parseFloat(res.data.lon);

            if (typeof oInitParams.lat != 'undefined'){
                lat = oInitParams.lat;
                lng = oInitParams.lon;
            }
            map.setView([lat, lng], 17);
            oPlayer.marker.setLatLng([lat, lng]).addTo(map);
            $('#infoPanel').html('Welcome to '+res.data.name+', population: '+res.data.population +'. Find nearest train station!').fadeIn();
            $('input[name="city_name"]').val(res.data.name);
            //fetch_buildings();
            fetch_targets();

            tsGameStart = new Date().getTime();
        }
    }
})

function fetch_targets(){
    var oStartLatLng = oPlayer.marker.getLatLng();
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
                    aTargetLocations.push(new Target(el));
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
                    aTargetLocations.push(new Target(o));
                }
            }

            if (aTargetLocations.length > 0){
                $('#infoPanel').append('<br /> '+aTargetLocations.length+ ' targets around! <br /><div id="distance"></div><div id="enemies"></div>');

                fetch_buildings();
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

function fetch_buildings(){
    var oStartLatLng = oPlayer.marker.getLatLng();
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
                if (el.type == 'way') aBuildings[id] = new Building(el);
                else if (el.type == 'node') aBuildingNodeElements[id] = el;
            }

            for (var i in aBuildings){
                for (var j in aBuildings[i].nodes){
                    var iNodeId = aBuildings[i].nodes[j];
                    if (typeof aBuildingNodeElements[iNodeId] != 'undefined'){
                        aBuildings[i].nodes[j] = aBuildingNodeElements[iNodeId];
                    }
                }

                aBuildings[i].makeFeature();
            }

            fetch_enemies();
        }
    })
}

function fetch_enemies(){
    var oStartLatLng = oPlayer.marker.getLatLng();
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
                    var oEnemy = L.marker([res.elements[i].lat, res.elements[i].lon], {icon: oIconEnemyRed});
                    oEnemy.addTo(map);
                    aEnemies.push(new Enemy(oEnemy));
                }
            }
            else {
                $('#enemies').html('No enemies around!');
            }

            // game is ready
            $('#splashscreen').animate({width:'toggle'},350);
        }
    })
}


$('#menu .scores').on('click', function(e){
    $('#ctHighscores').slideToggle();
})
$('#menu .howto').on('click', function(e){
    $('#ctHowto').slideToggle();
})