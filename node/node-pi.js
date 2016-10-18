var dStart = Date.now();

/**
 * Include libs, check done, and read command line
 * */
var nDone = 0,
    nToBeDone = 0,
    oRest = require('./lib_rest'),
    oFacebook = require('./lib_facebook');
//check done
function done() {
    nDone++;
    if(nDone >= nToBeDone) {
        var nTime = (Date.now() - dStart); //ms
        console.log('time: ' + nTime);
        //ping
        oRest.post('ping', { sSource: 'popularity', nTime: nTime }, function(_oData) {
            process.exit(0);
        });
    }
}

/**
 * Retrieve configuration from REST
 * */
nToBeDone++;
oRest.get('latest', function(_aArticle) {
    if(_aArticle !== null) {
        /**
         * Run through latest articles and get all popularity indicators
         * */
        _aArticle.forEach(function(_oArticle, i) {
            if(_oArticle.sUrl != '') {
                //Facebook
                nToBeDone++;
                oFacebook.count(_oArticle.sUrl, function(_oData) {
                    for(var sKey in _oData) {
                        if(sKey != 'id' && sKey != 'url' && _oData[sKey] != 0) {
                            nToBeDone++;
                            oRest.post('popularity', {
                                    nArtId: _oArticle.nArtId,
                                    sType: sKey,
                                    nValue: _oData[sKey]
                                }, function(_aUpdate) {
                                
                                done();
                            });
                        }
                    }
                    done();
                });
                
                //Twitter
                /**
                 * Nope, sorry. Twitter stopped their support for this feature.
                 * @see https://blog.twitter.com/2015/hard-decisions-for-a-sustainable-platform
                 **/
            }
        });
    }
    done();
});