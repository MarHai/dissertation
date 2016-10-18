/**
 * Maps a list of rankings (i.e., homepage, highlight) into an approriate sorted array for Highcharts.
 * 
 * @param   {Array} _aRanking raw ranking as it comes from the rest API
 * @returns {Array} nicely formatted and sorted array, ready for Highcharts
 */
function mapRankingIntoData(_aRanking) {
    var aRanking = [];
    $.each(_aRanking, function(i, _oRanking) {
        aRanking.push([ _oRanking.dCreate*1000, parseInt(_oRanking.nValue) ]);
    });
    aRanking.sort(function(_aA, _aB) {
        if(_aA[0] > _aB[0]) return 1;
        if(_aA[0] < _aB[0]) return -1;
        else return 0;
    });
    return aRanking;
}

/**
 * Setup communicator's perspective (i.e., upper) chart. Requires all data.
 * 
 * @param {object} _oElem      jQuery element where chart should be created
 * @param {Array}  _aHomepage  raw data for homepage line (.homepage_ranking)
 * @param {Array}  _aHighlight raw data for highlight line (.highlight_ranking)
 * @param {Array}  _aEvent     raw single events to show as flags (.update)
 */
function setupCommunicatorChart(_oElem, _nWidth, _nHeight, _aHomepage, _aHighlight, _aEvent) {
    var aSeries = [];
    if(typeof(_aHomepage) !== 'undefined' && _aHomepage.length > 0) {
        aSeries.push({ name: 'Homepage Ranking', data: mapRankingIntoData(_aHomepage) });
    }
    if(typeof(_aHighlight) !== 'undefined' && _aHighlight.length > 0) {
        aSeries.push({ name: 'Highlight Ranking', data: mapRankingIntoData(_aHighlight) });
    }
    if(typeof(_aEvent) !== 'undefined' && _aEvent.length > 0 && Highcharts.seriesTypes.flags) {
        var oUpdate = {};
        $.each(_aEvent, function(i, _oEvent) {
            if(typeof(oUpdate[_oEvent.sType]) === 'undefined') {
                oUpdate[_oEvent.sType] = [];
            }
            if(_oEvent.sType == 'Image') {
                oUpdate['Image'].push({
                    x: _oEvent.dCreate*1000,
                    title: '<img src="https://diss.haim.it/img/' + _oEvent.nArtId + '/' + _oEvent.sValue + '" height="17px" />'
                });
            } else {
                oUpdate[_oEvent.sType].push({
                    x: _oEvent.dCreate*1000,
                    text: _oEvent.sValue,
                    title: _oEvent.sType
                });
            }
        });
        var i = 0;
        $.each(oUpdate, function(_sType, _aUpdate) {
            aSeries.push({
                type: 'flags',
                name: _sType,
                shape: 'squarepin',
                color: '#333333',
                y: -30-(i*25),
                zIndex: _aEvent.length - i,
                showInLegend: false,
                useHTML: true,
                data: _aUpdate
            });
            i++;
        });
    }
    if(aSeries.length == 0) {
        $(_oElem).text('Not enough data for communicator\'s perspective diagram.');
    } else {
        $(_oElem).highcharts({
            chart: {
                type: 'line',
                width: _nWidth,
                height: _nHeight,
                spacingBottom: 50
            },
            credits: { enabled: false },
            title: { text: 'Communicator\'s Perspective' },
            xAxis: {
                type: 'datetime',
                title: { text: 'Date' }
            },
            yAxis: {
                title: { text: 'Ordinal Position' },
                min: 1,
                reversed: true,
                tickInterval: 1
            },
            series: aSeries
        });
    }
}


/**
 * Setup recipients's perspective (i.e., lower) chart. Requires all data.
 * 
 * @param {object} _oElem       jQuery element where chart should be created
 * @param {Array}  _aPopularity raw data for popularity lines (.popularity)
 * @param {Array}  _aEvent      raw single events to show as flags (.post_mention)
 */
function setupRecipientChart(_oElem, _nWidth, _nHeight, _aPopularity, _aEvent) {
    var aSeries = [];
    if(typeof(_aPopularity) !== 'undefined' && _aPopularity.length > 0) {
        var oPopularity = {};
        $.each(_aPopularity, function(i, _oPopularity) {
            if(typeof(oPopularity[_oPopularity.sType]) === 'undefined') {
                oPopularity[_oPopularity.sType] = [];
            }
            oPopularity[_oPopularity.sType].push([ _oPopularity.dCreate*1000, parseInt(_oPopularity.nValue) ]);
        });
        $.each(oPopularity, function(_sType, _aSinglePopularity) {
            _aSinglePopularity.sort(function(_aA, _aB) {
                if(_aA[0] > _aB[0]) return 1;
                if(_aA[0] < _aB[0]) return -1;
                else return 0;
            });
            aSeries.push({
                name: _sType,
                data: _aSinglePopularity
            });
        });
    }
    if(typeof(_aEvent) !== 'undefined' && _aEvent.length > 0 && Highcharts.seriesTypes.flags) {
        var aData = [];
        $.each(_aEvent, function(i, _oEvent) {
            aData.push({
                x: _oEvent.dCreate*1000,
                text: 'Post Mention',
                title: '#'
            });
        });
        aSeries.push({
            type: 'flags',
            name: 'Mention',
            shape: 'circlepin',
            color: '#333333',
            showInLegend: false,
            data: []
        });
    }
    if(aSeries.length == 0) {
        $(_oElem).text('Not enough data for recipient\'s perspective diagram.');
    } else {
        $(_oElem).highcharts({
            chart: { type: 'line' },
            credits: { enabled: false },
            title: { text: 'Recipient\'s Perspective' },
            xAxis: {
                type: 'datetime',
                title: { text: 'Date' }
            },
            yAxis: {
                title: { text: 'PI [log]' },
                tickInterval: 10,
                minorTickInterval: 1,
                type: 'logarithmic'
            },
            tooltip: {
                shared: true,
                formatter: function() {
                    var aLegend = [];
                    $.each(this.points, function(i, _oPoint) {
                        aLegend.push(_oPoint.series.name + ': <strong>' + _oPoint.y + '</strong>');
                    });
                    return aLegend.join('<br />');
                }
            },
            series: aSeries
        });
    }
}