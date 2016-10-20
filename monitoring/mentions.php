<?php

require_once('config.php');

/**
 * Runs through posts and sets up mentions of articles if not set up yet.
 *
 * In this file's upper part, some functions are defined (copy-pasted from the REST's functions.php).
 *
 * Process:
 * * fetch some not-yet-mentioned posts
 * * check if they have URLs (if it's shortened URLs, HEAD-request the extended version)
 * * check for corresponding articles and set up the links (i.e., post_mention)
 * * send an email in case of error
 */


/**
 * Execute an SQL statement. If no connection has been initiated before, initiate it first.
 * 
 * @param  string $_sSql statement to be executed
 * @return mixed  depends on statement, see http://php.net/manual/en/mysqli.query.php
 */
function query($_sSql) {
    global $oDb;
    if($oDb === NULL) {
        $oDb = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        if(!$oDb->connect_error) {
            query('SET NAMES utf8;');
        }
    }
    return $oDb->query($_sSql);
}

/**
 * Get single entry from table.
 * 
 * @param  string  $_sTable                                         @see get
 * @param  mixed   [$_mWhere                                        = NULL]                                @see get
 * @param  boolean [$_bConnectWhereArrayWithOrInsteadOfAnd          = FALSE] @see get
 * @return object  single entry (associative array) or NULL if nothing found
 */
function getOne($_sTable, $_mWhere = NULL, $_bConnectWhereArrayWithOrInsteadOfAnd = FALSE) {
    $aTemp = get($_sTable, $_mWhere, $_bConnectWhereArrayWithOrInsteadOfAnd);
    return count($aTemp) > 0 ? $aTemp[0] : NULL;
}

/**
 * Get data from a huge table. Get the first 25 entries and the total number of entries.
 * 
 * @param  string  $_sTable                                         @see get
 * @param  mixed   [$_mWhere                                        = NULL]                                @see get
 * @param  boolean [$_bConnectWhereArrayWithOrInsteadOfAnd          = FALSE] @see get
 * @return array   associative array with nCntTotal (number indicating the total nr of entries) and aData (@see get)
 */
function getMany($_sTable, $_mWhere = NULL, $_bConnectWhereArrayWithOrInsteadOfAnd = FALSE) {
    $sSqlDefault = get($_sTable, $_mWhere, $_bConnectWhereArrayWithOrInsteadOfAnd, TRUE);
    
    $nCnt = 0;
    if(($oResult = query(str_replace('SELECT *', 'SELECT COUNT(*) AS nCnt', $sSqlDefault)))) {
        $aRowCnt = $oResult->fetch_assoc();
        $nCnt = $aRowCnt['nCnt'];
    }
    
    $aData = [];
    if(($oResult = query($sSqlDefault.' LIMIT 20'))) {
        if($oResult->num_rows > 0) {
            while(($aRow = $oResult->fetch_assoc())) {
                $aData[] = $aRow;
            }
        }
    }
    
    return [
        'nCntTotal' => $nCnt,
        'aData' => $aData
    ];
}



/**
 * Get single or multiple entries from table.
 * Does not resolve any foreign keys or children dependencies.
 * 
 * @param string  $_sTable                                         table name (e.g., article)
 * @param mixed   [$_mWhere                                        = NULL] if set, only table entries where primary key (if int), this where statement (if string), or these where statements (if array, following and/or pattern depending on following param) matches are returned
 * @param boolean [$_bConnectWhereArrayWithOrInsteadOfAnd          = FALSE] if $_mWhere is array, then these where parts are either connected through AND (if true) or OR (if false)
 * @param boolean [$_bReturnSql                                    = FALSE] if TRUE; string SQL is returned instead of actual result
 * @return mixed  array with entries full of associative arrays (if primary is given, still an array with only one row/entry) is returned (if $_bReturnSql is FALSE), string SQL query otherwise
 */
