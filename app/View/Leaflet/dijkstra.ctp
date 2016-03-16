<!DOCTYPE html>
<html>
    <head>
        <meta charset=utf-8 />
        <title>Dijkstra</title>
        <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
        
        <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.css" />
        <link rel='stylesheet' type="text/css" href='https://fonts.googleapis.com/css?family=Russo+One' />
        <link rel='stylesheet' type="text/css" href="/assets/css/dijkstra.css"  />
    </head>
    <body>
        <div id='ctMap'></div>
        <div id='infoPanel'>Select From and To</div>
        
        <div id="ctDestinations">
            <form>
                From: <input type="text" name="from" /> <input type="button" value="Pick" id="btnPickFrom" /> <br />
                To: <input type="text" name="to" /><input type="button" value="Pick" id="btnPickTo"/> <br />
                <input type="button" value="Find route" id="btnFind" />
            </form>
        </div>
        
        
        <script src="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.js"></script>
        <script src='/assets/js/Leaflet.MakiMarkers.js'></script>
        <script src='/assets/js/jquery-2.2.0.min.js'></script>
        <script src='/assets/js/functions.js'></script>
        <script src='/assets/js/Dijkstras.js'></script>
        
        <script src='/assets/js/dijkstra/enemy.js'></script>
        <script src='/assets/js/dijkstra/road.js'></script>
        <script src='/assets/js/dijkstra/road_segment.js'></script>
        <script src='/assets/js/dijkstra/main.js'></script>
    </body>
</html>