<?php

class DATABASE_CONFIG {

	public $default = array(
        'datasource' => 'Database/Mysql',
        'persistent' => false,
        'host' => 'dev.ivanatora.info',
        'login' => 'osm_game',
        'password' => '2GwPtc66TfsYfASG',
        'database' => 'osm_game',
        'prefix' => '',
        'encoding' => 'utf8',
    );
        
    public $test = array(
        'datasource' => 'Database/Mysql',
        'persistent' => false,
        'host' => 'localhost',
        'login' => 'user',
        'password' => 'password',
        'database' => 'test_database_name',
        'prefix' => '',
            //'encoding' => 'utf8',
    );

}
