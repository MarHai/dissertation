var oHttps = require('request'),
    sConsumerKey = 'twitter_consumer',
    sConsumerSecret = 'twitter_consumer_secret',
    sBaseUrl = 'https://api.twitter.com/',
    sAuthToken = null;

/**
 * Authenticate to Twitter API. Sets sAuthToken with Bearer Token.
 * 
 * @param {function} _fCallback callback after authentication with one parameter (true/false)
 */
function authenticate(_fCallback) {
    if(sAuthToken === null) {
        var sAuthorization = encodeURIComponent(sConsumerKey) + ':' + encodeURIComponent(sConsumerSecret);
        oHttps.post({
                    url: sBaseUrl + 'oauth2/token',
                    followAllRedirects: true,
                    headers: {
                        Authorization: 'Basic ' + new Buffer(sAuthorization).toString('base64'),
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body: 'grant_type=client_credentials'
                }, function(_mError, _oResponse, _sBody) {
                    if(!_mError && _oResponse.statusCode == 200) {
                        var oAuthToken = JSON.parse(_sBody);
                        if(typeof(oAuthToken['token_type']) !== 'undefined' && typeof(oAuthToken['access_token']) !== 'undefined') {
                            if(oAuthToken.token_type == 'bearer') {
                                sAuthToken = oAuthToken.access_token;
                                _fCallback(true);
                            } else {
                                console.log('Authenticating to Twitter resulted in a uninterpretable authentication.');
                                console.log(oAuthToken);
                                _fCallback(false);
                            }
                        } else {
                            console.log('Authentication to Twitter failed.');
                            console.log(_sBody);
                            _fCallback(false);
                        }
                    } else {
                        console.log('Calling ' + sUrl + ' failed with error: ' + _mError);
                        _fCallback(false);
                    }
                }
            );
    } else {
        _fCallback(true);
    }
}

/**
 * Make an API call to Twitter.
 * 
 * @param {string}   _sUrl      API URL part after (!) 1.1/
 * @param {function} _fCallback callback after everything is done with one parameter (result object or null)
 */
function api(_sUrl, _fCallback) {
    authenticate(function(_bAuth) {
        if(_bAuth) {
            oHttps({
                    url: sBaseUrl + '1.1/' + _sUrl,
                    headers: {
                        Authorization: 'Bearer ' + sAuthToken
                    }
                }, function(_mError, _oResponse, _sBody) {
                    if(!_mError && _oResponse.statusCode % 200 < 100) {
                        _fCallback(JSON.parse(_sBody));
                    } else {
                        console.log('Calling ' + sBaseUrl + '1.1/' + _sUrl + ' failed with error: ' + _mError);
                        _fCallback(null);
                    }
                }
            );
        } else {
            _fCallback(null);
        }
    });
}

module.exports = {
    /**
     * For a given user, fetch all latest (100) Tweets and Retweets (no replies).
     * 
     * @param {string}   _sUser     screen name of the user to fetch
     * @param {string}   _sSinceId  ID of last fetched post (or NULL)
     * @param {function} _fCallback callback with one (array) parameter
     */
    list: function(_sUser, _sSinceId, _fCallback) {
        var sUrl = 'statuses/user_timeline.json?trim_user=1&exclude_replies=1&count=100';
        if(_sSinceId !== null) {
            sUrl += '&since_id=' + _sSinceId;
        }
        api(sUrl + '&screen_name=' + encodeURIComponent(_sUser), function(_aTweet) {
            var aTweet = [];
            if(Array.isArray(_aTweet)) {
                _aTweet.forEach(function(_oTweet, i) {
                    aTweet.push({
                        dCreate: Math.round(Date.parse(_oTweet.created_at)/1000),
                        sPostId: _oTweet.id,
                        sPost: _oTweet.text,
                        sPostMeta: JSON.stringify(_oTweet)
                    });
                });
            }
            _fCallback(aTweet);
        });
    },
    
    /**
     * For a given URL, search the Twitter API for Tweets including links where "the search index has a 7-day limit" (https://dev.twitter.com/rest/reference/get/search/tweets). Iterates over all found Tweets and counts Tweets, Retweets, and Hearts.
     * 
     * @see https://twittercommunity.com/t/a-new-design-for-tweet-and-follow-buttons/52791
     * @see https://blog.twitter.com/2015/hard-decisions-for-a-sustainable-platform
     * 
     * @param {string}   _sUrl      URL to search for
     * @param {function} _fCallback callback expecting an object representing PI name/value pairs
     */
    count: function(_sUrl, _fCallback) {
        var nCountTweet = 0,
            nCountRetweet = 0,
            nCountFav = 0,
            fCrawl = function(_sNextUrl) {
                api('search/tweets.json' + _sNextUrl, function(_oData) {
                    if(typeof(_oData['statuses']) === 'undefined') {
                        _fCallback(null);
                    } else {
                        nCountTweet += _oData.statuses.length;
                        _oData.statuses.forEach(function(_oTweet, i) {
                            nCountRetweet += _oTweet.retweet_count;
                            nCountFav += _oTweet.favorite_count;
                        });
                        if(typeof(_oData.search_metadata.next_results) === 'undefined' || _oData.search_metadata.next_results == '') {
                            _fCallback({
                                Tweets: nCountTweet,
                                Retweets: nCountRetweet,
                                Hearts: nCountFav
                            });
                        } else {
                            fCrawl(_oData.search_metadata.next_results);
                        }
                    }
                });
            };
        fCrawl('?result_type=recent&count=100&q=' + encodeURIComponent(_sUrl + ' filter:links'));
    }
};