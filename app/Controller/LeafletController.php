<?php


App::uses('Controller', 'Controller');

class LeafletController extends AppController {
    public $uses = array(
        'City', 'Score'
    );
    
    public function uncover_tiles(){
        
    }
    
    public function find_train_station(){
        
    }
    
    public function enemies(){
        $this->_getScores();
    }
    
    public function pursuit(){
        $this->_getScores();
    }
    
    public function warp(){
        $this->_getScores();
    }
    
    public function roadster(){
        $this->_getScores();
    }
    
    public function buildings() {
        
    }
    
    public function dijkstra() {
        
    }
    
    public function get_random_city(){
        $sLat = $this->getQueryVal('lat');
        $sLon = $this->getQueryVal('lon');
        
        if ($sLat && $sLon){
            $sLat = (float) $sLat;
            $sLon = (float) $sLon;
            $tmp = $this->City->query('SELECT
                id, (
                  6371 * acos (
                    cos ( radians('.$sLat.') )
                    * cos( radians( lat ) )
                    * cos( radians( lon ) - radians('.$sLon.') )
                    + sin ( radians('.$sLat.') )
                    * sin( radians( lat ) )
                  )
                ) AS distance
              FROM cities
              WHERE is_active = 1
              ORDER BY distance LIMIT 1');
            
            if ($tmp){
                $tmp = $this->City->findById($tmp[0]['cities']['id']);
            }
        }
        else {
            $tmp = $this->City->find('first', array(
                'order' => 'RAND()'
            ));
        }
        
        $data = array(
            'success' => true,
            'data' => $tmp['City'],
        );
        $this->layout = 'ajax';
        $this->set('data', $data);
        $this->render('/Site/Common/JsonResponse');
    }
    
    public function update_city(){
        $aUpdateData = $this->params->data;
        $this->City->save($aUpdateData);
        
        $data = array(
            'success' => true,
        );
        $this->layout = 'ajax';
        $this->set('data', $data);
        $this->render('/Site/Common/JsonResponse');
    }
    
    public function get_cities_by_box(){
        $sWest = $this->getQueryVal('west');
        $sEast = $this->getQueryVal('east');
        $sNorth = $this->getQueryVal('north');
        $sSouth = $this->getQueryVal('south');
        
        $aConditions = array(
            'City.lon >' => $sWest,
            'City.lon <' => $sEast,
            'City.lat <' => $sNorth,
            'City.lat >' => $sSouth,
        );
        
        $tmp = $this->City->find('all', array(
            'conditions' => $aConditions
        ));
        lm('konds '.print_r($aConditions, true). ' tmp '.print_r($tmp, true));
        $result = array();
        foreach ($tmp as $item){
            $result[] = $item['City'];
        }
        
        
        $data = array(
            'success' => true,
            'data' => $result
        );
        $this->layout = 'ajax';
        $this->set('data', $data);
        $this->render('/Site/Common/JsonResponse');
    }
    
    public function _getScores(){
        $tmp = $this->Score->find('all', array(
            'order' => 'Score.created DESC'
        ));
        $this->set('scores', $tmp);
    }
}