function get($_sTable, $_mWhere = NULL, $_bConnectWhereArrayWithOrInsteadOfAnd = FALSE, $_bReturnSql = FALSE) {
    $_sTable = addslashes(trim($_sTable));
    $aWhere = [];
    if(is_int($_mWhere)) {
        $aWhere[] = sprintf('`%s` = %u', extractPrimaryKey($_sTable), $_mWhere);
    } elseif($_mWhere !== NULL) {
        if(is_array($_mWhere)) {
            if($_bConnectWhereArrayWithOrInsteadOfAnd) {
                $aWhereOrParts = [];
                foreach($_mWhere as $sWhere) {
                    $aWhereOrParts[] = '`'.$_sTable.'`.'.trim($sWhere);
                }
                $aWhere[] = implode(' OR ', $aWhereOrParts);
            } else {
                foreach($_mWhere as $sWhere) {
                    $aWhere[] = '`'.$_sTable.'`.'.trim($sWhere);
                }
            }
        } else {
            $aWhere[] = '`'.$_sTable.'`.'.trim((string)$_mWhere);
        }
    }
    $sSql = sprintf('SELECT * FROM `%s` %s %s ORDER BY `dCreate` DESC', $_sTable, count($aWhere) > 0 ? 'WHERE' : '', implode(' AND ', $aWhere));
    if($_bReturnSql) {
        return $sSql;
    } else {
        if(($oResult = query($sSql))) {
            if($oResult->num_rows > 0) {
                $aReturn = [];
                while(($aRow = $oResult->fetch_assoc())) {
                    $aReturn[] = $aRow;
                }
                return $aReturn;
            }
        }
        return [];
    }
}



/**
 * Prepare a single column to be inserted into the database.
 * 
 * @param  string $_sColumn column name
 * @param  mixed  $_mValue  value
 * @return string prepared value (incl. quotes if necessary)
 */
function prepareInput($_sColumn, $_mValue) {
    if($_mValue === NULL) {
        return 'NULL';
    }
    switch($_sColumn{0}) {
        case 'n':
            return sprintf('%d', intval($_mValue));
        case 'f':
            return sprintf('%.2f', floatval($_mValue));
        case 'b':
            return sprintf('%u', intval($_mValue) == TRUE);
        case 's':
            if(in_array($_sColumn, [ 'sUrl', 'sHomepageUrl', 'sHighlightUrl' ])) {
                $_mValue = prepareURL($_mValue);
            }
        default:
            return sprintf('\'%s\'', addslashes($_mValue));
    }
}




/**
 * Prepare a URL in order to find similar ones.
 * 
 * @param  string $_sUrl input URL
 * @return string prepared URL
 */
function prepareURL($_sUrl) {
    $sUrl = trim($_sUrl);
    if(strlen($sUrl) > 0) {
        //add protocol if necessary
        if(strpos($sUrl, '://') === FALSE) {
            $sUrl = 'http://'.$sUrl;
        }
        //remove ancors if necessary
        if(strpos($sUrl, '#') !== FALSE) {
            list($sUrl) = explode('#', $sUrl, 2);
        }
        //remove after-? marks
        if(strpos($sUrl, '?') !== FALSE) {
            list($sUrl) = explode('?', $sUrl, 2);
        }
    }
    return $sUrl;
}




/**
 * Extract the name of the primary key column based on a given table name.
 * 
 * @param  string $_sTable table name to be used
 * @return string primary key name
 */
function extractPrimaryKey($_sTable) {
    $_sTable = trim($_sTable);
    if(strpos($_sTable, '_') === FALSE) {
        return 'n'.ucfirst(substr($_sTable, 0, 3)).'Id';
    } else {
        return 'n'.ucfirst(substr($_sTable, 0, 2)).strtoupper($_sTable{strpos($_sTable, '_') + 1}).'Id';
    }
}









/***************
 * OFF WE GO
 * *************/

