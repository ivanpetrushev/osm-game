function RoadSegment(a, b){
    this.a = {
        lon: a[0],
        lat: a[1]
    };
    this.b = {
        lon: b[0],
        lat: b[1]
    };
    this.node_list = []; // list of [lat, lon]'s
    this.node_list_reversed = []; // list of [lon, lat]'s
//    this._cfg = cfg;
//    this.id = cfg.id;
    this.nodes = [this.a, this.b];
    this.feature = null;
    this.center_latlon = {};
    
    this.buildNodeList();
    this.generateCenter();
}

RoadSegment.prototype.buildNodeList = function(){
    if (this.node_list.length == 0){
        for (var i in this.nodes){
            this.node_list.push([this.nodes[i].lon, this.nodes[i].lat])
            this.node_list_reversed.push([this.nodes[i].lat, this.nodes[i].lon])
        }
        this.generateCenter();
    }
}

RoadSegment.prototype.generateCenter = function(){
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


RoadSegment.prototype.makeFeature = function(){
    var oFeature = {
        type: 'Feature',
        properties: {
            center: this.center_latlon,
            a: this.a,
            b: this.b
        },
        geometry: {
            type: 'LineString',
            coordinates: this.node_list
        }
    }
    
    var oStyle = {
        color: '#f00',
        weight: 3,
        opacity: 0.5,
    }
    
//    console.log(JSON.stringify(oFeature))

    this.feature = L.geoJson(oFeature, {
        style: oStyle,
        onEachFeature: function(feature, layer){ // totally only for debug
            layer.on('click', function(e){
                console.log(feature)
                
                oPlayer.setLatLng(feature.properties.center);
                map.setView(feature.properties.center);
//                oPlayer.on_road = feature.properties.way_id;
            })
        }
    }).addTo(map);
}

RoadSegment.prototype.isInBounds = function(){
    var oBounds = map.getBounds();
    return oBounds.contains(this.center_latlon);
}