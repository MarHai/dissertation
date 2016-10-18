/**
 * Display the loading screen.
 */
function load() {
    $('body > .container, body > .container-fluid').hide();
    $('#page_load').show();
}

/**
 * Save the current navigation to both session storage and URL.
 * 
 * @param {string} _sPage page identifier
 * @param {number} _nId   if given, identifies current detail entry (null otherwise)
 */
function saveNavigate(_sPage, _nId) {
    sessionStorage.setItem('sPage', _sPage);
    var sNewLink = document.location.href.split('#')[0] + '#' + _sPage;
    if(typeof(_nId) !== 'undefined' && _nId !== null) {
        sessionStorage.setItem('nPageId', _nId);
        sNewLink += '!' + _nId;
    }
    document.location.href = sNewLink;
}

/**
 * Display a certain page and save this page to the sessionStorage in order to provide refresh functionality.
 * If navigated to an actual page (other than login), tries to call setup function (where - is replace with _).
 * 
 * @param {string} _sPage page name to navigate to
 * @param {mixed}  _mElem jQuery link element (necessary for IDs within detail pages) or numeric ID
 */
function navigate(_sPage, _mElem) {
    load();
    if(sessionStorage.getItem('bLogin') === 'true') {
        //identify page to navigate to (either from parameters, URL, sessionStorage, or default)
        if(typeof(_sPage) === 'undefined' || _sPage === null) {
            if(document.location.href.indexOf('#') > 0) {
                _sPage = document.location.href.split('#')[1];
                if(_sPage.indexOf('!') > 0) {
                    _sPage = _sPage.split('!');
                    _mElem = parseInt(_sPage[1]);
                    _sPage = _sPage[0];
                }
            } else {
                _sPage = sessionStorage.getItem('sPage');
                _mElem = parseInt(sessionStorage.getItem('nPageId'));
            }
            if(typeof(_sPage) === 'undefined' || _sPage === null) {
                _sPage = 'data-media';
            }
        }
        //navigate
        var sPageFunction = _sPage.split('-').join('_');
        if(typeof(window[sPageFunction]) === 'undefined') {
            $('#page_load').hide();
            $('#navigation, #page_' + _sPage).show();
            saveNavigate(_sPage);
        } else {
            if(sPageFunction.length > 2 && sPageFunction.indexOf('__') > 0 && typeof(_mElem) !== 'undefined') {
                if(isNaN(_mElem)) {
                    _mElem = $(_mElem).data('id')*1;
                }
            }
            if(sPageFunction.length > 2 && sPageFunction.indexOf('__') > 0) {
                window[sPageFunction](_mElem, function() {
                    $('#page_load').hide();
                    $('#navigation, #page_' + _sPage).show();
                    saveNavigate(_sPage, _mElem)
                });
            } else {
                window[sPageFunction](function() {
                    $('#page_load').hide();
                    $('#navigation, #page_' + _sPage).show();
                    saveNavigate(_sPage);
                });
            }
        }
    } else {
        if(document.location.href.indexOf('#') > 0) {
            document.location.href = document.location.href.split('#')[0];
        }
        $('#page_load, #navigation').hide();
        $('#page_login').show();
        _sPage = 'login';
    }
    if(_sPage == 'login') {
        $('#navigation a[href*="#login"]').get(0).focus();
    }
}

/**
 * Set login flag and navigate to last saved (or default) page.
 */
function login() {
    sessionStorage.setItem('bLogin', true);
    navigate();
}

/**
 * Destroy login flag and navigate to login page.
 */
function logout() {
    sessionStorage.setItem('bLogin', false);
    navigate('login');
}

/**
 * Setup link event handler for a given parent element.
 * 
 * @param {object} _oParent jQuery object in which to search for links
 */
function setupLinks(_oParent) {
    $(_oParent).find('a.navigate').off('click').on('click', function(_oEvent) {
        _oEvent.preventDefault;
        var aLink = this.href.split('#');
        navigate(aLink[1], this);
        return false;
    });
}

/**
 * Check ping entries and visualized them.
 */
function checkPing() {
    restGET('ping', function(_oData) {
        $.each(_oData, function(_sKey, _oPing) {
            var oMoment = moment.unix(_oPing.dCreate);
            $('.ping.' + _sKey).removeClass('text-success')
                               .removeClass('text-danger')
                               .addClass(moment().diff(oMoment, 'minutes') < 10 ? 'text-success' : 'text-danger')
                               .attr('data-original-title', 
                                     'Ran ' + _oPing.nCount + ' times so far. ' +
                                     'Last ping took place ' + oMoment.fromNow() + ' (i.e., on ' + oMoment.format('YYYY-MM-DD HH:mm') + ')' +
                                     ' and lasted for ' + _oPing.nTime + 'ms. ' +
                                     'On average, ' + _oPing.sSource + ' processes take ' + _oPing.nMean + 'ms.');
        });
        $('.ping:not(.text-success):not(.text-danger)').addClass('text-muted')
                                                       .attr('title', 'No ping data found (i.e., this has never run).');
    });
}