$oDb = NULL;
$aPost = getMany('post', [ 'bThoroughlyCheckedForMentions = 0', 'nPosId NOT IN (SELECT nPosId FROM `post_mention`)' ]);
if($aPost['nCntTotal'] > 0) {
    $dNow = time();
    $aInsertList = [];
    foreach($aPost['aData'] as $aPostSingle) {
        query(sprintf('UPDATE `post` SET bThoroughlyCheckedForMentions = 1 WHERE nPosId = %d', $aPostSingle['nPosId']));
        $aSns = getOne('sns', intval($aPostSingle['nSnsId']));
        if($aSns !== NULL) {
            $aMedia = getOne('media', intval($aSns['nMedId']));
            if($aMedia !== NULL) {
                $aUrl = [];
                switch($aSns['eType']) {
                    case 'Facebook':
                        if(($aPostSingle['aPostMeta'] = json_decode($aPostSingle['sPostMeta'], TRUE))) {
                            if(isset($aPostSingle['aPostMeta']) && isset($aPostSingle['aPostMeta']['link'])) {
                                if($aPostSingle['aPostMeta']['link'] != '') {
                                    $aUrl[] = $aPostSingle['aPostMeta']['link'];
                                }
                            }
                        }
                        break;
                    case 'Twitter':
                        if(($aPostSingle['aPostMeta'] = json_decode($aPostSingle['sPostMeta'], TRUE))) {
                            if(isset($aPostSingle['aPostMeta']) && isset($aPostSingle['aPostMeta']['entities']) && isset($aPostSingle['aPostMeta']['entities']['urls'])) {
                                if(count($aPostSingle['aPostMeta']['entities']['urls']) > 0) {
                                    foreach($aPostSingle['aPostMeta']['entities']['urls'] as $aTwitterUrl) {
                                        if(isset($aTwitterUrl['expanded_url']) && $aTwitterUrl['expanded_url'] != '') {
                                            $aUrl[] = $aTwitterUrl['expanded_url'];
                                        } elseif(isset($aTwitterUrl['url']) && $aTwitterUrl['url'] != '') {
                                            $aUrl[] = $aTwitterUrl['url'];
                                        }
                                    }
                                }
                            }
                        }
                        break;
                }
                if(count($aUrl) > 0) {
                    stream_context_set_default([ 'http' => [ 'method' => 'HEAD' ] ]);
                    foreach($aUrl as $sUrl) {
                        //resolve URL if necessary
                        if($aMedia['sBaseUrl'] != '' && strpos($sUrl, $aMedia['sBaseUrl']) === FALSE) {
                            $aHeadRequest = get_headers($sUrl, 1);
                            if(isset($aHeadRequest['Location'])) {
                                if(is_array($aHeadRequest['Location'])) {
                                    $sUrl = array_pop($aHeadRequest['Location']);
                                } elseif(is_string($aHeadRequest['Location'])) {
                                    $sUrl = $aHeadRequest['Location'];
                                }
                            }
                        }
                        //find nArtId for URL
                        $aArticle = getOne('article', 'sUrl = '.prepareInput('sUrl', $sUrl));
                        if($aArticle !== NULL) {
                            $aInsertList[] = sprintf('(%d, %d, %d)', prepareInput('nArtId', $aArticle['nArtId']), prepareInput('nPosId', $aPostSingle['nPosId']), $dNow);
                        }
                    }
                }
            }
        }
    }
    if(count($aInsertList) > 0) {
        if(($oResult = query(sprintf('INSERT INTO `post_mention` (nArtId, nPosId, dCreate) VALUES %s', implode(', ', $aInsertList))))) {
            //well done
        } else {
            @mail(
                'haim@ifkw.lmu.de',
                '=?UTF-8?B?'.base64_encode('[DissMonitor] Erwähnungen konnten nicht gespeichert werden').'?=',
                'Hallo,'.chr(10).chr(10).
                'gerade wollte ich post-hoc Posts mit Artikeln verknüpfen, also Erwähnungen (post_mentions) speichern. Doch das hat nicht geklappt:'.chr(10).chr(10).
                '>> '.$oDb->error.chr(10),
                implode(chr(10), [
                    'From: DissMonitor <mario@haim.it>',
                    'X-Mailer: PHP/'.phpversion(),
                    'MIME-Version: 1.0',
                    'Content-type: text/plain; charset=utf-8',
                    'Content-Transfer-Encoding: 7bit'
                ])
            );
        }
    }
}

?>