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
//    this.speed = 10;
    this.speed = 300;
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
    
    // player should be on any segment, maybe snapped to a node (if on a crossroad)
    var aPossibleSegments = [];
    if (this.snapped_on_node){
        var iSnapNodeId = this.snapped_on_node.id;
        var aWaysWithThisNode = aRoadNodeUsageMap[iSnapNodeId];
        for (var i in aWaysWithThisNode){
            if (typeof aWaysWithThisNode[i] == 'function') continue;
            var aCheckWay = aRoads[aWaysWithThisNode[i]];
//            console.log('check way', aCheckWay)
            for (var j = 0; j < aCheckWay.nodes.length; j++){
                if (typeof aCheckWay.nodes[j] == 'function') continue;
                var aCheckNode = aCheckWay.nodes[j];
                if (aCheckNode.id == iSnapNodeId){
//                    console.log('found node id on way', aCheckWay)
                    if (typeof aCheckWay.nodes[j-1] != 'undefined'){
//                        console.log('adding prev segment')
                        aPossibleSegments.push([aCheckWay.nodes[j-1], aCheckWay.nodes[j]])
                    }
                    if (typeof aCheckWay.nodes[j+1] != 'undefined'){
//                        console.log('adding next segment')
                        aPossibleSegments.push([aCheckWay.nodes[j], aCheckWay.nodes[j+1]])
                    }
                }
            }
        }
    }
    else {
        // @TODO - player is in the middle of a segment
    }
    console.log('possibel segments (samo ot other roads)', aPossibleSegments)
    
    // check angles of all segments and select the closest one to desired angle
    
    var aSegmentAngles = [];
    var aSegmentAnglesDistances = [];
    for (var i = 0; i < aPossibleSegments.length; i++){
        var oNode1 = aPossibleSegments[i][0];
        var oNode2 = aPossibleSegments[i][1];
        var iDistanceTo1 = oCurrentCoords.distanceTo(L.latLng([oNode1.lat, oNode1.lon]));
        var iDistanceTo2 = oCurrentCoords.distanceTo(L.latLng([oNode2.lat, oNode2.lon]));
        var oFarNode = null;
        if (iDistanceTo1 < iDistanceTo2) oFarNode = oNode2;
        else oFarNode = oNode1;
        
//        console.log('occ', oCurrentCoords, 'ofn', oFarNode)
        
        var iSegmentAngle = bearing(oCurrentCoords.lat, oCurrentCoords.lng, oFarNode.lat, oFarNode.lon);
        aSegmentAngles.push(iSegmentAngle)
        var iAngleDistance = iSegmentAngle - iAngle;
        iAngleDistance = (iAngleDistance + 180) % 360 - 180;
        aSegmentAnglesDistances.push(iAngleDistance)
    }
    console.log('segment angles', aSegmentAngles, 'distances', aSegmentAnglesDistances, 'desired angle', iAngle)
    
    // get closest angle
    var iClosestAngle = 360;
    var iClosestAngleKey = null;
    for (var i = 0; i < aSegmentAnglesDistances.length; i++){
        var iAngleDistance = Math.abs(aSegmentAnglesDistances[i]);
        if (iAngleDistance < iClosestAngle){
            iClosestAngle = iAngleDistance;
            iClosestAngleKey = i;
        }
    }
    console.log('desired', iAngle, 'closest angle distance:', iClosestAngle, 'key:', iClosestAngleKey)
    if (iClosestAngle > 90){
        // not close at all
        return;
    }
    
    var iSelectedAngle = aSegmentAngles[iClosestAngleKey];
    var aSelectedSegment = aPossibleSegments[iClosestAngleKey];
    console.log('selected angle', iSelectedAngle, 'on segment', aSelectedSegment)
    
    // we have a segment to work with, find which of the two endpoints is the target 
    
    var iAngleTo1 = bearing(oCurrentCoords.lat, oCurrentCoords.lng, aSelectedSegment[0].lat, aSelectedSegment[0].lon);
    var iAngleTo2 = bearing(oCurrentCoords.lat, oCurrentCoords.lng, aSelectedSegment[1].lat, aSelectedSegment[1].lon);
    console.log('angle to 1', iAngleTo1, 'to 2', iAngleTo2)
    var oTowardsNode = null;
    if (iAngleTo1 == iSelectedAngle) oTowardsNode = aSelectedSegment[0];
    if (iAngleTo2 == iSelectedAngle) oTowardsNode = aSelectedSegment[1];
    var iTowardsDistance = oCurrentCoords.distanceTo(L.latLng([oTowardsNode.lat, oTowardsNode.lon]));
    console.log('moving towards', oTowardsNode, 'distance to there', iTowardsDistance);
    if (iTowardsDistance < this.speed){
        oNewCoords = L.latLng([oTowardsNode.lat, oTowardsNode.lon]);
        this.snapped_on_node = oTowardsNode;
    }
    else {
        // @TODO
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