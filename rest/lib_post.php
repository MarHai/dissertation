<?php

/**
 * TOC
 * - update (treated specially as it has to check whether update is really an update)
 * - image (treated specially as it has to download an image and compare its MD5 to the prior image)
 * + add new entries for all tables
 *   - media
 *   - sns
 *   - ...
 * + add a found URL incl. its ranking resulting in either a new article or an existing article's new ranking
 *   - homepage
 *   - highlight
 * */



/**
 * Add a new update.
 * Checks whether latest update is equal to currently posted one. If so, no new update is created.
 */
$oApp->post('/update', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        //fill aSet
        $aSet = [];
        foreach($_oRequest->getParsedBody() as $sInsertKey => $mValue) {
            $aSet[$sInsertKey] = prepareInput($sInsertKey, $mValue);
        }
        if(isset($aSet['nArtId']) && isset($aSet['sType']) && isset($aSet['sValue'])) {
            global $oDb;
            $bInsert = TRUE;
            //find latest update
            $aUpdate = get('update', [ 'nArtId = '.$aSet['nArtId'], 'sType = '.$aSet['sType'] ]);
            if(count($aUpdate) > 0) {
                $sLatestValue = '';
                $dLatest = 0;
                foreach($aUpdate as $aRow) {
                    if($aRow['dCreate'] > $dLatest) {
                        $dLatest = $aRow['dCreate'];
                        $sLatestValue = $aRow['sValue'];
                    }
                }
                if(prepareInput('sValue', $sLatestValue) == $aSet['sValue']) {
                    $bInsert = FALSE;
                }
            }
            if($bInsert) {
                $sSql = sprintf('INSERT INTO `update` (nArtId, sType, sValue, dCreate) VALUES(%s)', 
                                implode(', ', [ $aSet['nArtId'], $aSet['sType'], $aSet['sValue'], time() ]));
                if(($oResult = query($sSql))) {
                    return $_oResponse->write(json(getOne('update', $oDb->insert_id)));
                } else {
                    return $_oResponse->withStatus(500)->write('Database error on insert.');
                }
            } else {
                return $_oResponse->write(json([]));
            }
        } else {
            return $_oResponse->withStatus(406)->write('Not enough data provided.');
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});






/**
 * Add an (updated) image.
 * Checks whether latest update is equal to currently posted one. If so, no new update is created.
 */
