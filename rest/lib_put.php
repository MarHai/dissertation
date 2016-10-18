<?php

/**
 * TOC
 * + update single entries
 *   - media/{nUid}
 *   - sns/{nUid}
 * */


/**
 * Update an entry within a table.
 */
$oApp->put('/{sTable}/{nUid}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sTable = addslashes(trim($_aArg['sTable']));
        if(in_array($sTable, [ 'media', 'sns' ])) {
            $sPrimary = extractPrimaryKey($sTable);
            $nPrimary = intval($_aArg['nUid']);
            $aEntry = getOne($sTable, $nPrimary);
            if($aEntry !== NULL) {
                $aUpdate = $_oRequest->getParsedBody();
                $aSet = [ 'dUpdate = '.time() ];
                foreach($aUpdate as $sUpdateKey => $mValue) {
                    if(array_key_exists($sUpdateKey, $aEntry) && !in_array($sUpdateKey, [ $sPrimary, 'dCreate', 'dUpdate' ])) {
                        $aSet[] = sprintf('`%s` = %s', $sUpdateKey, prepareInput($sUpdateKey, $mValue));
                    }
                }
                query(sprintf('UPDATE `%s` SET %s WHERE `%s` = %u LIMIT 1', $sTable, implode(', ', $aSet), $sPrimary, $nPrimary));
                return $_oResponse->write(json(getOne($sTable, $nPrimary)));
            } else {
                return $_oResponse->withStatus(405)->write('Invalid ID.');
            }
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});

?>