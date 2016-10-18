var dStart = Date.now();

/**
 * Include libs, check done, and read command line
 * */
var nDone = 0,
    nToBeDone = 0,
    oRest = require('./lib_rest'),
    oFetch = require('./lib_fetch'),
    oCrypto = require('crypto');
//check done
function done() {
    nDone++;
    if(nDone >= nToBeDone) {
        var nTime = (Date.now() - dStart); //ms
        console.log('time: ' + nTime);
        //ping
        oRest.post('ping', { sSource: 'article', nTime: nTime }, function(_oData) {
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
         * Run through latest articles, fetch them, and extract necessary information
         * */
        _aArticle.forEach(function(_oArticle, i) {
            if(_oArticle.sUrl != '') {
                //fetch
                nToBeDone++;
                oFetch.get(_oArticle.sUrl, function(_sBody) {
                    if(_sBody !== null) {
                        //extract headline
                        if(_oArticle.sArticleHeadlineSelector != '') {
                            nToBeDone++;
                            oFetch.extract(_sBody, _oArticle.sArticleHeadlineSelector, 'text()', function(_aHeadline) {
                                if(_aHeadline.length > 0) {
                                    var sHeadline = _aHeadline[0].trim();
                                    if(sHeadline != '') {
                                        nToBeDone++;
                                        oRest.post('update', {
                                                nArtId: _oArticle.nArtId,
                                                sType: 'Headline',
                                                sValue: sHeadline
                                            }, function(_aUpdate) {
                                            done();
                                        });
                                    }
                                }
                                done();
                            });
                        }
                        //extract image
                        if(_oArticle.sArticleImageSelector != '') {
                            nToBeDone++;
                            var sExtractor = 'attr(\'src\')';
                            if(_oArticle.sArticleImageSelector.split(' ').pop().substr(0, 3) != 'img') {
                                sExtractor = 'attr(\'srcset\')';
                            }
                            oFetch.extract(_sBody, _oArticle.sArticleImageSelector, sExtractor, function(_aImage) {
                                if(_aImage.length > 0) {
                                    if(_aImage[0] != '') {
                                        nToBeDone++;
                                        oRest.post('image', {
                                                nArtId: _oArticle.nArtId,
                                                sValue: _aImage[0]
                                            }, function(_aUpdate) {
                                                done();
                                        });
                                    }
                                }
                                done();
                            });
                        }
                        //extract comment count
                        if(_oArticle.sArticleCommentSelector != '') {
                            nToBeDone++;
                            oFetch.extract(_sBody, _oArticle.sArticleCommentSelector, 'text()', function(_aComment) {
                                if(_aComment !== null) {
                                    if(_aComment.length > 0) {
                                        nToBeDone++;
                                        oRest.post('popularity', {
                                                nArtId: _oArticle.nArtId,
                                                sType: 'Comments',
                                                nValue: parseInt(_aComment[0])
                                            }, function(_aPopularity) {

                                            done();
                                        });
                                    }
                                }
                                done();
                            });
                        }
                    }
                    done();
                });
            }
        });
    }
    done();
});