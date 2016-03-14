function getMoveLatLng(lat, lng, d, angle){
    // Earth Radious in meters
    var R = 6378140;

    // Degree to Radian
    var lat_rad = lat * (Math.PI/180);
    var lon_rad = lng * (Math.PI/180);
    var bearing = angle * (Math.PI/180);

    var new_lat_rad = Math.asin(Math.sin(lat_rad)*Math.cos(d/R) + Math.cos(lat_rad)*Math.sin(d/R)*Math.cos(bearing));
    var new_lon_rad = lon_rad + Math.atan2(Math.sin(bearing)*Math.sin(d/R)*Math.cos(lat_rad),Math.cos(d/R)-Math.sin(lat_rad)*Math.sin(new_lat_rad));

    // back to degrees
    var new_lat = new_lat_rad * (180/Math.PI);
    var new_lon = new_lon_rad * (180/Math.PI);

    // 6 decimal for Leaflet and other system compatibility
    new_lat = new_lat.toFixed(6);
    new_lon = new_lon.toFixed(6);

    // Push in array and get back
    return {
        lat: new_lat,
        lng: new_lon
    }
}

function tile2long(x,z) {
    return (x/Math.pow(2,z)*360-180);
}
function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

/**
 * Calculate the bearing between two positions as a value from 0-360
 *
 * @param lat1 - The latitude of the first position
 * @param lng1 - The longitude of the first position
 * @param lat2 - The latitude of the second position
 * @param lng2 - The longitude of the second position
 *
 * @return int - The bearing between 0 and 360
 */
function bearing(lat1, lng1, lat2, lng2) {
    var dLon = this._toRad(lng2-lng1);
    var y = Math.sin(dLon) * Math.cos(this._toRad(lat2));
    var x = Math.cos(_toRad(lat1))*Math.sin(_toRad(lat2)) - Math.sin(_toRad(lat1))*Math.cos(_toRad(lat2))*Math.cos(dLon);
    var brng = _toDeg(Math.atan2(y, x));
    return ((brng + 360) % 360);
}

/**
 * Since not all browsers implement this we have our own utility that will
 * convert from degrees into radians
 *
 * @param deg - The degrees to be converted into radians
 * @return radians
 */
function _toRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * Since not all browsers implement this we have our own utility that will
 * convert from radians into degrees
 *
 * @param rad - The radians to be converted into degrees
 * @return degrees
 */
function _toDeg(rad) {
    return rad * 180 / Math.PI;
}

function line_intersects(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return 1;
    }

    return 0; // No collision
}

