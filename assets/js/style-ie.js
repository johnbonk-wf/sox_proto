var isIE = $.client.browser == 'IE';

if (isIE) {
    $(window).on('load', function(event) {
        var $currentStylesheetLink = $('link[title]');
        var currentStylesheet = $currentStylesheetLink.attr('href')
        var newStylesheet = currentStylesheet.replace('wdesk', 'wdesk_ie');
        $currentStylesheetLink.attr('href', newStylesheet);
    });
}
