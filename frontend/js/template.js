/**
 * Based on a given template and an array full of data objects, duplicate the template and insert data-adjusted content below it.
 * 
 * @param {object} _oTemplate jQuery object of the template
 * @param {array}  _aData     array of data objects representing the newly created elements
 */
function multiplyTemplate(_oTemplate, _aData) {
    $(_oTemplate).nextAll('.template-copy').remove();
    var nIndex = _aData.length;
    for(var i = _aData.length - 1; i >= 0; i--) {
        var oElemCopy = $(_oTemplate).clone(true);
        $(oElemCopy).addClass('template-copy')
                    .removeClass('template');
        _aData[i]['i'] = nIndex;
        $(_oTemplate).after(replaceMarker(oElemCopy, _aData[i]));
        nIndex--;
    }
    setupLinks($(_oTemplate).nextAll('.template-copy'));
}

/**
 * Replaces all markers inside (!) a given element with the provided data.
 * Marker syntax follows {{...}}.
 * 
 * @param {object} _oElem jQuery object for which the inner html (!) will be replaced
 * @param {object} _oData JS object with key-value pairs
 * @return {object} the modified jQuery object
 */
function replaceMarker(_oElem, _oData) {
    var sHtml = $(_oElem).html();
    $.each(_oData, function(_sKey, _sValue) {
        sHtml = sHtml.split('{{if-' + _sKey + '-not-' + _sValue + '}}').join('hide');
        sHtml = sHtml.split('{{' + _sKey + '}}').join(_sValue);
    });
    $(_oElem).html(sHtml);
    return _oElem;
}