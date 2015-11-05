/**
* ua-sniffer-decorator.js for Web Skin
*
* This script decorates the <html> DOM element with
* CSS classes that contain information parsed from the user-agent string
*/

+function($) {

    // decorate the <html> tag
    // with browser / OS detection classes
    // provided by ua-sniffer.js
    var _brPrefix = 'ua-';
    var _osPrefix = 'os-';
    var _rangePrefix = 'lt-';
    var _client = $.client;

    var $uaBrowser = _client.browser;
    var $uaBrowserVersion = _client.version;
    var $uaBrowserVersionRange = _client.versionRange;
    var $uaOS = _client.os;
    var $uaDevice = _client.device;

    var $ua = _client.userAgent;
    var $vendor = _client.vendor;
    var $platform = _client.platform;

    var expandVersionRanges = function(minRange) {
        // since, for example, MSIE 8 is "less than" 9, it is also "less than" 10, 11, etc...
        // so we need to ensure that we provide an appropriate range so that individual CSS classes like
        // .ua-ie8, .ua-ie9, .ua-ie10 are all required to satisfy Web Skin's IE mixin
        // that uses an argument like @include ie('<11')
        minRange = parseInt(minRange);

        var rangeVersions = [
            minRange,
            minRange + 1,
            minRange + 2,
            minRange + 3,
            minRange + 4,
            minRange + 5
        ];

        var buildHtmlRangeClass = function(rangeVersion) {
            return _brPrefix + _rangePrefix + $uaBrowser + rangeVersion + ' ';
        };

        var rangeVersionClasses = '';

        for (var range in rangeVersions) {
            rangeVersionClasses += buildHtmlRangeClass(rangeVersions[range]);
        }

        return rangeVersionClasses;
    };

    // Uncomment this for debuggin
    // var debugMsg = "You are using " + $uaBrowser + $uaBrowserVersion + " with " + $uaOS + " running on a " + $uaDevice;
    // var debugXtra = "UA: " + $ua + "\n" + "vendor: " + $vendor + "\n" + "platform: " + $platform;
    // console.log(debugMsg);
    // console.log(debugXtra);
    var htmlClass = _brPrefix + $uaBrowser + ' ' +
                    _brPrefix + $uaBrowser + $uaBrowserVersion + ' ' +
                    expandVersionRanges($uaBrowserVersionRange) +
                    _osPrefix + $uaOS + ' ' +
                    $uaDevice + ' ';

    $('html').addClass(htmlClass.toLowerCase());

}(jQuery);
