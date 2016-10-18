/**
 * Config overview page, showing all media outlets.
 * 
 * @param {function} _fCallback callback to call as soon as finished
 */
function config_media(_fCallback) {
    //get all media outlets
    restGET('media', function(_aData) {
        multiplyTemplate($('#page_config-media .template'), _aData);
        _fCallback();
    });
    //creation add handler
    $('#page_config-media form').off('submit').on('submit', function(_oEvent) {
        _oEvent.preventDefault();
        load();
        restPOST('media', {
                sName: $('#page_config-media_name').val(),
                bActive: $('#page_config-media_active').is(':checked'),
                sBaseUrl: $('#page_config-media_homepage-base').val(),
                sPrefixUrl: $('#page_config-media_homepage-prefix').val(),
                sHomepageUrl: $('#page_config-media_homepage-url').val(),
                sHomepageSelector: $('#page_config-media_homepage-selector').val(),
                sHomepageLinkExtractor: $('#page_config-media_homepage-linkextractor').val(),
                sHighlightUrl: $('#page_config-media_highlight-url').val(),
                sHighlightSelector: $('#page_config-media_highlight-selector').val(),
                sHighlightLinkExtractor: $('#page_config-media_highlight-linkextractor').val(),
                sArticleHeadlineSelector: $('#page_config-media_article-headline').val(),
                sArticleImageSelector: $('#page_config-media_article-image').val(),
                sArticleCommentSelector: $('#page_config-media_article-comment').val()
            }, function(_oData) {
            
            $('#page_config-media form input, #page_config-media form textarea').val('');
            config_media(_fCallback);
        });
    });
}

/**
 * Config detail page with a given ID.
 * 
 * @param {number}   _nId       UID of the given entry
 * @param {function} _fCallback callback to call as soon as finished
 */
function config_media__(_nId, _fCallback) {
    restGET('media/' + _nId, function(_oData) {
        //display detail information
        $('#page_config-media-- h1.page-header').text(_oData.media.sName)
        
        $('#page_config-media__name').val(_oData.media.sName);
        $('#page_config-media__active').get(0).checked = _oData.media.bActive*1;
        $('#page_config-media__homepage-base').val(_oData.media.sBaseUrl);
        $('#page_config-media__homepage-prefix').val(_oData.media.sPrefixUrl);
        $('#page_config-media__homepage-url').val(_oData.media.sHomepageUrl);
        $('#page_config-media__homepage-selector').val(_oData.media.sHomepageSelector);
        $('#page_config-media__homepage-linkextractor').val(_oData.media.sHomepageLinkExtractor);
        $('#page_config-media__highlight-url').val(_oData.media.sHighlightUrl);
        $('#page_config-media__highlight-selector').val(_oData.media.sHighlightSelector);
        $('#page_config-media__highlight-linkextractor').val(_oData.media.sHighlightLinkExtractor);
        $('#page_config-media__article-headline').val(_oData.media.sArticleHeadlineSelector);
        $('#page_config-media__article-image').val(_oData.media.sArticleImageSelector);
        $('#page_config-media__article-comment').val(_oData.media.sArticleCommentSelector);
        
        multiplyTemplate($('#page_config-media-- .sns.template'), _oData.sns);
        
        //sns add handler
        $('#page_config-media-- form.sns').off('submit').on('submit', function(_oEvent) {
            _oEvent.preventDefault();
            load();
            restPOST('sns', {
                    sPlatformName: $('#page_config-sns_name').val(),
                    bActive: $('#page_config-sns_active').is(':checked'),
                    eType: $('#page_config-sns_type').val(),
                    nMedId: _nId
                }, function(_oData) {

                $('#page_config-media-- form.sns input').val('');
                config_media__(_nId, _fCallback);
            });
        });
        
        //update handler
        $('#page_config-media-- form.media').off('submit').on('submit', function(_oEvent) {
            _oEvent.preventDefault();
            load();
            restPUT('media/' + _nId, {
                    sName: $('#page_config-media__name').val(),
                    bActive: $('#page_config-media__active').is(':checked'),
                    sBaseUrl: $('#page_config-media__homepage-base').val(),
                    sPrefixUrl: $('#page_config-media__homepage-prefix').val(),
                    sHomepageUrl: $('#page_config-media__homepage-url').val(),
                    sHomepageSelector: $('#page_config-media__homepage-selector').val(),
                    sHomepageLinkExtractor: $('#page_config-media__homepage-linkextractor').val(),
                    sHighlightUrl: $('#page_config-media__highlight-url').val(),
                    sHighlightSelector: $('#page_config-media__highlight-selector').val(),
                    sHighlightLinkExtractor: $('#page_config-media__highlight-linkextractor').val(),
                    sArticleHeadlineSelector: $('#page_config-media__article-headline').val(),
                    sArticleImageSelector: $('#page_config-media__article-image').val(),
                    sArticleCommentSelector: $('#page_config-media__article-comment').val()
                }, function(_oData) {

                config_media__(_nId, _fCallback);
            });
        });
        
        _fCallback();
    });
}

