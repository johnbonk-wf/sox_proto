/* ==========================================================
 * wdesk-alert.js v1.3.0 (http://bit.ly/16ZHY1d)
 * adapted from bootstrap-alert v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery', 'wdesk-transition'],

function($) {

    'use strict';

    // ALERT CLASS DEFINITION
    // ======================

    var dismiss = '[data-dismiss="alert"]';

    var Alert = function(element, options) {
        this.options = options;
        this.$element = $(element).on('click', dismiss, this.hide);
    };

    if (!$.fn.emulateTransitionEnd) {
        throw new Error('wdesk-alert.js requires wdesk-transition.js');
    }
    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-alert.js requires wf-vendor.js');
    }

    Alert.VERSION = '1.3.0';

    Alert.DEFAULTS = {
        duration: 150,
        show: false // show as soon as .alert() is called?
    };

    Alert.prototype.show = function(event) {

        var that = this
          , $this = $(this)
          , selector = $this.attr('data-target')
          , $parent;

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
        }

        $parent = $(selector);

        if (event) {
            event.preventDefault();
        }

        if (! $parent.length) {
            $parent = $this.hasClass('alert') ? $this : $this.closest('.alert');
        }

        $parent.trigger(event = $.Event('show.wdesk.alert')); // allows subscription to $elem.on('show')

        if (event.isDefaultPrevented()) {
            return;
        }

        $parent.addClass('in')
                .attr('aria-hidden', false);

        function showAlert() {
            $parent.trigger('shown.wdesk.alert');
        }

        var transDuration = $.support.transition ? $parent.getTransitionDuration() : (this.options ? this.options.duration : Alert.DEFAULTS.duration);
        var transition  = $.support.transition && ($parent.hasClass('fade') || $parent.hasClass('slide') || $parent.hasClass('alert-toast'));

        transition ?
            $parent
                .one('wdeskTransitionEnd', showAlert)
                .emulateTransitionEnd(transDuration) :
            showAlert();
    };

    Alert.prototype.hide = function(event) {
        var $this = $(this);
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
        }

        var $parent = $(selector);

        if (event) {
            event.preventDefault();
        }

        if (! $parent.length) {
            $parent = $this.hasClass('alert') ? $this : $this.closest('.alert');
        }

        $parent.trigger(event = $.Event('hide.wdesk.alert'));

        if (event && event.isDefaultPrevented()) {
            return;
        }

        $parent.removeClass('in')
               .attr('aria-hidden', true);

        function removeAlert() {
            $parent
                .trigger('hidden.wdesk.alert')
                .remove();
        }

        var transDuration = $.support.transition ? $parent.getTransitionDuration() : (this.options ? this.options.duration : Alert.DEFAULTS.duration);
        var transition  = $.support.transition && ($parent.hasClass('fade') || $parent.hasClass('slide') || $parent.hasClass('alert-toast'));

        transition ?
            $parent
                .one('wdeskTransitionEnd', removeAlert)
                .emulateTransitionEnd(transDuration) :
            removeAlert();
    };


    // ALERT PLUGIN DEFINITION
    // =======================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
                , data = $this.data('wdesk.alert')
                , options = $.extend({}, Alert.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) {
                $this.data('wdesk.alert', (data = new Alert(this, options)));
            }
            if (typeof option == 'string') {
                data[option].call($this);
            }
        });
    }

    var old = $.fn.alert;

    $.fn.alert             = Plugin;
    $.fn.alert.Constructor = Alert;


    // ALERT NO CONFLICT
    // =================

    $.fn.alert.noConflict = function() {
        $.fn.alert = old;
        return this;
    };


    // ALERT DATA-API
    // ==============

    $(document).on('click.wdesk.alert.data-api', dismiss, Alert.prototype.hide);

});

if (define.isFake) {
    define = undefined;
}
