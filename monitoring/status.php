<?php

require_once('config.php');

/**
 * Reads latest pings from API. Sends a report if problematic.
 *
 * Process:
 * * contact API and ask for ping
 * * check pings against PING_THRESHOLD (in seconds)
 * * check whether last ping deviates in duration from average ping
 * * contact API and check for last homepage/highlight creation
 * * send an email in case of worry
 */


//contact API and ask for ping
$sUrl = 'https://diss.haim.it/ping';
$sNonce = md5(rand().rand().rand());
$sSignature = hash_hmac('sha1', $sUrl.$sNonce, ADMIN_PASSWORD);
$sApiPing = file_get_contents($sUrl, FALSE, stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'X-Authorization: Digest nonce="'.$sNonce.'",method="sha1",signature="'.$sSignature.'"'
    ]
]));



$aError = [];
$sSubject = 'Statusbericht konnte nicht erstellt werden';


//check pings against PING_THRESHOLD (in seconds) and whether it deviates more than PING_SDTHRESHOLD SD from average ping duration
if($sApiPing) {
    if(($aApiPing = json_decode($sApiPing, TRUE))) {
        foreach($aApiPing as $sKey => $aData) {
            //standard deviation
            if($aData['nTime'] < ($aData['nMean'] - (PING_SDTHRESHOLD*$aData['nStdDev']))) {
                $aError[] = $aData['sSource'].' zeigt auffälliges Verhalten, insofern die Dauer zuletzt ('.round($aData['nTime']/1000, 1).' Sekunden) um mehr als '.PING_SDTHRESHOLD.' Standardabweichung (M = '.round($aData['nMean']/1000, 1).'; SD = '.round($aData['nStdDev']/1000, 1).') kürzer war als der restliche Durchschnitt.';
            }
            //ping threshold
            if($aData['dCreate'] < (time() - PING_THRESHOLD)) {
                $aError[] = $aData['sSource'].' wurde zuletzt am/um '.date('m.d.Y H:i', $aData['dCreate']).' erfolgreich durchgeführt und dauerte '.round($aData['nTime']/1000, 1).' Sekunden (Mittelwert: '.round($aData['nMean']/1000, 1).'; N = '.$aData['nCount'].').';
                $sSubject = 'Keine aktuellen PING-Daten für '.$aData['sSource'];
            }
        }
    } else {
        $aError[] = 'Der Rückgabewert der API ist merkwürdig. Er lautet: '.$sApiPing;
    }
} else {
    $aError[] = 'Der API-Aufruf ist irgendwie schiefgelaufen.';
}



//contact API and check for last homepage/highlight creation
$sUrl = 'https://diss.haim.it/status';
$sSignature = hash_hmac('sha1', $sUrl.$sNonce, ADMIN_PASSWORD);
$sApiPing = file_get_contents($sUrl, FALSE, stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'X-Authorization: Digest nonce="'.$sNonce.'",method="sha1",signature="'.$sSignature.'"'
    ]
]));
if($sApiPing) {
    if(($aApiPing = json_decode($sApiPing, TRUE))) {
        foreach($aApiPing as $sType => $aTypeList) {
            foreach($aTypeList as $sKey => $aData) {
                if(isset(CREATE_THRESHOLD[$sType])) {
                    if($aData['dLatest'] < (time() - CREATE_THRESHOLD[$sType])) {
                        $sTimeDiff = round((time() - $aData['dLatest'])/60, 1);
                        if($sTimeDiff > 100) {
                            $sTimeDiff = round($sTimeDiff/60, 1).' Stunden';
                        } else {
                            $sTimeDiff .= ' Minuten';
                        }
                        $aError[] = 'Es wurde schon seit '.$sTimeDiff.' kein Eintrag für '.$sType.' von '.$sKey.' mehr erstellt. Insgesamt gibt es aktuell '.$aData['nCount'].' Einträge für '.$sType.'/'.$sKey.'.';
                        $sSubject = 'Keine aktuellen '.$sType.'-Daten für '.$sKey;
                    }
                }
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
    $aOpener = [
            'Hallo,'.chr(10).chr(10).'ich bin auf Ungereimtheiten gestoßen, als ich gerade nach dem Status geschaut habe:',
            'Moin,'.chr(10).chr(10).'da läuft gerade etwas schief. Schau mal hier:',
            'Hi,'.chr(10).chr(10).'die Dissertation läuft gerade etwas aus dem Ruder ... Folgendes:',
            'Servus,'.chr(10).chr(10).'mogst amoi einischaun in des Gsocks:',
            'Guten Tag,'.chr(10).chr(10).'gerade ist mir etwas aufgefallen, als ich sicherstellen wollte, dass mit der Erhebung der Dissertation alles ordnungsgemäß abläuft:',
            'Entschuldige kurz,'.chr(10).chr(10).'aber deine Diss geht gerade in die Binsen!!1! Ja, Panik! Aaaaaahhh!1!elf!!',
            'Huhu,'.chr(10).chr(10).'guckst du hier:'
        ];
    @mail(
        'haim@ifkw.lmu.de',
        '=?UTF-8?B?'.base64_encode('[DissMonitor] '.$sSubject).'?=',
        $aOpener[array_rand($aOpener, 1)].chr(10).chr(10).
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