/**
 * Single config detail page for SNS.
 * 
 * @param {number}   _nId       UID of the given entry
 * @param {function} _fCallback callback to call as soon as finished
 */
function config_sns__(_nId, _fCallback) {
    restGET('sns/' + _nId, function(_oData) {
        //init back button
        $('#page_config-sns-- .btn-secondary').attr('data-id', _oData.sns.nMedId);
        setupLinks($('#page_config-sns--'));
        
        //display detail information
        $('#page_config-sns__name').val(_oData.sns.sPlatformName);
        $('#page_config-sns__active').get(0).checked = _oData.sns.bActive*1;
        $('#page_config-sns__type').val(_oData.sns.eType);
        
        //update handler
        $('#page_config-sns-- form.sns').off('submit').on('submit', function(_oEvent) {
            _oEvent.preventDefault();
            load();
            restPUT('sns/' + _nId, {
                    sPlatformName: $('#page_config-sns__name').val(),
                    bActive: $('#page_config-sns__active').is(':checked'),
                    eType: $('#page_config-sns__type').val()
                }, function(_aData) {

                $('#page_config-sns-- .btn-secondary').click();
            });
        });
        
        _fCallback();
    });
}

/**
 * Data overview page, showing all media outlets including their homepages.
 * 
 * @param {function} _fCallback callback to call as soon as finished
 */
function data_media(_fCallback) {
    //get all media outlets
    restGET('media', function(_aMedia) {
        //load media
        for(var i = 0; i < _aMedia.length; i++) {
            delete _aMedia[i].dCreate;
        }
        multiplyTemplate($('#page_data-media div.template'), _aMedia);
        
        //fill media with homepages
        for(var i = 0; i < _aMedia.length; i++) {
            restGET('media/' + _aMedia[i].nMedId, (function(i) { return function(_oData) {
                $($('#page_data-media div.template-copy .panel:not(.hide) .nArticleCnt').get(i)).text(_oData.article.nCntTotal);
                $($('#page_data-media div.template-copy .panel:not(.hide) .nHomepageCnt').get(i)).text(_oData.homepage.nCntTotal);
                $($('#page_data-media div.template-copy .panel:not(.hide) .nHighlightCnt').get(i)).text(_oData.highlight.nCntTotal);
                
                var aHomepage = [];
                var dLast = null;
                $.each(_oData.homepage.aData, function(_j, _oHomepage) {
                    var oMoment = moment.unix(_oHomepage['dCreate']);
                    _oHomepage['dCreateString'] = oMoment.format('YYYY-MM-DD HH:mm');
                    _oHomepage['dCreateFrom'] = oMoment.fromNow();
                    aHomepage.push(_oHomepage);
                });
                aHomepage.sort(function(_oA, _oB) {
                    _oA.dCreate = parseInt(_oA.dCreate);
                    _oB.dCreate = parseInt(_oB.dCreate);
                    if(_oA.dCreate > _oB.dCreate) return -1;
                    else if(_oA.dCreate < _oB.dCreate) return 1;
                    else return 0;
                });
                $($('#page_data-media div.template-copy .panel:not(.hide) .dLastScrape').get(i))
                    .text(aHomepage.length == 0 ? 'not at all' : aHomepage[0].dCreateFrom);
                multiplyTemplate($($('#page_data-media div.template-copy .panel:not(.hide) table.homepage tr.template').get(i)), aHomepage);
                $($('#page_data-media div.template-copy .panel:not(.hide) table.homepage').get(i))
                    .parent('.table-responsive')
                    .addClass('reload')
                    .data('media', _aMedia[i].nMedId)
                    .data('table', 'homepage')
                    .data('load', '0')
                    .data('current', aHomepage.length)
                    .on('scroll', function() { loadAdditionalDataAndAppend(this) });
                
                var aHighlight = [];
                $.each(_oData.highlight.aData, function(_j, _oHighlight) {
                    var oMoment = moment.unix(_oHighlight['dCreate']);
                    _oHighlight['dCreateString'] = oMoment.format('YYYY-MM-DD HH:mm');
                    _oHighlight['dCreateFrom'] = oMoment.fromNow();
                    aHighlight.push(_oHighlight);
                });
                aHighlight.sort(function(_oA, _oB) {
                    _oA.dCreate = parseInt(_oA.dCreate);
                    _oB.dCreate = parseInt(_oB.dCreate);
                    if(_oA.dCreate > _oB.dCreate) return -1;
                    else if(_oB.dCreate > _oA.dCreate) return 1;
                    else return 0;
                });
                multiplyTemplate($($('#page_data-media div.template-copy .panel:not(.hide) table.highlight tr.template').get(i)), aHighlight);
                $($('#page_data-media div.template-copy .panel:not(.hide) table.highlight').get(i))
                    .parent('.table-responsive')
                    .addClass('reload')
                    .data('media', _aMedia[i].nMedId)
                    .data('table', 'highlight')
                    .data('load', '0')
                    .data('current', aHighlight.length)
                    .on('scroll', function() { loadAdditionalDataAndAppend(this) });
                
                multiplyTemplate($($('#page_data-media div.template-copy .panel:not(.hide) table.sns tr.template').get(i)), _oData.sns);
            }})(i));
        }
        
        _fCallback();
    });
}