function is_in_polygon(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

// find if point is inside sector - http://stackoverflow.com/questions/13652518/efficiently-find-points-inside-a-circle-sector
function isInsideSector(point, center, sectorStart, sectorEnd, radiusSquared) {
    var relPoint = {
        lat: point.lat - center.lat,
        lon: point.lon - center.lon
    };

    return !areClockwise(sectorStart, relPoint) &&
            areClockwise(sectorEnd, relPoint) &&
            isWithinRadius(relPoint, radiusSquared);
}

function areClockwise(v1, v2) {
    return -v1.lat * v2.lon + v1.lon * v2.lat > 0;
}

function isWithinRadius(v, radiusSquared) {
    return v.lat * v.lat + v.lon * v.lon <= radiusSquared;
}
//\find if point is inside sector

function moveOnTheRoad(entity, oCurrentCoords, iAngle){
    var aPossibleSegments = [];
    if (entity.snapped_on_node){
        var iSnapNodeId = entity.snapped_on_node.id;
        var aWaysWithThisNode = aRoadNodeUsageMap[iSnapNodeId];
        for (var i in aWaysWithThisNode){
            if (typeof aWaysWithThisNode[i] == 'function') continue;
            var aCheckWay = aRoads[aWaysWithThisNode[i]];
            for (var j = 0; j < aCheckWay.nodes.length; j++){
                if (typeof aCheckWay.nodes[j] == 'function') continue;
                var aCheckNode = aCheckWay.nodes[j];
                if (aCheckNode.id == iSnapNodeId){
                    if (typeof aCheckWay.nodes[j-1] != 'undefined'){
                        aPossibleSegments.push([aCheckWay.nodes[j-1], aCheckWay.nodes[j]])
                    }
                    if (typeof aCheckWay.nodes[j+1] != 'undefined'){
                        aPossibleSegments.push([aCheckWay.nodes[j], aCheckWay.nodes[j+1]])
                    }
                }
            }
        }
    }
    else {
        var oPlayerFakeNode = {
            lat: oCurrentCoords.lat,
            lon: oCurrentCoords.lng
        };
        aPossibleSegments.push([entity.currently_on_segment[0], oPlayerFakeNode])
        aPossibleSegments.push([oPlayerFakeNode, entity.currently_on_segment[1]])
    }
    
    if (aPossibleSegments.length == 0){
        // something wrong?
        entity.snapToNearestRoad();
        return;
    }
    
    // check angles of all segments and select the closest one to desired angle
    
//    if (entity.type == 'enemy') console.log('desired angle', iAngle);
    
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
        
        var iSegmentAngle = bearing(oCurrentCoords.lat, oCurrentCoords.lng, oFarNode.lat, oFarNode.lon);
        aSegmentAngles.push(iSegmentAngle)
        var iAngleDistance = iSegmentAngle - iAngle;
        iAngleDistance = (iAngleDistance + 180) % 360 - 180;
        aSegmentAnglesDistances.push(iAngleDistance)
    }
    
//    if (entity.type == 'enemy') console.log('possible angles', aSegmentAngles, 'with relative distances', aSegmentAnglesDistances);
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
    
    var iSelectedAngle = aSegmentAngles[iClosestAngleKey];
    if (entity.snapped_on_node){
        var aSelectedSegment = aPossibleSegments[iClosestAngleKey];
    }
    else {
        var aSelectedSegment = entity.currently_on_segment;
    }
    
    // we have a segment to work with, find which of the two endpoints is the target 
    
    var iAngleTo1 = bearing(oCurrentCoords.lat, oCurrentCoords.lng, aSelectedSegment[0].lat, aSelectedSegment[0].lon);
    var iAngleTo2 = bearing(oCurrentCoords.lat, oCurrentCoords.lng, aSelectedSegment[1].lat, aSelectedSegment[1].lon);
    var oTowardsNode = null;
    if (iAngleTo1 == iSelectedAngle) oTowardsNode = aSelectedSegment[0];
    if (iAngleTo2 == iSelectedAngle) oTowardsNode = aSelectedSegment[1];
    
    var iTowardsDistance = oCurrentCoords.distanceTo(L.latLng([oTowardsNode.lat, oTowardsNode.lon]));
    if (iTowardsDistance < entity.speed){
        var oNewCoords = L.latLng([oTowardsNode.lat, oTowardsNode.lon]);
        entity.snapped_on_node = oTowardsNode;
    }
    else {
        // @TODO
        entity.snapped_on_node = null;
        var oNewCoords = getMoveLatLng(oCurrentCoords.lat, oCurrentCoords.lng, entity.speed, iSelectedAngle);
    }
    entity.currently_on_segment = aSelectedSegment;
    
    return oNewCoords;
}

function getRawNodeGraph(){
    if (! oRawNodeGraph){
//    if (true){
        oRawNodeGraph = {};
        var oBounds = map.getBounds();
        for (var iNodeId in aRoadNodeUsageMap){
            var node = aRoadNodeElements[iNodeId];
            var latlng = L.latLng({lat: node.lat, lon: node.lon});
            if (oBounds.contains(latlng)){
                if (typeof oRawNodeGraph[iNodeId] == 'undefined'){
                    oRawNodeGraph[iNodeId] = [];
                }
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
                                oRawNodeGraph[iNodeId].push({id: aCheckWay.nodes[j-1].id, dist: iDistance});
                            }
                            if (typeof aCheckWay.nodes[j+1] != 'undefined'){
                                var oLatlngNext = L.latLng(aCheckWay.nodes[j+1].lat, aCheckWay.nodes[j+1].lon)
                                var iDistance = latlng.distanceTo(oLatlngNext);
                                oRawNodeGraph[iNodeId].push({id: aCheckWay.nodes[j+1].id, dist: iDistance});
                            }
                        }
                    }
                }
            }
        }
        
    }
    
    return JSON.parse(JSON.stringify((oRawNodeGraph))); // need to save oRawNodeGraph as a default base
}

function invalidateNodeGraph(){
    oNodeGraph = null;
}

function getDijkstraGraph(graph){
    var oOutGraph = [];
    for (var iNodeId in graph){
        for (var i in graph[iNodeId]){
            var nodes = graph[iNodeId];
            var aConnections = [];
            for (var j in nodes){
//                console.log('node is', node)
                aConnections.push([nodes[j].id, nodes[j].dist])
            }
        }
        oOutGraph.push([iNodeId, aConnections])
    }
    return oOutGraph;
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}