<?php
/**
 * Application level Controller
 *
 * This file is application-wide controller file. You can put all
 * application-wide controller-related methods here.
 *
 * CakePHP(tm) : Rapid Development Framework (http://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (http://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (http://cakefoundation.org)
 * @link          http://cakephp.org CakePHP(tm) Project
 * @package       app.Controller
 * @since         CakePHP(tm) v 0.2.9
 * @license       http://www.opensource.org/licenses/mit-license.php MIT License
 */

App::uses('Controller', 'Controller');

/**
 * Application Controller
 *
 * Add your application-wide methods in the class below, your controllers
 * will inherit them.
 *
 * @package		app.Controller
 * @link		http://book.cakephp.org/2.0/en/controllers.html#the-app-controller
 */
class AppController extends Controller {
    
    public function getQueryVal($sKey, $sDefault = null){
        if (isset($this->params->query[$sKey]) && $this->params->query[$sKey] != ''){
            return $this->params->query[$sKey];
        }
        if (isset($this->params->data[$sKey]) && $this->params->data[$sKey] != ''){
            return $this->params->data[$sKey];
        }
        if (isset($this->params['named'][$sKey]) && $this->params['named'][$sKey] != ''){
            return $this->params['named'][$sKey];
        }
        else return $sDefault;
    }
}
