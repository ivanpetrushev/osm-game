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
    
    public function buildings() {
        
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
              ORDER BY distance LIMIT 1');
            lm("GOT: " . print_r($tmp, true));
            
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
    
    public function _getScores(){
        $tmp = $this->Score->find('all', array(
            'order' => 'Score.created DESC'
        ));
        $this->set('scores', $tmp);
    }
}
