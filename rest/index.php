<?php

require_once('./vendor/autoload.php');
require_once('./config.php');

$oApp = new \Slim\App();
$oApp->add(new \Bairwell\MiddlewareCors([
    'origin' => '*',
    'allowHeaders' => [ 'Accept', 'Content-type', 'X-Authorization' ],
    'allowMethods' => [ 'GET', 'POST', 'PUT' ]
]));

$aCacheColumn = [];
$bLogin = FALSE;
$oDb = NULL;

include_once('./functions.php');

include_once('./lib_get.php');
include_once('./lib_post.php');
include_once('./lib_put.php');

$oApp->any('/', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        return $_oResponse->withStatus(404)->write('Method not found.');
    } else {
        return $_oResponse->withStatus(405)->write('No valid authentication provided.');
    }
});

$oApp->run();

?>