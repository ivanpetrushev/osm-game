<?php
App::uses('Controller', 'Controller');

class ScoreController extends AppController {
    public $uses = array(
        'Score'
    );
    
    public function update(){
        $aUpdateData = $this->params->data;
        $aUpdateData['player_ip'] = $_SERVER['REMOTE_ADDR'];
        $this->Score->create();
        $this->Score->save($aUpdateData);
        
        header('Location: '.$this->referer());
        exit();
    }
}
