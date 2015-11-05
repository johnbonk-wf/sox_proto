/**
* webskin-modernizr-tests.js for Web Skin
*
* Custom Modernizr Tests For Web Skin Wdesk Apps
* This gets appended to js/core/modernizr/modernizr-custom.js
* During the grunt `modernizr` task
*
*/

// Custom test for text-overflow
Modernizr.addTest('textoverflow', function() {
    var s = document.documentElement.style;
    return 'textOverflow' in s || 'OTextOverflow' in s;
});

// MSIE10 Surface touch support
// http://bit.ly/16w0P6w
Modernizr.addTest('mstouch', function() {
    return Modernizr.prefixed('MaxTouchPoints', navigator) > 1;
});
