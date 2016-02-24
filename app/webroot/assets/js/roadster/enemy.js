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
    // extends https://www.mapbox.com/mapbox.js/api/v2.3.0/l-marker/
    this.marker = marker;
    this.map = marker._map;
    this.speed = 3;
    this.last_angle = null;
    this.last_dst = null;
    marker.enemy = this;
    
    marker.on('click', function(e){
        console.log(this)
    })
}

Enemy.prototype.isInBounds = function(){
    var oBounds = this.map.getBounds();
    return oBounds.contains(this.marker.getLatLng());
}
Enemy.prototype.canSee = function(lat, lon){
    if (typeof window.aBuildings == 'undefined'){
        throw 'No buildings defined';
    }
    // ray 1: enemy - player
    var lat11 = this.marker.getLatLng().lat;
    var lon11 = this.marker.getLatLng().lng;
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
Enemy.prototype.moveTowardsPlayer = function(){
    var oSrcLatLon = this.marker.getLatLng();
    var oDstLatLng = oPlayer.getLatLng();
    if (this.canSee(oDstLatLng.lat, oDstLatLng.lng)){
//        this.speed = 13;
        this.marker.setIcon(oIconEnemyRed);
        this.last_dst = oDstLatLng;
    }
    else {
//        this.speed = 3;
        this.marker.setIcon(oIconEnemyGreen);
        if (this.last_dst){ // move towards last known position
            oDstLatLng = this.last_dst;
        }
        else {
            return; //@TODO: generate random movement
        }
    }
    
    
    var iOldDistance = oDstLatLng.distanceTo(oSrcLatLon);
    var iAngle = bearing(oSrcLatLon.lat, oSrcLatLon.lng, oDstLatLng.lat, oDstLatLng.lng);
    var iComputedAngle = iAngle;
    var iLosDiff = 0;
    if (! this.last_angle){
        this.last_angle = iAngle;
    }
    iLosDiff = Math.abs(iAngle - this.last_angle);
    if (iLosDiff > 1 && iOldDistance > 100){ // correct for interception
        if (iAngle > this.last_angle) {
            iComputedAngle = iAngle + 5 * iLosDiff;
        }
        else {
            iComputedAngle = iAngle - 5 * iLosDiff;
        }
    }
    this.last_angle = iAngle;
    
    var oMoveCoords = getMoveLatLng(oSrcLatLon.lat, oSrcLatLon.lng, this.speed, iComputedAngle);
    this.marker.setLatLng(oMoveCoords);

    var iNewDistance = window.oPlayer.getLatLng().distanceTo(oMoveCoords);
    if (iNewDistance < 20){
        alert('You die!');
    }
}