$(function() {
    /**
     * LOGIN / LOGOUT
     * */
    $('#navigation a[href*="#login"]').on('click', function(_oEvent) {
        _oEvent.preventDefault();
        logout();
        return false;
    });
    $('#page_login form').on('submit', function(_oEvent) {
        _oEvent.preventDefault();
        load();
        checkPassword($('#page_login form input').val(), function(_bIsCorrect) {
            if(_bIsCorrect) {
                login();
            } else {
                alert('Incorrect password given.');
                logout();
            }
        });
        return false;
    });
    
    
    /**
     * MENU and other NAVigation links
     * */
    setupLinks($('body'));
    $(window).on('hashchange', function() {
        navigate();
    });
    
    
    /**
     * SEARCH
     * */
    $('#navigation_search').on('keydown', function(_oEvent) {
        var sQ = $(_oEvent.currentTarget).val().trim().toLowerCase();
        if(_oEvent.keyCode == 27) {
            sessionStorage.setItem('sQ', '');
            $(_oEvent.currentTarget).val('');
            multiplyTemplate($('#navigation .navbar-form .dropdown-menu .template.media'), []);
            multiplyTemplate($('#navigation .navbar-form .dropdown-menu .template.article'), []);
            multiplyTemplate($('#navigation .navbar-form .dropdown-menu .template.sns'), []);
        } else if((sessionStorage.getItem('sQ') != sQ || _oEvent.keyCode == 13) && sQ != '') {
            sessionStorage.setItem('sQ', sQ);
            restGET('find/' + encodeURIComponent(sQ.split('/').join('%')), function(_oData) {
                if(typeof(_oData) == 'object') {
                    if(typeof(_oData['article']) !== 'undefined' && typeof(_oData['media']) !== 'undefined' && typeof(_oData['sns']) !== 'undefined') {
                        multiplyTemplate($('#navigation .navbar-form .dropdown-menu .template.media'), _oData['media'].slice(0, 5));
                        multiplyTemplate($('#navigation .navbar-form .dropdown-menu .template.article'), _oData['article'].slice(0, 5));
                        multiplyTemplate($('#navigation .navbar-form .dropdown-menu .template.sns'), _oData['sns'].slice(0, 5));
                        setupLinks($('#navigation .navbar-form .dropdown-menu .template-copy'));
                    }
                }
            });
        }
    });
    
    
    /**
     * enable TOOLTIPs
     * */
    $('[data-toggle="tooltip"]').tooltip();
    
    /**
     * PING status
     * */
    setInterval(function() {
        if(sessionStorage.getItem('bLogin') === 'true') {
            var nTimeLeft = parseInt($('.upnext').text());
            nTimeLeft--;
            if(nTimeLeft <= 0) {
                checkPing();
                nTimeLeft = 300;
            }
            $('.upnext').text(nTimeLeft);
        }
    }, 1000);
    $('#navigation_ping').on('click', function(_oEvent) {
        _oEvent.preventDefault();
        $('.upnext').text('0');
        return false;
    });
    
    /**
     * INITial (last) page
     * */
    navigate();
});