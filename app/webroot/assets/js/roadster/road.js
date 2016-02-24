function Road(cfg){
    this.node_list = []; // list of [lat, lon]'s
    this.node_list_reversed = []; // list of [lon, lat]'s
    this._cfg = cfg;
    this.id = cfg.id;
    this.nodes = cfg.nodes;
    this.feature = null;
    this.center_latlon = {};
    this.segments = [];
}

Road.prototype.generateCenter = function(){
    if (this.nodes.length > 0){
        var iSumLat = 0;
        var iSumLon = 0;
        for (var i = 0; i < this.nodes.length; i++){
            iSumLat += parseFloat(this.nodes[i].lat);
            iSumLon += parseFloat(this.nodes[i].lon);
        }
        var iAvgLat = iSumLat / this.nodes.length;
        var iAvgLon = iSumLon / this.nodes.length;
        this.center_latlon = L.latLng(iAvgLat, iAvgLon);
//        L.marker(this.centerLatLon).addTo(map); // debug
    }
}

Road.prototype.buildNodeList = function(){
    if (this.node_list.length == 0){
        for (var i in this.nodes){
            this.node_list.push([this.nodes[i].lon, this.nodes[i].lat])
            this.node_list_reversed.push([this.nodes[i].lat, this.nodes[i].lon])
        }
        this.generateCenter();
    }
}

Road.prototype.makeFeature = function(){
    this.buildNodeList();
    
//    for (var i  = 0; i < this.node_list.length-1; i++){
//        var x = new RoadSegment(this.node_list[i], this.node_list[i+1])
//        x.makeFeature();
//    }

    
    //*
    var oFeature = {
        type: 'Feature',
        properties: {
            way_id: this._cfg.id,
            center: this.center_latlon
        },
        geometry: {
            type: 'LineString',
            coordinates: this.node_list
        }
    }
    
    var oStyle = {
        color: '#f00',
        weight: 5,
        opacity: 0.5,
    }
    
//    console.log(JSON.stringify(oFeature))

    this.feature = L.geoJson(oFeature, {
        style: oStyle,
        onEachFeature: function(feature, layer){ // totally only for debug
            layer.on('click', function(e){
                console.log(feature)
                
                var oNewCoords = feature.geometry.coordinates[0]; // feature.properties.center
                oNewCoords = L.latLng(oNewCoords[1], oNewCoords[0])
                var oSegmentEnd = feature.geometry.coordinates[1];
                oSegmentEnd = L.latLng(oSegmentEnd[1], oSegmentEnd[0]);
                
                oPlayer.setLatLng(oNewCoords);
                map.setView(oNewCoords);
                oPlayer.on_road = aRoads[feature.properties.way_id];
                oPlayer.on_segment = [oNewCoords, oSegmentEnd];
            })
        }
    }).addTo(map);
    //*/
}

Road.prototype.isInBounds = function(){
    var oBounds = map.getBounds();
    return oBounds.contains(this.center_latlon);
}