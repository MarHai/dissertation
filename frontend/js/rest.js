var sBaseURL = 'http://rest-url.foo.bar/';

/**
 * Check whether a given password is correct.
 * 
 * @param {string}   _sPassword entered password
 * @param {function} _fCallback callback function with boolean parameter to indicate whether password was correct
 */
function checkPassword(_sPassword, _fCallback) {
    sessionStorage.setItem('sPasswordHash', CryptoJS.MD5(_sPassword).toString());
    restGET('find/test', function(_oData) {
        var bTrue = false;
        if(typeof(_oData) == 'object') {
            if(typeof(_oData['article']) !== 'undefined' && typeof(_oData['media']) !== 'undefined' && typeof(_oData['sns']) !== 'undefined') {
                bTrue = true;
            }
        }
        _fCallback(bTrue);
    });
}

/**
 * Get header for AJAX request toward REST API.
 * This includes the setup of according digest parameters.
 * 
 * @param   {string} _sUrl  full URL which gets called
 * @param   {string} _sBody full body that gets sent
 * @returns {object} header object to include in the AJAX call
 */
function getRESTheader(_sUrl, _sBody) {
    var sNonce = CryptoJS.lib.WordArray.random(16).toString();
    return {
        'Content-Type': 'application/json',
        'X-Authorization': 'Digest ' + [
            'nonce="' + sNonce + '"',
            'method="sha1"',
            'signature="' + CryptoJS.HmacSHA1(_sUrl + sNonce + _sBody, sessionStorage.getItem('sPasswordHash')).toString() + '"'
        ].join(',')
    };
}

/**
 * Retrieve data from the REST API using a GET request.
 * 
 * @param {string}   _sUrl      full URL to call
 * @param {function} _fCallback callback function with (at least) one JS object parameter
 */
function restGET(_sUrl, _fCallback) {
    var sUrl = sBaseURL + _sUrl;
    $.ajax({
        url: sUrl,
        headers: getRESTheader(sUrl, ''),
        dataType: 'json',
        method: 'GET',
        crossDomain: true,
        success: _fCallback,
        error: _fCallback
    });
}

/**
 * Push and retrieve data from the REST API using a PUT request.
 * Usually used for submitting updates.
 * 
 * @param {string}   _sUrl      full URL to call
 * @param {object}   _oData     data to send (as body)
 * @param {function} _fCallback callback function with (at least) one JS object parameter
 */
function restPUT(_sUrl, _oData, _fCallback) {
    var sUrl = sBaseURL + _sUrl,
        sData = JSON.stringify(_oData);
    $.ajax({
        url: sUrl,
        headers: getRESTheader(sUrl, sData),
        dataType: 'json',
        method: 'PUT',
        data: sData,
        processData: false,
        contentType: 'application/json',
        crossDomain: true,
        success: _fCallback
    });
}

/**
 * Push and retrieve data from the REST API using a POST request.
 * Usually used for submitting new entries.
 * 
 * @param {string}   _sUrl      full URL to call
 * @param {object}   _oData     data to send (as body)
 * @param {function} _fCallback callback function with (at least) one JS object parameter
 */
function restPOST(_sUrl, _oData, _fCallback) {
    var sUrl = sBaseURL + _sUrl,
        sData = JSON.stringify(_oData);
    $.ajax({
        url: sUrl,
        headers: getRESTheader(sUrl, sData),
        dataType: 'json',
        method: 'POST',
        data: sData,
        processData: false,
        contentType: 'application/json',
        crossDomain: true,
        success: _fCallback
    });
}