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
}

Player.prototype.getLatLng = function(){
    return this.marker.getLatLng();
}

Player.prototype.move = function(dir){
    if (! bGameRunning) return;
    // move marker
    var iAngle = 0;
    switch(dir){
        case 'up': iAngle = 0; break;
        case 'right': iAngle = 90; break;
        case 'down': iAngle = 180; break;
        case 'left': iAngle = 270; break;
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
        bGameRunning = false;

        var tsGameEnd = new Date().getTime();
        var iGameDuration = Math.ceil((tsGameEnd - tsGameStart) / 1000 );

        $('input[name="time"]').val(iGameDuration);
        $('#ctScoreboard .time').html(iGameDuration);
        $('input[name="cnt_enemies"]').val(aEnemies.length);
        $('input[name="cnt_moves"]').val(this.cnt_moves);
        $('#ctScoreboard').slideToggle();
        $('#ctScoreboard input[type=text]').focus();
    }

    // move enemies using "Change in LOS rate" algorithm
    for (var i in aEnemies){
        var oEnemy = aEnemies[i];
        if (oEnemy.isInBounds()){
            oEnemy.moveTowardsPlayer();
        }
    }
}