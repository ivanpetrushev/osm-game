//L.mapbox.accessToken = 'pk.eyJ1IjoiaXZhbmF0b3JhIiwiYSI6ImNpazd1dmFpbjAwMDF3MW04MjFlMXJ6czMifQ.jeVzm6JIjhsdc5MRhUsd8w';

var aSplashMessages = [];

var oTileJson = {
    tiles: [
        'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    minzoom: 0,
    maxzoom: 18,
    zoomControl: false
};
var oTileJson = 'mapbox.streets';

var map = L.map('ctMap', {
    zoomControl: false
});
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution: '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors | <a target="_blank" href="http://www.openstreetmap.org/fixthemap">Improve this map</a>'
}).addTo(map);


var sCurrentlySelecting = 'from'; // from | to

var aEnemies = [];

map.on('click', function(e){
    var oDstLatLng = e.latlng;
    console.log(oDstLatLng.lat, oDstLatLng.lng)
    
    var oIcon = (sCurrentlySelecting == 'from') ? oIconEnemyGreen : oIconEnemyRed;
    var oEnemy = L.marker([oDstLatLng.lat, oDstLatLng.lng], {icon: oIcon, draggable: true});
    oEnemy.addTo(map);
    var x = new Enemy(oEnemy);
    x.snapToNearestRoad();
    aEnemies.push(x);
    
    $('input[name='+sCurrentlySelecting+']').val(x.snapped_on_node.id);
    if (sCurrentlySelecting == 'from') sCurrentlySelecting = 'to';
    else if (sCurrentlySelecting == 'to') sCurrentlySelecting = 'from';
    
    x.on('dragend', function(e){
        console.log('dragend')
    })
})


var aRoads = [];
var aRoadNodeElements = [];
var aRoadSegments = [];
var aRoadNodeUsageMap = {}; // obj[node_id] = [way_ids that use that node]

var oRawNodeGraph = null;
var oGraphRaw = null;

// init game
// maybe we have preset coordinates in URL?
var oInitParams = {};
var aMatches = window.location.href.match(/leaflet\/.+?\/(.+?)\/(.+?)$/);
if (aMatches){
    oInitParams.lat = parseFloat(aMatches[1]);
    oInitParams.lon = parseFloat(aMatches[2]);
}

var oRoutingLayer = null;

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
            
            oCityData = res.data;
            // start game
            setTimeout(function(){
                fetch_ways();
            }, 500);
            

            tsGameStart = new Date().getTime();
        }
    }
})

function fetch_ways(){
    var sQuery = '[out:json][timeout:25];'+
                '('+
                  'way["highway"](around: 1000, '+oCityData.lat+', '+oCityData.lon+' ); '+
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
                if (el.type == 'way') aRoads[id] = new Road(el);
                else if (el.type == 'node') aRoadNodeElements[id] = el;
            }

            for (var i in aRoads){
                for (var j in aRoads[i].nodes){
                    var iNodeId = aRoads[i].nodes[j];
                    if (typeof aRoadNodeElements[iNodeId] != 'undefined'){
                        aRoads[i].nodes[j] = aRoadNodeElements[iNodeId];
                    }
                    if (typeof aRoadNodeUsageMap[iNodeId] == 'undefined'){
                        aRoadNodeUsageMap[iNodeId] = [];
                    }
                    aRoadNodeUsageMap[iNodeId].push(aRoads[i].id);
                }

                aRoads[i].makeFeature();
            }
            
        }
    })
}

function path(a, b){
    oGraphRaw = getRawNodeGraph();
    var oDijkstraGraph = getDijkstraGraph(oGraphRaw);
    var d = new Dijkstras();
    d.setGraph(oDijkstraGraph);
    var path = d.getPath(a, b);
    console.log('path', path)
    
    var aNodeList = [];
    for (var i in path){
        var oNode = aRoadNodeElements[path[i]];
        aNodeList.push([oNode.lon, oNode.lat])
    }
    
    var oFeature = {
        type: 'Feature',
        properties: {
            way_id: 'bau',
        },
        geometry: {
            type: 'LineString',
            coordinates: aNodeList
        }
    }
    
    var oStyle = {
        color: '#ff0',
        weight: 5,
        opacity: 1,
    }
    
    if (oRoutingLayer){
        map.removeLayer(oRoutingLayer);
    }
    oRoutingLayer = L.geoJson(oFeature, {
        style: oStyle,
        onEachFeature: function(feature, layer){ // totally only for debug
            return;
        }
    }).addTo(map);
}

$('#btnFind').click(function(e){
    var from = $('input[name=from]').val();
    var to = $('input[name=to]').val();
    
    oGraphRaw = getRawNodeGraph();
    var oDijkstraGraph = getDijkstraGraph(oGraphRaw);
    var d = new Dijkstras();
    d.setGraph(oDijkstraGraph);
    var path = d.getPath(from, to);
    console.log('path', path)
    
    
    if (path[0] != from){
        path.unshift(from);
    }
    if (path[path.length - 1] != to){
        path.push(to)
    }
    
    var aNodeList = [];
    for (var i in path){
        var oNode = aRoadNodeElements[path[i]];
        aNodeList.push([oNode.lon, oNode.lat])
    }
    
    var oFeature = {
        type: 'Feature',
        properties: {
            way_id: 'bau',
        },
        geometry: {
            type: 'LineString',
            coordinates: aNodeList
        }
    }
    
    var oStyle = {
        color: '#ff0',
        weight: 5,
        opacity: 1,
    }
    
    if (oRoutingLayer){
        map.removeLayer(oRoutingLayer);
    }
    oRoutingLayer = L.geoJson(oFeature, {
        style: oStyle,
        onEachFeature: function(feature, layer){ // totally only for debug
            return;
        }
    }).addTo(map);
})