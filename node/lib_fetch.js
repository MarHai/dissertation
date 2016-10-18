var oHttps = require('request'),
    oSelector = require('cheerio'),
    oFile = require('fs');

module.exports = {
    /**
     * Run a GET request against a given URL
     * 
     * @param {string}   _sUrl      FQDN
     * @param {function} _fCallback callback (expecting one string parameter explicating the source code)
     */
    get: function(_sUrl, _fCallback) {
        oHttps({
                url: _sUrl,
                followAllRedirects: true
            }, function(_mError, _oResponse, _sBody) {
                if(!_mError && _oResponse.statusCode % 200 < 100) {
                    _fCallback(_sBody);
                } else {
                    if(typeof(_oResponse) === 'undefined') {
                        console.log('Calling ' + _sUrl + ' failed with error: ' + _mError);
                    } else {
                        console.log('Calling ' + _sUrl + ' failed with error ' + _oResponse.statusCode + ': ' + _mError);
                    }
                    _fCallback(_mError == null ? _sBody : null);
                }
            }
        );
    },
    
    /**
     * Extract elements from a given source code using a CSS selector (jQuery style)
     * 
     * @param {string}   _sBody          source code
     * @param {string}   _sSelector      jQuery-style selector (actually, it's cheerio)
     * @param {string}   _sLinkExtractor jQuery-style code (behind $(...).) to extract URLs
     * @param {function} _fCallback      callback (expecting an array full of URLs)
     */
    extract: function(_sBody, _sSelector, _sLinkExtractor, _fCallback) {
        var $ = oSelector.load(_sBody),
            aExtracted = [];
        $(_sSelector).each(function(i, _oElem) {
            aExtracted.push(eval('$(_oElem).' + _sLinkExtractor)); 
        });
        _fCallback(aExtracted);
    },
    
    /**
     * Combine the two prior functions
     * 
     * @param {string}   _sUrl           see .get
     * @param {string}   _sSelector      see .extract
     * @param {string}   _sLinkExtractor see .extract
     * @param {function} _fCallback      see .extract
     */
    getAndExtract: function(_sUrl, _sSelector, _sLinkExtractor, _fCallback) {
        module.exports.get(_sUrl, function(_sBody) {
            if(_sBody === null) {
                _fCallback(null);
            } else {
                module.exports.extract(_sBody, _sSelector, _sLinkExtractor, _fCallback);
            }
        });
    },
    
    /**
     * Runs a HEAD request on the given URL in order to resolve it.
     * 
     * @param {string}   _sUrl      URL to resolve
     * @param {function} _fCallback callback with one (string, resolved URL) parameter
     */
    resolveURL: function(_sUrl, _fCallback) {
        oHttps({
                url: _sUrl,
                method: 'HEAD',
                followAllRedirects: true
            }, function(_mError, _oResponse) {
                if(!_mError && _oResponse.statusCode % 200 < 100) {
                    _fCallback(_oResponse.request.uri.href);
                } else {
                    console.log('Resolving ' + _sUrl + ' failed with error: ' + _mError);
                    _fCallback(_sUrl);
                }
            }
        );
    }
};