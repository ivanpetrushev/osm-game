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
    
    public function get_random_city(){
        $tmp = $this->City->find('first', array(
            'order' => 'RAND()'
        ));
        
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