$oApp->post('/image', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        //fill aSet
        $aSet = [];
        $sUrl = '';
        foreach($_oRequest->getParsedBody() as $sInsertKey => $mValue) {
            if($sInsertKey == 'sValue') {
                $sUrl = $mValue;
            } else {
                $aSet[$sInsertKey] = prepareInput($sInsertKey, $mValue);
            }
        }
        if(isset($aSet['nArtId']) && $sUrl != '') {
            global $oDb;
            //prefix URL if necessary
            if(substr($sUrl, 0, 4) !== 'http') {
                $aArticle = getOne('article', intval($aSet['nArtId']));
                if($aArticle !== NULL) {
                    $aMedia = getOne('media', intval($aArticle['nMedId']));
                    if($aMedia !== NULL) {
                        $sPrefixUrl = trim($aMedia['sPrefixUrl']);
                        if($sPrefixUrl != '') {
                            if(substr($sPrefixUrl, -1) == '/' && $sUrl{0} == '/') {
                                $sUrl = $sPrefixUrl.substr($sUrl, 1);
                            } else {
                                $sUrl = $sPrefixUrl.$sUrl;
                            }
                        }
                    }
                }
            }
            //create image folder if necessary
            $sDir = PATH_IMG.$aSet['nArtId'].'/';
            if(!is_dir($sDir)) {
                @mkdir($sDir);
            }
            if(is_dir($sDir) && is_writable($sDir)) {
                $aURL = explode('.', strrev($sUrl), 2);
                $sFile = time().'.'.(count($aURL) > 1 && strlen($aURL[0]) < 5 ? strtolower(strrev($aURL[0])) : 'png');
                //download the image
                $oCurl = @curl_init($sUrl);
                @curl_setopt($oCurl, CURLOPT_RETURNTRANSFER, TRUE);
                @curl_setopt($oCurl, CURLOPT_VERBOSE, TRUE);
                @curl_setopt($oCurl, CURLOPT_HEADER, TRUE);
                @curl_setopt($oCurl, CURLOPT_FOLLOWLOCATION, TRUE);
                @curl_setopt($oCurl, CURLOPT_SSL_VERIFYPEER, FALSE);
                @curl_setopt($oCurl, CURLOPT_SSL_VERIFYSTATUS, FALSE);
                $sImage = @curl_exec($oCurl);
                $sImageHeaderSize = @curl_getinfo($oCurl, CURLINFO_HEADER_SIZE);
                $sImageHeader = substr($sImage, 0, $sImageHeaderSize);
                $mImageHeaderFilenamePosition = strpos($sImageHeader, 'filename=');
                if($mImageHeaderFilenamePosition > 0) {
                    list($sFileNew) = explode(chr(10), substr($sImageHeader, $mImageHeaderFilenamePosition + 9));
                    $sFileNew = preg_replace('/[^a-zA-Z0-9-_.]/', '', $sFileNew);
                    if(strpos($sFileNew, '.') !== FALSE) {
                        $sFile = $sFileNew;
                    }
                }
                $sImage = substr($sImage, $sImageHeaderSize);
                if($sImage != '') {
                    if(file_exists($sDir.$sFile)) {
                        list($sFileExtRev, $sFileNameRev) = explode('.', strrev($sFile), 2);
                        $sFile = strrev($sFileNameRev).'.'.microtime(TRUE).'.'.strrev($sFileExtRev);
                    }
                    @file_put_contents($sDir.$sFile, $sImage);
                }
                if(file_exists($sDir.$sFile)) {
                    //get MD5 hashes
                    $sImageHash = md5_file($sDir.$sFile);
                    $sImageHashPriorImage = '';
                    if(($oResult = query('SELECT sImageHash FROM `update` WHERE 
                                              `update`.nArtId = '.$aSet['nArtId'].' AND 
                                              `update`.sType = "Image" 
                                            ORDER BY dCreate DESC
                                            LIMIT 1'))) {
                        
                        if($oResult->num_rows > 0) {
                            $aRow = $oResult->fetch_assoc();
                            $sImageHashPriorImage = $aRow['sImageHash'];
                        }
                    }
                    if($sImageHashPriorImage == $sImageHash) {
                        //hashes equal, delete image
                        @unlink($sDir.$sFile);
                    } else {
                        //new image has been used, save to DB
                        $sSql = sprintf('INSERT INTO `update` (nArtId, sType, sValue, sImageHash, dCreate) VALUES(%s)', 
                                        implode(', ', [ $aSet['nArtId'], prepareInput('sType', 'Image'), prepareInput('sValue', $sFile), prepareInput('sImageHash', $sImageHash), time() ]));
                        if(($oResult = query($sSql))) {
                            return $_oResponse->write(json(getOne('update', $oDb->insert_id)));
                        } else {
                            return $_oResponse->withStatus(500)->write('Database error on insert.');
                        }
                    }
                }
            }
            return $_oResponse->write(json([]));
        } else {
            return $_oResponse->withStatus(406)->write('Not enough data provided.');
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});



/**
 * Add a new entry to a table.
 */
$oApp->post('/{sTable}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sTable = addslashes(trim($_aArg['sTable']));
        $sPrimary = extractPrimaryKey($sTable);
        $aColumn = getColumnNames($sTable);
        //in order to check if all fields are filled in, count the columns (-primary, -update)
        $nColumnsToFill = count($aColumn) - 1;
        if(in_array('dUpdate', $aColumn)) {
            $nColumnsToFill--;
        }
        //now fill aSet (which can later be compared with nColumnsToFill)
        $aSet = [ 'dCreate' => time() ];
        foreach($_oRequest->getParsedBody() as $sInsertKey => $mValue) {
            if(in_array($sInsertKey, getColumnNames($sTable)) && !in_array($sInsertKey, [ $sPrimary, 'dUpdate' ])) {
                $aSet[$sInsertKey] = prepareInput($sInsertKey, $mValue);
            }
        }
        if(count($aSet) == $nColumnsToFill) {
            global $oDb;
            //now, if we want to insert a post let's first check if we might already have that one
            if($sTable == 'post' && isset($aSet['sPostId'])) {
                $aPost = getOne('post', 'sPostId = '.$aSet['sPostId']);
                if($aPost !== NULL) {
                    return $_oResponse->write(json($aPost));
                }
            }
            //let's go on INSERTing
            $sSql = sprintf('INSERT INTO `%s` (%s) VALUES(%s)', $sTable, implode(', ', array_keys($aSet)), implode(', ', array_values($aSet)));
            if(($oResult = query($sSql))) {
                return $_oResponse->write(json(getOne($sTable, $oDb->insert_id)));
            } else {
                return $_oResponse->withStatus(500)->write('Database error on insert.');
            }
        } else {
            return $_oResponse->withStatus(406)->write('Not enough data provided.');
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});



/**
 * Add a found URL on either hightlight, homepage, or post, which may either result in a new article or an existing article's new ranking.
 * All articles are verified against base URL (if set).
 * If used with 'post', a mention to a given post (nPosId in submitted body) is created. Also, mentions are unique whereas rankings can occur more often.
 * Body needs to include sUrl, nMedId (for newly created articles), nValue (for highlight/homepage), and nPosId/nHigId/nHomId for the connection.
 */
$oApp->post('/url/{sType}', function($_oRequest, Psr\Http\Message\ResponseInterface $_oResponse, array $_aArg) {
    if(login($_oRequest)) {
        $sType = addslashes(trim($_aArg['sType']));
        if(in_array($sType, [ 'highlight', 'homepage', 'post' ])) {
            $sPrimary = extractPrimaryKey($sType);
            $aColumn = getColumnNames($sType);
            $sUrl = '';
            $aSet = [ 'dCreate' => time() ];
            foreach($_oRequest->getParsedBody() as $sInsertKey => $mValue) {
                $aSet[$sInsertKey] = prepareInput($sInsertKey, $mValue);
                if($sInsertKey == 'sUrl') {
                    $sUrl = $mValue;
                }
            }
            if(isset($aSet['sUrl']) && isset($aSet['nMedId'])) {
                global $oDb;
                //find base URL
                $aMedia = getOne('media', intval($aSet['nMedId']));
                if($aMedia !== NULL) {
                    $sPrefixUrl = trim($aMedia['sPrefixUrl']);
                    if($sPrefixUrl != '' && substr($sUrl, 0, 4) !== 'http') {
                        $aSet['sUrl'] = prepareInput('sUrl', $sPrefixUrl.$sUrl);
                    }
                    $sBaseUrl = trim($aMedia['sBaseUrl']);
                    if($sBaseUrl == '' || strpos($aSet['sUrl'], $sBaseUrl) !== FALSE) {
                        //find nArtId for according URL (or create the article and use the new nArtId)
                        $aArticle = getOne('article', 'sUrl = '.$aSet['sUrl']);
                        if($aArticle !== NULL) {
                            $aSet['nArtId'] = prepareInput('nArtId', $aArticle['nArtId']);
                        } else {
                            if(($oResult = query('INSERT INTO `article` (nMedId, sUrl, dCreate) VALUES('.
                                                 implode(', ', [ $aSet['nMedId'], $aSet['sUrl'], $aSet['dCreate'] ]).')'))) {

                                $aSet['nArtId'] = prepareInput('nArtId', $oDb->insert_id);
                            } else {
                                return $_oResponse->withStatus(500)->write('Database error on insert.');
                            }
                        }
                        //add ranking or mention
                        $sSql = '';
                        if($sType == 'post') {
                            $sType .= '_mention';
                            $aPostMention = get($sType, [ 'nArtId = '.$aSet['nArtId'], $sPrimary.' = '.$aSet[$sPrimary] ]);
                            if(count($aPostMention) > 0) {
                                return $_oResponse->write(json($aPostMention));
                            } else {
                                $sSql = sprintf('INSERT INTO `%s` (nArtId, %s, dCreate) VALUES(%s)', $sType, $sPrimary, 
                                                 implode(', ', [ $aSet['nArtId'], $aSet[$sPrimary], $aSet['dCreate'] ]));
                            }
                        } else {
                            $sType .= '_ranking';
                            $sSql = sprintf('INSERT INTO `%s` (nArtId, %s, nValue, dCreate) VALUES(%s)', $sType, $sPrimary, 
                                             implode(', ', [ $aSet['nArtId'], $aSet[$sPrimary], $aSet['nValue'], $aSet['dCreate'] ]));
                        }
                        if(($oResult = query($sSql))) {
                            return $_oResponse->write(json(getOne($sType, $oDb->insert_id)));
                        } else {
                            return $_oResponse->withStatus(500)->write('Database error on insert.');
                        }
                    }
                }
                return $_oResponse->withStatus(406)->write('Not acceptable due to mismatch between given URL and configured base URL.');
            } else {
                return $_oResponse->withStatus(406)->write('Not enough data provided.');
            }
        }
    }
    return $_oResponse->withStatus(405)->write('Method not allowed.');
});
            
?>