/*!
 * JS Analytics for Web Skin Documentation
 */


// -------------------------------------
//   GA CORE
// -------------------------------------

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');



// -------------------------------------
//   GA HELPERS
// -------------------------------------
    var toTitleCase = function(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    // custom pageview so we can track landing pages where
    // folks are permalinking # locations within a page
    var hash = location.hash.replace('#', ''); // remove #
    var hashTitle = hash.replace(/-/g, ' '); // replace dashes with spaces

    var fullLocation = location.pathname + location.search + hash;
    var gaPage = fullLocation.replace('/index.html', '/'); // remove potential index.html
    var fullLocation = window.location.protocol + '//' + window.location.hostname + gaPage; // set location

    // ----- SET GA PARAMETERS ----- //
    ga('create', 'UA-17703918-45', 'auto');

    if (hash.length) {
        ga('set', 'title', toTitleCase(hashTitle) + ' · ' + document.title);
    } else {
        ga('set', 'title', document.title);
    }

    ga('set', 'location', fullLocation);

    // ----- TRACK PAGEVIEW ----- //
    ga('send', 'pageview');



// -------------------------------------
//   Global Click Tracking Methods
// -------------------------------------

    function a11yClick(event) {
        if (event) {
            if (event.target) {
                var linkText = $(event.target);

                try {
                    ga("send", "event", "A11y Resources", linkText);
                } catch(err) {

                }
            }
        }
    }
