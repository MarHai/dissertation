var oHttps = require('request'),
    oCryptoJS = require('crypto-js'),
    sBaseUrl = 'https://rest-server.foo.bar/',
    sKey = 'admin#password#hash';

/**
 * Get header for REST requests.
 * This includes the setup of according digest parameters.
 * 
 * @param   {string} _sUrl  full URL which gets called
 * @param   {string} _sBody full body that gets sent
 * @returns {object} header object to include in the AJAX call
 */
function getRESTheader(_sUrl, _sBody) {
    var sNonce = oCryptoJS.lib.WordArray.random(16).toString();
    return {
        'Content-Type': 'application/json',
        'X-Authorization': 'Digest ' + [
            'nonce="' + sNonce + '"',
            'method="sha1"',
            'signature="' + oCryptoJS.HmacSHA1(_sUrl + sNonce + _sBody, sKey).toString() + '"'
        ].join(',')
    };
}

module.exports = {
    /**
     * Setup and run a GET request to the REST api.
     * 
     * @param {string}   _sUrl      suffix part for REST URL
     * @param {function} _fCallback callback
     */
    get: function(_sUrl, _fCallback) {
        var sUrl = sBaseUrl + _sUrl;
        oHttps({
                url: sUrl,
                followAllRedirects: true,
                headers: getRESTheader(sUrl, '')
            }, function(_mError, _oResponse, _sBody) {
                if(!_mError && _oResponse.statusCode % 200 < 100) {
                    _fCallback(JSON.parse(_sBody));
                } else {
                    console.log('Calling ' + sUrl + ' failed with error: ' + _mError);
                    _fCallback(null);
                }
            }
        );
    },
    
    /**
     * Setup and run a POST request to the REST api.
     * 
     * @param {string}   _sUrl      suffix part for REST URL
     * @param {object}   _oData     data to post along with the call
     * @param {function} _fCallback callback
     */
    post: function(_sUrl, _oData, _fCallback) {
        var sUrl = sBaseUrl + _sUrl,
            sBody = JSON.stringify(_oData);
        oHttps.post({
                url: sUrl,
                followAllRedirects: true,
                headers: getRESTheader(sUrl, sBody),
                body: sBody
            }, function(_mError, _oResponse, _sBody) {
                if(!_mError && _oResponse.statusCode == 200) {
                    _fCallback(JSON.parse(_sBody));
                } else {
                    console.log('Calling ' + sUrl + ' failed with error: ' + _mError);
                    _fCallback(null);
                }
            }
        );
    }
};