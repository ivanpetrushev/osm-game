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
    var me = this;
    this.type = 'enemy';
    // marker is https://www.mapbox.com/mapbox.js/api/v2.3.0/l-marker/
    this.marker = marker;
    this.map = marker._map;
    this.speed = 9;
    this.last_angle = null;
    this.last_dst = null;
    this.snapped_on_road = null;
    this.snapped_on_node = null; 
    this.currently_on_segment = null; // [latLng, latLng]
    marker.enemy = this;
    
    marker.on('click', function(e){
        console.log(me, 'snapped to', me.snapped_on_node.id)
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
    var oSrcLatLng = this.getLatLng();
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
    
    // if Enemy and Player are on the same segment, it is easy-peasy to select the direction
    var s1 = this.currently_on_segment;
    var s2 = oPlayer.currently_on_segment;
    if (s1 && s2 && 
        (
            (s1[0].id == s2[0].id && s1[1].id == s2[1].id) ||
            (s1[1].id == s2[0].id && s1[0].id == s2[1].id)
        )){
        var iAngle = bearing(oSrcLatLng.lat, oSrcLatLng.lng, oDstLatLng.lat, oDstLatLng.lng);
//        console.log('in the same segment with angle', iAngle)
    }
    else {
        // do some routing, first get all ways in sight
//        console.log('----------------------------------------')
        var oGraphRaw = getRawNodeGraph();
        // add enemy to the graph
        oGraphRaw[0] = []; // use 0 for enemy index
        if (this.snapped_on_node){
            var iNodeId = this.snapped_on_node.id;
            var latlng = L.latLng({lat: this.snapped_on_node.lat, lon: this.snapped_on_node.lon});

            var aWaysWithThisNode = aRoadNodeUsageMap[iNodeId];
            for (var i in aWaysWithThisNode){
                if (typeof aWaysWithThisNode[i] == 'function') continue;
                var aCheckWay = aRoads[aWaysWithThisNode[i]];
                for (var j = 0; j < aCheckWay.nodes.length; j++){
                    if (typeof aCheckWay.nodes[j] == 'function') continue;
                    var aCheckNode = aCheckWay.nodes[j];
                    if (aCheckNode.id == iNodeId){
                        if (typeof aCheckWay.nodes[j-1] != 'undefined'){
                            var oLatlngPrev = L.latLng(aCheckWay.nodes[j-1].lat, aCheckWay.nodes[j-1].lon)
                            var iDistance = latlng.distanceTo(oLatlngPrev);
                            oGraphRaw[0].push({id: aCheckWay.nodes[j-1].id, dist: iDistance});
                        }
                        if (typeof aCheckWay.nodes[j+1] != 'undefined'){
                            var oLatlngNext = L.latLng(aCheckWay.nodes[j+1].lat, aCheckWay.nodes[j+1].lon)
                            var iDistance = latlng.distanceTo(oLatlngNext);
                            oGraphRaw[0].push({id: aCheckWay.nodes[j+1].id, dist: iDistance});
                        }
                    }
                }
            }
        }
        else {
            var iDistance1 = oSrcLatLng.distanceTo(this.currently_on_segment[0]);
            var iDistance2 = oSrcLatLng.distanceTo(this.currently_on_segment[1]);
            oGraphRaw[0] = [ // use 2 for this enemy index
                {id: this.currently_on_segment[0].id, dist: iDistance1},
                {id: this.currently_on_segment[1].id, dist: iDistance2},
            ]
        }
        for (var i in oGraphRaw[0]){
            var aConnection = oGraphRaw[0][i];
            var iConnectedId = aConnection.id;
            if (typeof oGraphRaw[iConnectedId] != 'undefined'){
                oGraphRaw[iConnectedId].push({id: 0, dist: aConnection.dist})
            }
        }

        // add player to the graph
        oGraphRaw[1] = []; // use 1 for player index
        if (oPlayer.snapped_on_node){
            var iNodeId = oPlayer.snapped_on_node.id;
            var latlng = L.latLng({lat: oPlayer.snapped_on_node.lat, lon: oPlayer.snapped_on_node.lon});

            var aWaysWithThisNode = aRoadNodeUsageMap[iNodeId];
            for (var i in aWaysWithThisNode){
                if (typeof aWaysWithThisNode[i] == 'function') continue;
                var aCheckWay = aRoads[aWaysWithThisNode[i]];
                for (var j = 0; j < aCheckWay.nodes.length; j++){
                    if (typeof aCheckWay.nodes[j] == 'function') continue;
                    var aCheckNode = aCheckWay.nodes[j];
                    if (aCheckNode.id == iNodeId){
                        if (typeof aCheckWay.nodes[j-1] != 'undefined'){
                            var oLatlngPrev = L.latLng(aCheckWay.nodes[j-1].lat, aCheckWay.nodes[j-1].lon)
                            var iDistance = latlng.distanceTo(oLatlngPrev);
                            oGraphRaw[1].push({id: aCheckWay.nodes[j-1].id, dist: iDistance});
                        }
                        if (typeof aCheckWay.nodes[j+1] != 'undefined'){
                            var oLatlngNext = L.latLng(aCheckWay.nodes[j+1].lat, aCheckWay.nodes[j+1].lon)
                            var iDistance = latlng.distanceTo(oLatlngNext);
                            oGraphRaw[1].push({id: aCheckWay.nodes[j+1].id, dist: iDistance});
                        }
                    }
                }
            }
        }
        else {
            var iDistance1 = oDstLatLng.distanceTo(oPlayer.currently_on_segment[0]);
            var iDistance2 = oDstLatLng.distanceTo(oPlayer.currently_on_segment[1]);
            oGraphRaw[1] = [ 
                {id: oPlayer.currently_on_segment[0].id, dist: iDistance1},
                {id: oPlayer.currently_on_segment[1].id, dist: iDistance2},
            ]
        }
        for (var i in oGraphRaw[1]){
            var aConnection = oGraphRaw[1][i];
            var iConnectedId = aConnection.id;
            if (typeof oGraphRaw[iConnectedId] != 'undefined'){
                oGraphRaw[iConnectedId].push({id: 1, dist: aConnection.dist})
            }
        }

    //    console.log('graph', oGraphRaw)
        var oDijkstraGraph = getDijkstraGraph(oGraphRaw);
    //    console.log('dikjstra ready', oDijkstraGraph)
        var d = new Dijkstras();
        d.setGraph(oDijkstraGraph);
        var path = d.getPath('0', '1');
//        console.log('path', path)
        if (typeof path[0] == 'undefined'){
            // there is no way
            return;
        }
        var iNextNode = path[0];
        var iAngle = bearing(oSrcLatLng.lat, oSrcLatLng.lng, aRoadNodeElements[iNextNode].lat, aRoadNodeElements[iNextNode].lon);
//        console.log('Dijkstra said', iAngle)
    } // end of Dijkstra
    
    var oMoveCoords = moveOnTheRoad(this, oSrcLatLng, iAngle);
    this.setLatLng(oMoveCoords);

    var iNewDistance = oPlayer.getLatLng().distanceTo(oMoveCoords);
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