function loadAdditionalDataAndAppend(_oTableResponsive) {
    if($(_oTableResponsive).height() + $(_oTableResponsive).scrollTop() == $(_oTableResponsive).children('table').height() && $(_oTableResponsive).data('load') == '0') {
        $(_oTableResponsive).data('load', '1');
        var nIndexStart = parseInt($(_oTableResponsive).data('current')),
            sTableSub = $(_oTableResponsive).data('table');
        restGET('media/' + $(_oTableResponsive).data('media') + '/many/' + sTableSub + '/more/' + nIndexStart, function(_oData) {
            var oTemplate = $(_oTableResponsive).find('tr.template').get(0),
                oTable = $(_oTableResponsive).find('tbody').get(0);
            $.each(_oData[sTableSub], function(_i, _oElement) {
                var oElemCopy = $(oTemplate).clone(true);
                $(oElemCopy).addClass('template-copy')
                            .addClass('reload-' + nIndexStart)
                            .removeClass('template');
                _oElement['i'] = nIndexStart + _i;
                var oMoment = moment.unix(_oElement['dCreate']);
                _oElement['dCreateString'] = oMoment.format('YYYY-MM-DD HH:mm');
                _oElement['dCreateFrom'] = oMoment.fromNow();
                $(oTable).append(replaceMarker(oElemCopy, _oElement));
            });
            setupLinks($(_oTableResponsive).find('tbody .template-copy.reload-' + nIndexStart));
            $(_oTableResponsive).data('current', nIndexStart + _oData[sTableSub].length).data('load', '0');
        });
    }
}

/**
 * Single detail page for a single homepage scrape.
 * 
 * @param {number}   _nId       UID of the given entry
 * @param {function} _fCallback callback to call as soon as finished
 */
function data_homepage__(_nId, _fCallback) {
    restGET('homepage/' + _nId, function(_oData) {
        $('#page_data-homepage-- h1.page-header')
            .text(_oData.media.sName + ' homepage on ' + moment.unix(_oData.homepage.dCreate).format('YYYY-MM-DD HH:mm'));
        _oData.homepage_ranking.sort(function(_oA, _oB) {
            _oA.nValue = parseInt(_oA.nValue);
            _oB.nValue = parseInt(_oB.nValue);
            if(_oA.nValue < _oB.nValue) return -1;
            else if(_oB.nValue < _oA.nValue) return 1;
            else return 0;
        });
        multiplyTemplate($('#page_data-homepage-- .template'), _oData.homepage_ranking);
        $.each(_oData.homepage_ranking, function(i, _oRanking) {
            restGET('article/' + _oRanking.nArtId, (function(_i) { return function(_oArticle) {
                $($('#page_data-homepage-- .template-copy .dCreate').get(_i)).text(moment.unix(_oArticle.article.dCreate).fromNow());
                $($('#page_data-homepage-- .template-copy .sUrl').get(_i)).text(_oArticle.article.sUrl);
                setupLinks($('#page_data-homepage--'));
            }})(i));
        });
        
        _fCallback();
    });
}

