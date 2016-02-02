<?php


App::uses('Shell', 'Console');

/**
 * Application Shell
 *
 * Add your application-wide methods in the class below, your shells
 * will inherit them.
 *
 * @package       app.Console.Command
 */
class FixesShell extends AppShell {
    public $uses = array('City');
    
    public function fetch_cities(){
        $this->City->query('TRUNCATE TABLE cities');
        
        $sQuery = '(node["place"="city"]["population"~"^1....$|^2.....$|^3.....$"]);out body;';
        $sQuery = urlencode($sQuery);
        $sContent = file_get_contents('http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];'.$sQuery);
        $aContent = json_decode($sContent, true);
        print "Cnt cities: ".count($aContent['elements'])."\n";
        foreach ($aContent['elements'] as $idx => $item){
            $aUpdateData = array(
                'osm_id' => $item['id'],
                'lat' => $item['lat'],
                'lon' => $item['lon'],
                'population' => '',
                'name' => '',
                'is_in' => '',
            );
            if (isset($item['tags']['population'])){
                $aUpdateData['population'] = preg_replace('/[^\d]/', '', $item['tags']['population']);
            }
            if (isset($item['tags']['name:en'])){
                $aUpdateData['name'] = $item['tags']['name:en'];
            }
            elseif (isset($item['tags']['name'])){
                $aUpdateData['name'] = $item['tags']['name'];
            }
            if (isset($item['tags']['is_in'])){
                $aUpdateData['is_in'] = $item['tags']['is_in'];
            }
            elseif (isset($item['tags']['is_in:country'])){
                $aUpdateData['is_in'] = $item['tags']['is_in:country'];
            }
            
            $this->City->create();
            $this->City->save($aUpdateData);
            if ($idx % 10 == 0){
                print "$idx / ".count($aContent['elements'])."\r";
            }
        }
        print "\nDone\n";
    }
}
