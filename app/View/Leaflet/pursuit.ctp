<!DOCTYPE html>
<html>
    <head>
        <meta charset=utf-8 />
        <title>Pursuit</title>
        <meta name='viewport' content='initial-scale=1,maximum-scale=1,user-scalable=no' />
        
        <link rel='stylesheet' type="text/css" href='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.css' />
        <link rel='stylesheet' type="text/css" href='https://fonts.googleapis.com/css?family=Russo+One' />
        <link rel='stylesheet' type="text/css" href="/assets/css/pursuit.css"  />
    </head>
    <body>
        <div id="splashscreen"><span class='loading' data-text='Loading world'>Loading world</span></div>
        <ul id="menu">
            <li class="scores">Scores</li>
            <li class="howto">Howto</li>
        </ul>
        <div id='ctMap'></div>
        <div id='infoPanel'></div>
        <div id="ctScoreboard">
            <h1>You won! </h1>
            <p>Game finished in <span class="time"></span>s.</p>
            <form method="post" action="/score/update" >
                <input type="hidden" name="city_name" />
                <input type="hidden" name="time" />
                <input type="hidden" name="cnt_moves" />
                <input type="hidden" name="cnt_enemies" />
                Player name: <input type="text" name="player_name" required maxlength="3" autocomplete="off"/> <br />
                <input type="submit" />
            </form>
        </div>
        <div id="ctHighscores">
            <table>
                <tr><th>Player</th><th>Time</th><th>City</th></tr>
                <? foreach ($scores as $item):?>
                <tr>
                    <td><?=htmlentities($item['Score']['player_name'], ENT_QUOTES, "UTF-8")?></td>
                    <td><?=htmlentities($item['Score']['time'], ENT_QUOTES, "UTF-8")?></td>
                    <td><?=htmlentities($item['Score']['city_name'], ENT_QUOTES, "UTF-8")?></td>
                </tr>
                <? endforeach; ?>
            </table>
        </div>
        <div id='ctHowto'>
            Use arrow keys to move. Escape from enemies. Use buildings to get cover.
        </div>
        
        <script src='https://api.mapbox.com/mapbox.js/v2.2.4/mapbox.js'></script>
        <script src='/assets/js/Leaflet.MakiMarkers.js'></script>
        <script src='/assets/js/jquery-2.2.0.min.js'></script>
        <script src='/assets/js/functions.js'></script>
        <script src='/assets/js/pursuit/enemy.js'></script>
        <script src='/assets/js/pursuit/building.js'></script>
        <script src='/assets/js/pursuit/player.js'></script>
        <script src='/assets/js/pursuit/target.js'></script>
        <script src='/assets/js/pursuit/main.js'></script>
    </body>
</html>