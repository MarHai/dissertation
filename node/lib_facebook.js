var oFacebook = require('fb'),
    oHttps = require('request'),
    sClientId = 'client_id',
    sClientSecret = 'client_secret',
    sAuthToken = null;

/**
 * Authenticate to the Facebook REST API.
 * Sets both oFacebook.setAccessToken(...) and sAuthToken.
 * 
 * @param {function} _fCallback callback with true/false parameter
 */
function authenticate(_fCallback) {
    if(sAuthToken === null) {
        oFacebook.api('oauth/access_token', {
                client_id: sClientId,
                client_secret: sClientSecret,
                grant_type: 'client_credentials'
            }, function(_oResult) {
                if(!_oResult || _oResult.error) {
                    console.log('Facebook\'s API returned an error: ' + _oResult.error);
                    _fCallback(false);
                } else {
                    if(typeof(_oResult['access_token']) === 'undefined') {
                        _fCallback(false);
                    } else {
                        sAuthToken = _oResult.access_token;
                        oFacebook.setAccessToken(sAuthToken);
                        _fCallback(true);
                    }
                }
        });
    } else {
        _fCallback(true);
    }
}

module.exports = {
    /**
     * For a given page, fetch all latest (200) Posts.
     * 
     * @param {mixed}    _mPageId    page ID of the page to fetch
     * @param {number}   _nUnixStart UNIX timestamp from which to start requesting posts
     * @param {function} _fCallback  callback with one (array) parameter
     */
    list: function(_mPageId, _nUnixStart, _fCallback) {
        authenticate(function(_bAuth) {
            if(_bAuth) {
                var fFetch = function(_aPost, _nSinceUnix, _nUntilUnix, _fCallback) {
                    var nLimit = 100;
                    if(_nSinceUnix === null) {
                        //if no start date is set, set it to 7 days ago (7*24*60*60 = 604800)
                        _nSinceUnix = Date.parse(new Date())/1000-604800;
                    }
                    oFacebook.api('/' + _mPageId + '/posts', {
                                     limit: nLimit, 
                                     since: _nSinceUnix,
                                     until: _nUntilUnix === null ? '' : _nUntilUnix,
                                     fields: 'id, link, created_time, status_type, shares, message'
                                  }, function(_oResult) {
                        
                        if(typeof(_oResult.data) === 'undefined') {
                            _fCallback(_aPost);
                        } else {
                            _oResult.data.forEach(function(_oPost, i) {
                                if(typeof(_oPost.link) !== 'undefined') {
                                    _aPost.push(_oPost);
                                }
                            });
                            if(typeof(_oResult.paging) === 'undefined' || typeof(_oResult.paging.next) === 'undefined' || _oResult.paging.next == '' ||
                               _oResult.data.length < nLimit) {
                                
                                _fCallback(_aPost);
                            } else {
                                var nUntil = _oResult.paging.next.split('until=')[1];
                                nUntil = parseInt(nUntil.split('&')[0]);
                                fFetch(_aPost, _nSinceUnix, nUntil, _fCallback);
                            }
                        }
                    });
                };
                fFetch([], _nUnixStart, null, _fCallback);
            } else {
                _fCallback(null);
            }
        });
    },
    
    /**
     * For a given URL, retrieve FB share and comment counts.
     * @see https://developers.facebook.com/docs/graph-api/reference/v2.6/url
     * 
     * @param {string}   _sUrl      URL to search for
     * @param {function} _fCallback callback expecting an object representing share and comment count
     */
    count: function(_sUrl, _fCallback) {
        authenticate(function(_bAuth) {
            if(_bAuth) {
                //try the old way (which has more detail)
                oHttps({
                        url: 'http://api.facebook.com/restserver.php?method=links.getStats&format=json&urls=' + encodeURIComponent(_sUrl),
                        followAllRedirects: true
                    }, function(_mError, _oResponse, _sBody) {
                    
                        var bDone = false;
                        if(!_mError && _oResponse.statusCode % 200 < 100) {
                            var aData = JSON.parse(_sBody);
                            if(aData.length > 0 && typeof(aData[0].url) !== 'undefined') {
                                bDone = true;
                                _fCallback({
                                        id: aData[0].comments_fbid,
                                        url: aData[0].url,
                                        'FB Likes': parseInt(aData[0].like_count),
                                        'FB Comments': parseInt(aData[0].comment_count),
                                        'FB Shares': parseInt(aData[0].share_count)
                                });
                            }
                        }
                        if(!bDone) {
                            //if still here, try the new way (works for sure, but with less detail)
                            oFacebook.api('/', { id: _sUrl }, function(_oData) {
                                if(typeof(_oData.share) === 'undefined') {
                                    _fCallback(null);
                                } else {
                                    if(typeof(_oData.og_object) === 'undefined' || typeof(_oData.og_object.id) === 'undefined') {
                                        _fCallback(null);
                                    } else {
                                        _fCallback({
                                            id: _oData.og_object.id,
                                            url: _oData.og_object.url,
                                            'FB Comments': parseInt(_oData.share.comment_count),
                                            'FB Shares': parseInt(_oData.share.share_count)
                                        });
                                    }
                                }
                            });
                        }
                    }
                );
            } else {
                _fCallback(null);
            }
        });
    }
};
