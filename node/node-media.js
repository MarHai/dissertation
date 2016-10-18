var dStart = Date.now();

/**
 * Include libs, check done, and read command line
 * */
var nDone = 0,
    nToBeDone = 0,
    oRest = require('./lib_rest'),
    oFetch = require('./lib_fetch'),
    sType = 'homepage';
//command line
if(typeof(process.argv[2]) !== 'undefined') {
    if(process.argv[2] == 'highlight') {
        sType = 'highlight';
    }
}
//check done
function done() {
    nDone++;
    if(nDone >= nToBeDone) {
        var nTime = (Date.now() - dStart); //ms
        console.log('time: ' + nTime);
        //ping
        oRest.post('ping', { sSource: sType, nTime: nTime }, function(_oData) {
            process.exit(0);
        });
    }
}

/**
 * Retrieve configuration from REST
 * */
nToBeDone++;
oRest.get('media', function(_aData) {
    if(_aData !== null) {
        /**
         * Run through configured (and active) pages and extract sub pages
         * */
        _aData.forEach(function(_oMedia, i) {
            if(_oMedia.bActive == '1') {
                var sUrl = _oMedia['sH' + sType.substr(1) + 'Url'],
                    sSelector = _oMedia['sH' + sType.substr(1) + 'Selector'],
                    sLinkExtractor = _oMedia['sH' + sType.substr(1) + 'LinkExtractor'];
                if(sUrl != '' && sSelector != '') {
                    //extract
                    nToBeDone++;
                    oFetch.getAndExtract(sUrl, sSelector, sLinkExtractor, function(_aExtracted) {
                        if(_aExtracted !== null) {
                            if(_aExtracted.length > 0) {
                                //create new scrape
                                nToBeDone++;
                                oRest.post(sType, { nMedId: _oMedia.nMedId }, function(_aScrapeType) {
                                    if(_aScrapeType !== null) {
                                        var oScrapeType = _aScrapeType;
                                        if(typeof(_aScrapeType[0]) !== 'undefined' && (typeof(oScrapeType['nHomId']) !== 'undefined' || typeof(oScrapeType['nHigId']) !== 'undefined')) {
                                            oScrapeType = _aScrapeType[0]
                                        }
                                        //per extracted URL, add ranking
                                        _aExtracted.forEach(function(_sUrl, j) {
                                            var oDataForNewUrlRanking = { nMedId: _oMedia.nMedId, sUrl: _sUrl, nValue: j+1 };
                                            if(sType == 'homepage') {
                                                oDataForNewUrlRanking['nHomId'] = oScrapeType.nHomId;
                                            } else {
                                                oDataForNewUrlRanking['nHigId'] = oScrapeType.nHigId;
                                            }
                                            nToBeDone++;
                                            oRest.post('url/' + sType, oDataForNewUrlRanking, function(_oData) {
                                                done();
                                            });
                                        });
                                    }
                                    done();
                                });
                            }
                        }
                        done();
                    });
                }
            }
        });
    }
    done();
});