<!DOCTYPE html>
<html>
<head>
    <title>Hello</title>
</head>
<body>
    
    <form method="get" action="http://overpass-api.de/api/convert" id="form1">
        <label>Openlayers <input type="radio" name="output" value="openlayers"></label><br />
        <label>Json <input type="radio" name="output" value="json"></label><br /><br />
        
        Data: <textarea name="data"></textarea><br />
        Lat: <input type="text" name="lat" /><br />
        Lon: <input type="text" name="lon" /><br />
        Zoom: <input type="text" name="zoom" /><br />
        <input type="submit" />
    </form>
    
    <hr />
    <form id="form2">
        <input type="button" id="btnRandCoords" value="Rand"/><br />
        Lat: <input type="text" name="lat" /><br />
        Lon: <input type="text" name="lon" /><br />
        <input type="button" value="Go Openlayers" id="btnOpenlayers" /><br />
        <input type="button" value="Go JSON" id="btnJSON" /><br />
    </form>
    
    <hr />
    <div id="generatedQuery"></div>
    
    <script src="https://code.jquery.com/jquery-2.2.0.min.js" type="text/javascript"></script>
    <script src="/assets/js/custom.js" type="text/javascript"></script>
</body>
</html>