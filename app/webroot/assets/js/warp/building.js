function Building(cfg){
    this.node_list = []; // list of [lat, lon]'s
    this.node_list_reversed = []; // list of [lon, lat]'s
    this._cfg = cfg;
    this.id = cfg.id;
    this.nodes = cfg.nodes;
    this.feature = null;
    this.centerLatLon = {};
}

Building.prototype.generateCenter = function(){
    if (this.nodes.length > 0){
        var iSumLat = 0;
        var iSumLon = 0;
        for (var i = 0; i < this.nodes.length; i++){
            iSumLat += parseFloat(this.nodes[i].lat);
            iSumLon += parseFloat(this.nodes[i].lon);
        }
        var iAvgLat = iSumLat / this.nodes.length;
        var iAvgLon = iSumLon / this.nodes.length;
        this.centerLatLon = L.latLng(iAvgLat, iAvgLon);
//        L.marker(this.centerLatLon).addTo(map); // debug
    }
}

Building.prototype.buildNodeList = function(){
    if (this.node_list.length == 0){
        for (var i in this.nodes){
            this.node_list.push([this.nodes[i].lon, this.nodes[i].lat])
            this.node_list_reversed.push([this.nodes[i].lat, this.nodes[i].lon])
        }
        this.generateCenter();
    }
}

Building.prototype.contains = function(lat, lon){
    this.buildNodeList();
    return (is_in_polygon([lat, lon], this.node_list_reversed));
}

Building.prototype.makeFeature = function(){
    this.buildNodeList();
    var oFeature = {
        type: 'Feature',
        properties: {

        },
        geometry: {
            type: 'Polygon',
            coordinates: [this.node_list]
        }
    }
    
    var oStyle = {
        color: '#000',
        weight: 1,
        opacity: 0.1,
        fillOpacity: 0.6
    }
    
    this.feature = L.geoJson(oFeature, oStyle).addTo(map);
}

Building.prototype.isInBounds = function(){
    var oBounds = map.getBounds();
    return oBounds.contains(this.centerLatLon);
}