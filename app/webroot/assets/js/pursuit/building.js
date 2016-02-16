function Building(cfg){
    this.node_list = []; // list of [lat, lon]'s
    this.node_list_reversed = []; // list of [lon, lat]'s
    this._cfg = cfg;
    this.id = cfg.id;
    this.nodes = cfg.nodes;
    this.feature = null;
}

Building.prototype.buildNodeList = function(){
    if (this.node_list.length == 0){
        for (var i in this.nodes){
            this.node_list.push([this.nodes[i].lon, this.nodes[i].lat])
            this.node_list_reversed.push([this.nodes[i].lat, this.nodes[i].lon])
        }
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