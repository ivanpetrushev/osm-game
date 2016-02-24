function Target(cfg){
    this.cfg = cfg;
    this.lat = cfg.lat;
    this.lon = cfg.lon;
    this.distance_to_player = null;
    
    var icon = L.icon({
        iconUrl: '/img/icons/16x16/add_green.png'
    })
    L.marker([cfg.lat, cfg.lon], {icon: icon}).addTo(map);
    L.circle([cfg.lat, cfg.lon], 100).addTo(map);
}