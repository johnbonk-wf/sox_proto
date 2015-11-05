/*
    JavaScript utility functions used for Web Skin documentation
*/

!function($) { $(function() {
    $.getQueryVariable = function(variable) {
        if (window.location.search) {
            var query = window.location.search.substring(1);
            var vars = query.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (decodeURIComponent(pair[0]) == variable) {
                    return decodeURIComponent(pair[1]);
                }
            }
        } else if (window.history.state) {
            var queries = window.history.state;
            for (var query in queries) {
                if (query == variable) {
                    return decodeURIComponent(queries[query]).toString();
                }
            }
        } else {
            return null;
        }
        // console.log('Query variable %s not found', variable);
    }

    $.fn.serializeObject = function() {

        var o = {};

        if (typeof _ != 'function') {
            throw new Error('$.fn.serializeObject requires lodash.underscore.js');
        } else {
            var a = this.serializeArray();
            $.each(a, function() {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
        }

        return o;
    };
});}(jQuery);

var compareObjects = function(obj1, obj2, _Q) {
    _Q = (_Q == undefined)? new Array : _Q;

    function size(obj) {
        var size = 0;
        for (var keyName in obj) {
            if (keyName != null) {
                size++;
            }
        }
        return size;
    }

    if (size(obj1) != size(obj2)) {
        //console.log('JSON compare - size not equal > '+keyName)
    }

    var newO2 = jQuery.extend(true, {}, obj2);

    for(var keyName in obj1) {
        var value1 = obj1[keyName],
            value2 = obj2[keyName],
            equal  = null;

        delete newO2[keyName];

        if (typeof value1 != typeof value2 && value2 == undefined) {
            _Q.push(['missing', keyName, value1, value2, obj1]);
        } else if (typeof value1 != typeof value2) {
            _Q.push(['diffType', keyName, value1, value2, obj1]);
        } else {
            // For jQuery objects:
            if (value1 && value1.length && (value1[0] !== undefined && value1[0].tagName)) {
                if (!value2 || value2.length != value1.length || !value2[0].tagName || value2[0].tagName != value1[0].tagName) {
                    _Q.push(['diffJqueryObj', keyName, value1, value2, obj1]);
                }
            } else if (value1 && value1.length && (value1.tagName !== value2.tagName)) {
                _Q.push(['diffHtmlObj', keyName, value1, value2, obj1]);
            } else if (typeof value1 == 'function' || typeof value2 == 'function') {
                _Q.push(['function', keyName, value1, value2, obj1]);
            } else if (typeof value1 == 'object') {
                equal = Arcadia.Utility.CompareJson(value1, value2, _Q);
            } else if (value1 != value2) {
                _Q.push(['diffValue', keyName, value1, value2, obj1]);
            }
        };
    }

    for(var keyName in newO2) {
        _Q.push(['new', keyName, obj1[keyName], newO2[keyName], newO2]);
    }

    return _Q;
}; // END compareObjects()
