<?php


App::uses('Controller', 'Controller');

class LeafletController extends AppController {
    public $uses = array(
        'City'
    );
    
    public function uncover_tiles(){
        
    }
    
    public function find_train_station(){
        
    }
    
    public function enemies(){
        
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
}
