<?php

/**
 * Based on an incoming request object, check if call is a valid (i.e., allowed/authorized) call.
 * Therefore, the request needs to provide a X-Authorization header.
 * This header follows digest access authentication principles.
 * - Authentication scheme: Digest
 * - Parameter "nonce": random string
 * - Parameter "method": one of HMAC hashing algorithms, such as SHA1, MD5, etc.
 * - Parameter "signature": hash (/w given method, key = md5'd admin password) of (in that respective order) url, nonce, request body
 * Example: Digest nonce="S8KF9DLD32SDKJ",method="SHA1",signature="ebfdcac2aa5dea36755fb3843cc740bb1e8a5989"
 * 
 * @param  Psr\Http\Message\ServerRequestInterface $_oRequest request object as retrieved from Slim
 * @return boolean                                 TRUE if valid/allowed/authorized
 */
function login(Psr\Http\Message\ServerRequestInterface $_oRequest) {
    if($_oRequest->hasHeader('X-Authorization')) {
        $sAuth = $_oRequest->getHeaderLine('X-Authorization');
        if(strpos($sAuth, 'Digest') === 0) {
            $aHash = [ 'url' => (string)$_oRequest->getUri(), 'nonce' => '', 'body' => (string)$_oRequest->getBody() ];
            $sSignature = $sMethod = '';
            $aParam = explode(',', substr($sAuth, 7));
            foreach($aParam as $sParam) {
                $sParam = trim($sParam);
                list($sKey, $sValue) = explode('=', $sParam, 2);
                $sKey = strtolower(trim($sKey));
                $sValue = trim($sValue);
                if($sValue{0} == '"' && substr($sValue, -1) == '"') {
                    $sValue = substr($sValue, 1, strlen($sValue) - 2);
                }
                switch($sKey) {
                    case 'signature':
                        if($sValue != '') {
                            $sSignature = $sValue;
                        }
                        break;
                    case 'method':
                        if(in_array(strtolower($sValue), hash_algos())) {
                            $sMethod = strtolower($sValue);
                        }
                        break;
                    case 'nonce':
                        $aHash[$sKey] = $sValue;
                        break;
                }
            }
            if($sSignature != '' && $sMethod != '') {
                if(hash_hmac($sMethod, implode('', $aHash), ADMIN_PASSWORD) === $sSignature) {
                    $bLogin = TRUE;
                    return TRUE;
                }
            }
        }
    }
    return FALSE;
}



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



/**
 * Return all available column names for one table.
 * 
 * @param  string $_sTable table name
 * @return array  column names as written inside the database
 */
function getColumnNames($_sTable) {
    global $aCacheColumn;
    if(!isset($aCacheColumn[$_sTable])) {
        $aCacheColumn[$_sTable] = [];
        $sSql = sprintf('SELECT `COLUMN_NAME` FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = \'%s\' AND `TABLE_NAME` = \'%s\'', 
                        DB_NAME, $_sTable);
        if(($oResult = query($sSql))) {
            if($oResult->num_rows > 0) {
                while(($aRow = $oResult->fetch_assoc())) {
                    $aCacheColumn[$_sTable][] = $aRow['COLUMN_NAME'];
                }
            }
        }
    }
    return $aCacheColumn[$_sTable];
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
 * Convert anything into or from JSON.
 * 
 * @param  mixed $_mInput could either be an array to be json'ified or a JSON string to be converted into an array.
 * @return mixed array or JSON string
 */
function json($_mInput) {
    if(is_array($_mInput)) {
        return json_encode($_mInput);
    } else {
        return json_decode($_mInput, TRUE);
    }
}

?>