/**
 * Single detail page for a single highlight scrape.
 * 
 * @param {number}   _nId       UID of the given entry
 * @param {function} _fCallback callback to call as soon as finished
 */
function data_highlight__(_nId, _fCallback) {
    restGET('highlight/' + _nId, function(_oData) {
        $('#page_data-highlight-- h1.page-header')
            .text(_oData.media.sName + ' highlights on ' + moment.unix(_oData.highlight.dCreate).format('YYYY-MM-DD HH:mm'));
        _oData.highlight_ranking.sort(function(_oA, _oB) {
            _oA.nValue = parseInt(_oA.nValue);
            _oB.nValue = parseInt(_oB.nValue);
            if(_oA.nValue < _oB.nValue) return -1;
            else if(_oB.nValue < _oA.nValue) return 1;
            else return 0;
        });
        multiplyTemplate($('#page_data-highlight-- .template'), _oData.highlight_ranking);
        $.each(_oData.highlight_ranking, function(i, _oRanking) {
            restGET('article/' + _oRanking.nArtId, (function(_i) { return function(_oArticle) {
                $($('#page_data-highlight-- .template-copy .dCreate').get(_i)).text(moment.unix(_oArticle.article.dCreate).fromNow());
                $($('#page_data-highlight-- .template-copy .sUrl').get(_i)).text(_oArticle.article.sUrl);
                setupLinks($('#page_data-homepage--'));
            }})(i));
        });
        
        _fCallback();
    });
}

/**
 * Single data page for SNS posts.
 * 
 * @param {number}   _nId       UID of the given entry
 * @param {function} _fCallback callback to call as soon as finished
 */
function data_sns__(_nId, _fCallback) {
    restGET('sns/' + _nId, function(_oData) {
        $('#page_data-sns-- h1.page-header')
            .text(_oData.sns.sPlatformName + ' (' + _oData.sns.eType + ') for ' + _oData.media.sName);
        for(var i = 0; i < _oData.post.length; i++) {
            _oData.post[i]['dCreate'] = moment.unix(_oData.post[i]['dCreate']).format('YYYY-MM-DD HH:mm');
        }
        multiplyTemplate($('#page_data-sns-- tr.template'), _oData.post);
        
        $.each(_oData.post, function(i, _oPost) {
            restGET('post/' + _oPost.nPosId, (function(_i) { return function(_oPostDetail) {
                multiplyTemplate($($('#page_data-sns-- tr.template-copy li.template').get(_i)), _oPostDetail.post_mention);
                
                $.each(_oPostDetail.post_mention, function(j, _oPostMentionShallow) {
                    restGET('post_mention/' + _oPostMentionShallow.nPoMId, function(_oPostMentionDeep) {
                        var sSelector = '#page_data-sns-- tr.template-copy li.template-copy a[data-id="' + _oPostMentionDeep.article.nArtId + '"]';
                        $(sSelector).text(_oPostMentionDeep.article.sUrl);
                        setupLinks($(sSelector));
                    });
                });
            }})(i));
        });
        
        _fCallback();
    });
}

/**
 * Single detail page for a single article.
 * 
 * @param {number}   _nId       UID of the given entry
 * @param {function} _fCallback callback to call as soon as finished
 */
