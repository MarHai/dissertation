<?php

require_once('config.php');

/**
 * Reads latest pings from API. Sends a report if problematic.
 *
 * Process:
 * * contact API and ask for ping
 * * check pings against PING_THRESHOLD (in seconds)
 * * send an email in case of worry
 */


//contact API and ask for ping
$sUrl = 'http://rest-server.foo.bar/ping';
$sNonce = md5(rand().rand().rand());
$sSignature = hash_hmac('sha1', $sUrl.$sNonce, ADMIN_PASSWORD);
$sApiPing = file_get_contents($sUrl, FALSE, stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'X-Authorization: Digest nonce="'.$sNonce.'",method="sha1",signature="'.$sSignature.'"'
    ]
]));



//check pings against PING_THRESHOLD (in seconds)
$aError = [];
if($sApiPing) {
    if(($aApiPing = json_decode($sApiPing, TRUE))) {
        foreach($aApiPing as $sKey => $aData) {
            if($aData['dCreate'] < (time() - PING_THRESHOLD)) {
                $aError[] = $aData['sSource'].' wurde zuletzt am/um '.date('m.d.Y H:i', $aData['dCreate']).' erfolgreich durchgeführt und dauerte '.round($aData['nTime']/1000, 1).' Sekunden (Mittelwert: '.round($aData['nMean']/1000, 1).'; N = '.$aData['nCount'].').';
            }
        }
    } else {
        $aError[] = 'Der Rückgabewert der API ist merkwürdig. Er lautet: '.$sApiPing;
    }
} else {
    $aError[] = 'Der API-Aufruf ist irgendwie schiefgelaufen.';
}



//send an email in case of worry
if(count($aError) > 0) {
    @mail(
        'haim@ifkw.lmu.de',
        '=?UTF-8?B?'.base64_encode('[DissMonitor] PING-Status besorgniserregend').'?=',
        'Hallo,'.chr(10).chr(10).
        'ich bin auf Ungereimtheiten gestoßen, als ich gerade nach dem PING-Status geschaut habe:'.chr(10).chr(10).
        '>> '.implode(chr(10).'>> ', $aError).chr(10),
        implode(chr(10), [
            'From: DissMonitor <mario@haim.it>',
            'X-Mailer: PHP/'.phpversion(),
            'MIME-Version: 1.0',
            'Content-type: text/plain; charset=utf-8',
            'Content-Transfer-Encoding: 7bit'
        ])
    );
}

?>