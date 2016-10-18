var dStart = Date.now();

/**
 * Include libs, check done, and read command line
 * */
var nDone = 0,
    nToBeDone = 0,
    oRest = require('./lib_rest'),
    oFetch = require('./lib_fetch'),
    oFacebook = require('./lib_facebook'),
    oTwitter = require('./lib_twitter');
//check done
function done() {
    nDone++;
    if(nDone >= nToBeDone) {
        var nTime = (Date.now() - dStart); //ms
        console.log('time: ' + nTime);
        //ping
        oRest.post('ping', { sSource: 'sns', nTime: nTime }, function(_oData) {
            process.exit(0);
        });
    }
}

/**
 * Retrieve configuration from REST
 * */
nToBeDone++;
oRest.get('sns', function(_aData) {
    if(_aData !== null) {
        /**
         * Run through configured (and active) SNS configurations.
         * */
        _aData.forEach(function(_oSns, i) {
            if(_oSns.bActive == '1' && _oSns.bActiveMedia == '1') {
                switch(_oSns.eType) {
                    case 'Twitter':
                        /**
                         * If current SNS conf is a Twitter conf, get it from Twitter.
                         * */
                        nToBeDone++;
                        oTwitter.list(_oSns.sPlatformName, _oSns.sLastId, function(_aPost) {
                            _aPost.forEach(function(_oPost, j) {
                                /**
                                 * Push data to REST api.
                                 * */
                                _oPost.nSnsId = _oSns.nSnsId;
                                nToBeDone++;
                                oRest.post('post', _oPost, function(_aPostWithId) {
                                    if(Array.isArray(_aPostWithId)) {
                                        /**
                                         * create link(s) between post and article (if necessary)
                                         * */
                                        if(_aPostWithId.length > 0) {
                                            var oTweet = JSON.parse(_aPostWithId[0].sPostMeta);
                                            if(typeof(oTweet.entities.urls) !== 'undefined' && oTweet.entities.urls.length > 0) {
                                                oTweet.entities.urls.forEach(function(_oUrl, k) {
                                                    nToBeDone++;
                                                    oRest.post('url/post', { nPosId: _aPostWithId[0].nPosId, sUrl: _oUrl.expanded_url, nMedId: _oSns.nMedId, dCreate: _oPost.dCreate },
                                                               function(_aMention) {

                                                        done();
                                                    });
                                                });
                                            }
                                        }
                                    }
                                    done();
                                });
                            });
                            done();
                        });
                        break;
                    case 'Facebook':
                        /**
                         * If current SNS conf is a Facebook conf, get it from Facebook.
                         * */
                        nToBeDone++;
                        oFacebook.list(_oSns.sPlatformName, _oSns.dLastFetch, function(_aPost) {
                            _aPost.forEach(function(_oPost, j) {
                                /**
                                 * Resolve (potentially shortened) URLs
                                 * */
                                nToBeDone++;
                                oFetch.resolveURL(_oPost.link, function(_sUrl) {
                                    /**
                                     * Push data to REST api.
                                     * */
                                    if(_sUrl.indexOf('unsupportedbrowser') < 0) {
                                        _oPost.link = _sUrl;
                                        _oPost.dCreate = Date.parse(_oPost.created_time)/1000;
                                        nToBeDone++;
                                        oRest.post('post', {
                                                dCreate: _oPost.dCreate,
                                                nSnsId: _oSns.nSnsId,
                                                sPostId: _oPost.id,
                                                sPost: _oPost.message,
                                                sPostMeta: JSON.stringify({
                                                    link: _oPost.link,
                                                    created_time: _oPost.created_time, 
                                                    status_type: _oPost.status_type,
                                                    shares: _oPost.shares
                                                })
                                            }, function(_aPostWithId) {

                                            if(Array.isArray(_aPostWithId)) {
                                                /**
                                                 * create link between post and article (if necessary)
                                                 * */
                                                if(_aPostWithId.length > 0) {
                                                    nToBeDone++;
                                                    oRest.post('url/post', { nPosId: _aPostWithId[0].nPosId, sUrl: _oPost.link, nMedId: _oSns.nMedId, dCreate: _oPost.dCreate }, function(_aMention) {
                                                        done();
                                                    });
                                                }
                                            }
                                            done();
                                        });
                                    }
                                    done();
                                });
                            });
                            done();
                        });
                        break;
                }
            }
        });
    }
    done();
});