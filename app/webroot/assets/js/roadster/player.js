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
    this.marker = L.marker().setIcon(oIconPlayerMoving);
    this.speed = 10;
    this.cnt_moves = 0;
    this.on_road = null;
    this.on_segment = null; // [latLng, latLng]
}

Player.prototype.getLatLng = function(){
    return this.marker.getLatLng();
}

Player.prototype.setLatLng = function(latlng){
    return this.marker.setLatLng(latlng);
}

Player.prototype.move = function(dir, iAngle){
    if (! bGameRunning) return;
    // move marker
    if (typeof iAngle == 'undefined'){
        switch(dir){
            case 'up': iAngle = 0; break;
            case 'right': iAngle = 90; break;
            case 'down': iAngle = 180; break;
            case 'left': iAngle = 270; break;
        }
    }
    var oCurrentCoords = this.getLatLng();
    var oNewCoords = getMoveLatLng(oCurrentCoords.lat, oCurrentCoords.lng, this.speed, iAngle);
    for (var i in aBuildings){
        if (aBuildings[i].contains(oNewCoords.lat, oNewCoords.lng)){
            this.marker.setIcon(oIconPlayerBlocked);
            return;
        }
        else {
            this.marker.setIcon(oIconPlayerMoving);
        }
    }
    
    // get debug cone
    var iConeAngle1 = iAngle - 45;
    var iConeAngle2 = iAngle + 45;
    var iConeDistance = 200; 
    var oConeVector1 = getMoveLatLng(oCurrentCoords.lat, oCurrentCoords.lng, iConeDistance, iConeAngle1);
    oConeVector1.lon = oConeVector1.lng;
    var oConeVector2 = getMoveLatLng(oCurrentCoords.lat, oCurrentCoords.lng, iConeDistance, iConeAngle2);
    oConeVector2.lon = oConeVector2.lng;
    console.log(oConeVector1, oConeVector2)
    // @TODO: clear old marked points
    
    for (var i in aRoadNodeElements){
        if (typeof aRoadNodeElements[i] == 'function') continue;
        
        var center = {
            lat: oCurrentCoords.lat,
            lon: oCurrentCoords.lng
        }
        
        var bInsideCone = isInsideSector(aRoadNodeElements[i], center, oConeVector1, oConeVector2, iConeDistance*iConeDistance);
        if (bInsideCone){
            console.log('inside cone', aRoadNodeElements[i])
        }
        else {
            console.log('not', aRoadNodeElements[i])
        }
    }
    
    //\get debug cone

    this.marker.setLatLng(oNewCoords);

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
        
//        bGameRunning = false;
//
//        var tsGameEnd = new Date().getTime();
//        var iGameDuration = Math.ceil((tsGameEnd - tsGameStart) / 1000 );
//
//        $('input[name="time"]').val(iGameDuration);
//        $('#ctScoreboard .time').html(iGameDuration);
//        $('input[name="cnt_enemies"]').val(aEnemies.length);
//        $('input[name="cnt_moves"]').val(this.cnt_moves);
//        $('#ctScoreboard').slideToggle();
//        $('#ctScoreboard input[type=text]').focus();
    }

    // move enemies using "Change in LOS rate" algorithm
    for (var i in aEnemies){
        var oEnemy = aEnemies[i];
        if (oEnemy.isInBounds()){
            oEnemy.moveTowardsPlayer();
        }
    }
}