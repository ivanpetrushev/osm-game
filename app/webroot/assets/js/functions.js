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