function data_article__(_nId, _fCallback) {
    restGET('article/' + _nId, function(_oArticle) {
        //main data
        $('#page_data-article-- .nCntHomepage').text(_oArticle.homepage_ranking.length);
        $('#page_data-article-- .nCntHighlight').text(_oArticle.highlight_ranking.length);
        $('#page_data-article-- .nCntUpdate').text(_oArticle.update.length);
        $('#page_data-article-- .nCntPostMention').text(_oArticle.post_mention.length);
        $('#page_data-article-- .sName').text(_oArticle.media.sName);
        $('#page_data-article-- .dCreateString').text(moment.unix(_oArticle.article.dCreate).format('YYYY-MM-DD HH:mm'));
        $('#page_data-article-- .dCreateFrom').text(moment.unix(_oArticle.article.dCreate).fromNow());
        $('#page_data-article-- .sUrl').text(_oArticle.article.sUrl);
        $('#page_data-article-- a.sUrl').attr('href', _oArticle.article.sUrl);
        //additional data (looking like main data)
        var oPImax = {},
            aPImax = [];
        $.each(_oArticle.popularity, function(i, _oPI) {
            _oPI.nValue = parseInt(_oPI.nValue);
            if(typeof(oPImax[_oPI.sType]) === 'undefined' || oPImax[_oPI.sType] < _oPI.nValue) {
                oPImax[_oPI.sType] = _oPI.nValue;
            }
        });
        $.each(oPImax, function(_sKey, _nValue) {
            aPImax.push({
                sType: _sKey,
                nCnt: _nValue
            });
        });
        multiplyTemplate($('#page_data-article-- .alert .template'), aPImax);
        //development
        var aDevelopment = [],
            bHeadlineSet = false;
        $.each(_oArticle.update, function(i, _oUpdate) {
            if(_oUpdate['sType'] == 'Headline' && bHeadlineSet == false) {
                $('#page_data-article-- .page-header').text(_oUpdate['sValue'])
                                                      .show();
                bHeadlineSet = true;
            }
            aDevelopment.push({
                nDevelopment: _oUpdate['dCreate'],
                dDevelopment: moment.unix(_oUpdate['dCreate']).format('YYYY-MM-DD HH:mm'),
                eDevelopment: _oUpdate['sType'] + ' update',
                sDevelopment: 'set to <em>' + _oUpdate['sValue'] + '</em>',
                sImage: _nId + '/' + _oUpdate['sValue'],
                bIsImage: _oUpdate['sType'] == 'Image' && _oUpdate['sValue'].indexOf('.') > 0 ? '1' : '0'
            });
        });
        if(!bHeadlineSet) {
            $('#page_data-article-- .page-header').hide();
        }
        $.each(_oArticle.post_mention, function(i, _oMention) {
            aDevelopment.push({
                nDevelopment: _oMention['dCreate'],
                dDevelopment: moment.unix(_oMention['dCreate']).format('YYYY-MM-DD HH:mm'),
                eDevelopment: 'mentioned on <span class="sSns" data-id="' + _oMention['nPosId'] + '"></span>',
                sDevelopment: '<span class="sPost" data-id="' + _oMention['nPosId'] + '"></span>',
                sImage: null,
                bIsImage: '0'
            });
            restGET('post/' + _oMention['nPosId'], function(_oPost) {
                $('#page_data-article-- .panel tr.template-copy .sPost[data-id="' + _oPost.post.nPosId + '"]').text(_oPost.post.sPost);
                $('#page_data-article-- .panel tr.template-copy .sSns[data-id="' + _oPost.post.nPosId + '"]').text(_oPost.sns.sPlatformName + ' (' + _oPost.sns.eType + ')');
            });
        });
        aDevelopment.sort(function(_oA, _oB) {
            _oA.nDevelopment = parseInt(_oA.nDevelopment);
            _oB.nDevelopment = parseInt(_oB.nDevelopment);
            if(_oA.nDevelopment > _oB.nDevelopment) return -1;
            else if(_oB.nDevelopment > _oA.nDevelopment) return 1;
            else return 0;
        });
        multiplyTemplate($('#page_data-article-- .panel tr.template'), aDevelopment);
        
        //charts
        $('#page_data-article-- .charts > .chart:first').text('... loading charts ...');
        window.setTimeout(function() {
            var nChartWidth = $('#page_data-article-- .charts').width();
            var nChartHeight = Math.round(nChartWidth/2);
            setupCommunicatorChart(
                $('#chart_data-article_ranking'), 
                nChartWidth, 
                nChartHeight, 
                _oArticle.homepage_ranking, 
                _oArticle.highlight_ranking, 
                _oArticle.update
            );
            setupRecipientChart(
                $('#chart_data-article_popularity'), 
                nChartWidth, 
                nChartHeight, 
                _oArticle.popularity,
                _oArticle.post_mention
            );
        }, 500);
        
        _fCallback();
    });
}