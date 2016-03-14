var oIconEnemyGreen = L.MakiMarkers.icon({
    icon: "rocket",
    color: "#0b0",
    size: "m"
});
var oIconEnemyRed = L.MakiMarkers.icon({
    icon: "rocket",
    color: "#f00",
    size: "m"
});

function Enemy(marker){
    this.type = 'enemy';
    // marker is https://www.mapbox.com/mapbox.js/api/v2.3.0/l-marker/
    this.marker = marker;
    this.map = marker._map;
    this.speed = 12;
    this.last_angle = null;
    this.last_dst = null;
    this.snapped_on_road = null;
    this.snapped_on_node = null; 
    this.currently_on_segment = null; // [latLng, latLng]
    marker.enemy = this;
    
    marker.on('click', function(e){
        console.log(this)
    })
}

Enemy.prototype.getLatLng = function(){
    return this.marker.getLatLng();
}

Enemy.prototype.setLatLng = function(latlng){
    return this.marker.setLatLng(latlng);
}

Enemy.prototype.isInBounds = function(){
    var oBounds = this.map.getBounds();
    return oBounds.contains(this.getLatLng());
}
Enemy.prototype.canSee = function(lat, lon){
    if (typeof window.aBuildings == 'undefined'){
        throw 'No buildings defined';
    }
    // ray 1: enemy - player
    var lat11 = this.getLatLng().lat;
    var lon11 = this.getLatLng().lng;
    var lat12 = lat;
    var lon12 = lon;

    // ray 2: each polygon's edge - if any of ray2 intersects ray1 - immediately return 
    for (var i in window.aBuildings){
        var oThisBuilding = window.aBuildings[i];
        if (oThisBuilding.isInBounds()){
            for (var j = 0; j < oThisBuilding.nodes.length - 1; j++){
                var oNode1 = oThisBuilding.nodes[j];
                var oNode2 = oThisBuilding.nodes[j+1];

                var lat21 = parseFloat(oNode1.lat);
                var lat22 = parseFloat(oNode2.lat);
                var lon21 = parseFloat(oNode1.lon);
                var lon22 = parseFloat(oNode2.lon);

                if (line_intersects(lat11, lon11, lat12, lon12, lat21, lon21, lat22, lon22)){
                    return false;
                }
            }
        }
    }
    return true;
}

// move enemies using "Change in LOS rate" algorithm
Enemy.prototype.moveTowardsPlayer = function(){
    var oSrcLatLon = this.getLatLng();
    var oDstLatLng = oPlayer.getLatLng();
    if (this.canSee(oDstLatLng.lat, oDstLatLng.lng)){
        this.marker.setIcon(oIconEnemyRed);
        this.last_dst = oDstLatLng;
    }
    else {
        this.marker.setIcon(oIconEnemyGreen);
        if (this.last_dst){ // move towards last known position
            oDstLatLng = this.last_dst;
        }
        else {
            return; //@TODO: generate random movement
        }
    }
    
    var iAngle = bearing(oSrcLatLon.lat, oSrcLatLon.lng, oDstLatLng.lat, oDstLatLng.lng);
    var oMoveCoords = moveOnTheRoad(this, oSrcLatLon, iAngle);
    this.setLatLng(oMoveCoords);

    var iNewDistance = window.oPlayer.getLatLng().distanceTo(oMoveCoords);
    if (iNewDistance < 20){
        alert('You die!');
    }
}

Enemy.prototype.snapToNearestRoad = function(){
    var oCurrentLocation = this.getLatLng();
    var aDistances = [];
    for (var i in aRoadNodeElements){
        aDistances[i] = oCurrentLocation.distanceTo(L.latLng(aRoadNodeElements[i].lat, aRoadNodeElements[i].lon));
    }
    var iMinDistance = 10000; // can't initialize it to aDistances[0] due to arrays being associative here
    var iMinKey = 0;
    for (var i in aDistances){
        if (aDistances[i] < iMinDistance){
            iMinDistance = aDistances[i];
            iMinKey = i;
        }
    }
    
    var oNewCoords = L.latLng(aRoadNodeElements[iMinKey].lat, aRoadNodeElements[iMinKey].lon);
    this.setLatLng(oNewCoords);
//    map.setView(oNewCoords);
    
    this.snapped_on_node = aRoadNodeElements[iMinKey];
}