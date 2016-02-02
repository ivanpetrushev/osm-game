$('#form1').submit(function(){
    var form = $(this);
    var aInputs = form.serializeArray();
    var oValues = {};
    for (var val in aInputs){
        var name = aInputs[val].name;
        var value = aInputs[val].value;
        oValues[name] = value;
    }
    
    console.log(aInputs, oValues);
    
    if (oValues.output == 'openlayers'){
        oValues.target = 'openlayers';
        var aUrlParts = [];
        for (var key in oValues){
            aUrlParts.push(key + '=' + encodeURIComponent(oValues[key]));
        }
        var sUrl = aUrlParts.join('&');
        window.open('http://overpass-api.de/api/convert?'+sUrl);
    }
    if (oValues.output == 'json'){
        oValues.data = '[out:json];'+oValues.data;
        window.open('http://overpass.osm.rambler.ru/cgi/interpreter?data='+oValues.data);
    }
    return false;
})

$('#btnRandCoords').click(function(e){
//    var lat = (Math.random() * 1800 - 900) / 10;
    var lat = (Math.random() * 1400 - 700) / 10; // nothing north or south of 70 deg
    var lon = (Math.random() * 3600 - 1800) / 10;
    $('#form2 input[name="lat"]').val(lat);
    $('#form2 input[name="lon"]').val(lon);
})

$('#btnOpenlayers').click(function(e){
    var form = $('#form2');
    var lat = $('#form2 input[name="lat"]').val();
    var lon = $('#form2 input[name="lon"]').val();
    var sData = 'node["place"~"village|town|city"](around: 100000, '+lat+','+lon+');out 1;'
    $('#generatedQuery').html(sData);
     window.open('http://overpass-api.de/api/convert?target=openlayers&data='+sData);
})

$('#btnJSON').click(function(e){
    var form = $('#form2');
    var lat = $('#form2 input[name="lat"]').val();
    var lon = $('#form2 input[name="lon"]').val();
    var sData = 'node["place"~"village|town|city"](around: 100000, '+lat+','+lon+');out 1;'
    $('#generatedQuery').html(sData);
     window.open('http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];'+sData);
})