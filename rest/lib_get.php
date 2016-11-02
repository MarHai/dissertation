<?php

/**
 * TOC
 * - latest
 * - find/{sQuery}
 * - ping
 * - mention/{nUid} setup mentions post-hoc for given nSnsId and return mentions
 * + list all from one table
 *   - media
 *   - sns
 * + get specific entry from one table including its children
 *   - article/{nArtId}
 *   - media/{nMedId}
 *   - homepage/{nHomId}
 *   - highlight/{nHigId}
 *   - sns/{nSnsId}
 *   - post/{nPosId}
 * */




/**
 * Retrieve a list of URLs which are necessary to be traced at this point.
 * Relies on the setting on how long to follow URLs.
 * */
$oApp->get('/latest', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $aData = [];
        if(($oResult = query('SELECT nArtId, sUrl, m.*
                              FROM article a
                                LEFT JOIN media m ON (a.nMedId = m.nMedId)
                              WHERE m.bActive AND a.dCreate > '.(time() - URL_FOLLOW)))) {
            
            if($oResult->num_rows > 0) {
                while(($aRow = $oResult->fetch_assoc())) {
                    $aData[] = $aRow;
                }
            }
        }
        return $_oResponse->write(json($aData));
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});



/**
 * Search for all kinds of data (everywhere, basically, where full-text search makes sense).
 * */
$oApp->get('/find/{sQuery}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sQuery = trim(strtolower($_aArg['sQuery']));
        if($sQuery != '') {
            $sQuery = ' LIKE \'%'.$sQuery.'%\'';
            $aData = [
                'article' => get('article', 'sUrl'.$sQuery),
                'media' => get('media', [ 'sName'.$sQuery, 'sHomepageUrl'.$sQuery, 'sHighlightUrl'.$sQuery ], TRUE),
                'sns' => get('sns', [ 'sPlatformName'.$sQuery, 'eType'.$sQuery ], TRUE)
            ];
            return $_oResponse->write(json($aData));
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});



/**
 * Get statistical information about PINGs. Incluces the latest ping, overall count of pings, mean and SD ping time (per ping type).
 * */
$oApp->get('/ping', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $aData = [];
        if(($oResult = query('SELECT a.*, COUNT(c.nPinId) AS nCount, ROUND(AVG(c.nTime)) AS nMean, ROUND(STDDEV(c.nTime)) AS nStdDev
                              FROM `ping` a
                                LEFT JOIN `ping` b ON a.dCreate < b.dCreate AND a.sSource = b.sSource
                                LEFT JOIN `ping` c ON a.sSource = c.sSource
                              WHERE b.nPinId IS NULL
                              GROUP BY a.sSource'))) {
            if($oResult->num_rows > 0) {
                while(($aRow = $oResult->fetch_assoc())) {
                    $aData[$aRow['sSource']] = $aRow;
                }
            }
        }
        return $_oResponse->write(json($aData));
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});



/**
 * Get statistical information about latest fetches and the like.
 * */
$oApp->get('/status', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $aData = [];
        foreach([ 'homepage', 'highlight', 'article' ] as $sType) {
            $aData[$sType] = [];
            $sPrimary = extractPrimaryKey($sType);
            if(($oResult = query('SELECT m.sName, a.'.$sPrimary.', a.dCreate AS dLatest, COUNT(c.'.$sPrimary.') AS nCount
                                 FROM `'.$sType.'` a
                                     LEFT JOIN `'.$sType.'` b ON a.dCreate < b.dCreate AND a.nMedId = b.nMedId
                                     LEFT JOIN `'.$sType.'` c ON a.nMedId = c.nMedId,
                                   `media` m
                                 WHERE b.'.$sPrimary.' IS NULL AND a.nMedId = m.nMedId
                                 GROUP BY a.nMedId'))) {
                if($oResult->num_rows > 0) {
                    while(($aRow = $oResult->fetch_assoc())) {
                        $aData[$sType][$aRow['sName']] = $aRow;
                    }
                }
            }
        }
        return $_oResponse->write(json($aData));
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});




/**
 * Retrieve all entries from one specific table.
 * */
$oApp->get('/{sTable}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sTable = trim(strtolower($_aArg['sTable']));
        if(in_array($sTable, [ 'media', 'sns' ])) {
            $aData = [];
            if($sTable == 'sns') {
                if(($oResult = query('SELECT a.*, b.bActive AS bActiveMedia, MAX(c.dCreate) AS dLastFetch, MAX(c.sPostId) AS sLastId
                                      FROM `sns` a
                                          LEFT JOIN `post` c ON (c.nSnsId = a.nSnsId),
                                        `media` b
                                      WHERE a.nMedId = b.nMedId
                                      GROUP BY a.nSnsId'))) {
                    if($oResult->num_rows > 0) {
                        while(($aRow = $oResult->fetch_assoc())) {
                            $aData[] = $aRow;
                        }
                    }
                }
            } else {
                $aData = get($sTable);
            }
            return $_oResponse->write(json($aData));
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});




/**
 * Retrieve remaining sub entries.
 * */
$oApp->get('/{sTable}/{nUid}/many/{sTableSub}/more/{nStartIndex}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sTable = trim(strtolower($_aArg['sTable']));
        $nUid = intval($_aArg['nUid']);
        if($nUid > 0 && in_array($sTable, [ 'article', 'media', 'homepage', 'highlight', 'sns', 'post', 'post_mention' ])) {
            $aTable = getOne($sTable, $nUid);
            if($aTable !== NULL) {
                $aData = [];
                $sTableSub = trim(strtolower($_aArg['sTableSub']));
                switch($sTable) {
                    case 'media':
                        if(in_array($sTableSub, [ 'homepage', 'highlight', 'article' ])) {
                            if(($oResult = query(get($sTableSub, extractPrimaryKey($sTable).' = '.$nUid, FALSE, TRUE).' LIMIT '.intval($_aArg['nStartIndex']).', 20'))) {
                                $aData[$sTableSub] = [];
                                if($oResult->num_rows > 0) {
                                    while(($aRow = $oResult->fetch_assoc())) {
                                        $aData[$sTableSub][] = $aRow;
                                    }
                                }
                            }
                        }
                        break;
                }
                return $_oResponse->write(json($aData));
            }
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});




/**
 * Retrieve one specific entry including its children and parent(s).
 * */
$oApp->get('/{sTable}/{nUid}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sTable = trim(strtolower($_aArg['sTable']));
        $nUid = intval($_aArg['nUid']);
        if($nUid > 0 && in_array($sTable, [ 'article', 'media', 'homepage', 'highlight', 'sns', 'post', 'post_mention' ])) {
            $aTable = getOne($sTable, $nUid);
            if($aTable !== NULL) {
                $aData = [ $sTable => $aTable ];
                switch($sTable) {
                    case 'article':
                        $aData['media'] = getOne('media', 'nMedId = '.$aData[$sTable]['nMedId']);
                        $aData['popularity'] = get('popularity', 'nArtId = '.$nUid);
                        $aData['post_mention'] = get('post_mention', 'nArtId = '.$nUid);
                        $aData['update'] = get('update', 'nArtId = '.$nUid);
                        $aData['homepage_ranking'] = get('homepage_ranking', 'nArtId = '.$nUid);
                        $aData['highlight_ranking'] = get('highlight_ranking', 'nArtId = '.$nUid);
                        break;
                    case 'media':
                        $aData['sns'] = get('sns', 'nMedId = '.$nUid);
                        $aData['homepage'] = getMany('homepage', 'nMedId = '.$nUid);
                        $aData['highlight'] = getMany('highlight', 'nMedId = '.$nUid);
                        $aData['article'] = getMany('article', 'nMedId = '.$nUid);
                        break;
                    case 'homepage':
                        $aData['media'] = getOne('media', 'nMedId = '.$aData[$sTable]['nMedId']);
                        $aData['homepage_ranking'] = get('homepage_ranking', 'nHomId = '.$nUid);
                        break;
                    case 'highlight':
                        $aData['media'] = getOne('media', 'nMedId = '.$aData[$sTable]['nMedId']);
                        $aData['highlight_ranking'] = get('highlight_ranking', 'nHigId = '.$nUid);
                        break;
                    case 'sns':
                        $aData['media'] = getOne('media', 'nMedId = '.$aData[$sTable]['nMedId']);
                        $aData['post'] = get('post', 'nSnsId = '.$nUid);
                        break;
                    case 'post':
                        $aData['sns'] = getOne('sns', 'nSnsId = '.$aData[$sTable]['nSnsId']);
                        $aData['post_mention'] = get('post_mention', 'nPosId = '.$nUid);
                        break;
                    case 'post_mention':
                        $aData['post'] = getOne('post', 'nPosId = '.$aData[$sTable]['nPosId']);
                        $aData['article'] = getOne('article', 'nArtId = '.$aData[$sTable]['nArtId']);
                        break;
                }
                return $_oResponse->write(json($aData));
            }
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});

?>