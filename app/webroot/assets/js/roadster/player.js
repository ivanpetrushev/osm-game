var oIconPlayerMoving = L.MakiMarkers.icon({
    icon: "pitch",
    color: "#00f",
    size: "m"
});
var oIconPlayerBlocked = L.MakiMarkers.icon({
    icon: "cross",
    color: "#00f",
    size: "m"
});

function Player(){
    this.type = 'player';
    this.marker = L.marker().setIcon(oIconPlayerMoving);
    this.speed = 10;
//    this.speed = 30;
    this.cnt_moves = 0;
    this.snapped_on_road = null;
    this.snapped_on_node = null; 
    this.currently_on_segment = null; // [latLng, latLng]
}

Player.prototype.getLatLng = function(){
    return this.marker.getLatLng();
}

Player.prototype.setLatLng = function(latlng){
    return this.marker.setLatLng(latlng);
}

Player.prototype.move = function(dir, iAngle){
    if (! bGameRunning) return;
    
    if (typeof iAngle == 'undefined'){
        switch(dir){
            case 'up': iAngle = 0; break;
            case 'right': iAngle = 90; break;
            case 'down': iAngle = 180; break;
            case 'left': iAngle = 270; break;
        }
    }
    var oCurrentCoords = this.getLatLng();
    
    
    // player should be on any segment, maybe snapped to a node (if on a crossroad)
    var oNewCoords = moveOnTheRoad(this, oCurrentCoords, iAngle);
    this.setLatLng(oNewCoords);

    this.cnt_moves++;

    if (this.cnt_moves % 10 == 0){
        map.panTo(oNewCoords);
    }

    // calculate distance and anounce nearest
    for (var i in aTargetLocations){
        var loc = aTargetLocations[i];
        aTargetLocations[i].distance_to_player = this.getLatLng().distanceTo([loc.lat, loc.lon]);
    }

    var oNearest = aTargetLocations[0];
    for (var i = 1; i < aTargetLocations.length; i++){
        if (aTargetLocations[i].distance_to_player < oNearest.distance_to_player){
            oNearest = aTargetLocations[i];
        }
    }
    $('#distance').html('Distance: '+Math.round(oNearest.distance_to_player));

    if (oNearest.distance_to_player < 100){
        // win
        fetch_next_level();
        return;
    }

    // move enemies 
    for (var i in aEnemies){
        var oEnemy = aEnemies[i];
        if (oEnemy.isInBounds()){
            oEnemy.moveTowardsPlayer();
        }
    }
}

Player.prototype.snapToNearestRoad = function(){
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
    this.snapped_on_road = null;
    this.currently_on_segment = null; // [latLng, latLng]
}