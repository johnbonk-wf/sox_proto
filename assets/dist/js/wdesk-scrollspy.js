/* ==========================================================
 * wdesk-scrollspy.js v1.3.0 (http://bit.ly/13E6Cqd)
 * adapted from bootstrap-scrollspy v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery, window._);
    };
    define.isFake = true;
}

define(['jquery', 'lodash'],

function($, _) {

    'use strict';

    // SCROLLSPY CLASS DEFINITION
    // ==========================

    var ScrollSpy = function(element, options) {
        var self = this;
        var href;
        var process = _.throttle($.proxy(this.process, this), 35);

        this.$body          = $('body');
        this.$scrollElement = $(element).is('body') ? $(window) : $(element);
        this.options        = $.extend({}, ScrollSpy.DEFAULTS, options);
        this.selector       = (this.options.target
            || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
            || '') + ' .nav li > .hitarea';
        this.offsets        = [];
        this.targets        = [];
        this.activeTarget   = null;
        this.scrollHeight   = 0;

        this.$scrollElement.on('scroll.wdesk.scrollspy', process);
        this.refresh();
        this.process();
    };

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-scrollspy.js requires wf-vendor.js');
    }

    ScrollSpy.VERSION = '1.3.0';

    ScrollSpy.DEFAULTS = {
        offset: 10
    };

    ScrollSpy.prototype.getScrollHeight = function() {
        return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight);
    };

    ScrollSpy.prototype.refresh = function() {
        var offsetMethod = 'offset';
        var offsetBase   = 0;

        if (!$.isWindow(this.$scrollElement[0])) {
            if (!this.options.useOffset) {
                offsetMethod = 'position';
            }

            offsetBase = this.$scrollElement[0].scrollTop + this.options.offset;
        }

        this.offsets = [];
        this.targets = [];
        this.scrollHeight = this.getScrollHeight();

        var self = this;

        this.$body
            .find(this.selector)
            .map(function() {
                var $el   = $(this);
                var href  = $el.data('target') || $el.attr('href');
                var $href = /^#./.test(href) && $(href);

                return ($href
                    && $href.length
                    && $href.is(':visible')
                    && [[$href[offsetMethod]().top + offsetBase, href]]) || null;
            })
            .sort(function(a, b) { return a[0] - b[0]; })
            .each(function() {
                self.offsets.push(this[0]);
                self.targets.push(this[1]);
            });
    };

    ScrollSpy.prototype.process = function() {
        var scrollHeight = this.getScrollHeight();

        if (this.scrollHeight != scrollHeight) {
            this.refresh();
        }

        var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset;
        var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height();
        var offsets      = this.offsets;
        var targets      = this.targets;
        var activeTarget = this.activeTarget;
        var i;

        if (scrollTop >= maxScroll) {
            return activeTarget != (i = targets[targets.length - 1]) && this.activate(i);
        }

        if (activeTarget && scrollTop < offsets[0]) {
            this.activeTarget = null;

            this.clear();

            return this.$scrollElement.trigger($.Event('no-actives.wdesk.scrollspy'));
        }

        for (i = offsets.length; i--;) {
            activeTarget != targets[i]
                && scrollTop >= offsets[i]
                && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
                && this.activate(targets[i]);
        }
    };

    ScrollSpy.prototype.activate = function(target) {
        this.activeTarget = target;

        this.clear();

        var selector = this.selector +
            '[data-target="' + target + '"],' +
            this.selector + '[href="' + target + '"]';

        var active = $(selector)
            .parents('li')
            .addClass('active');

        if (active.parent('.dropdown-menu').length)  {
            active = active
                .closest('.dropdown')
                .addClass('active');
        }

        active.trigger($.Event('activate.wdesk.scrollspy'));
    };

    ScrollSpy.prototype.clear = function() {
        $(this.selector)
            .parentsUntil(this.options.target, '.active')
            .removeClass('active');
    };


    // SCROLLSPY PLUGIN DEFINITION
    // ===========================

    function Plugin(option) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('wdesk.scrollspy');
            var options = typeof option == 'object' && option;

            if (!data) $this.data('wdesk.scrollspy', (data = new ScrollSpy(this, options)));
            if (typeof option == 'string') data[option]();
        });
    }

    var old = $.fn.scrollspy;

    $.fn.scrollspy             = Plugin;
    $.fn.scrollspy.Constructor = ScrollSpy;


    // SCROLLSPY NO CONFLICT
    // =====================

    $.fn.scrollspy.noConflict = function() {
        $.fn.scrollspy = old;
        return this;
    };


    /* SCROLLSPY DATA-API
     * ================== */

    $(window).on('load.wdesk.scrollspy.data-api', function() {
        $('[data-spy="scroll"]').each(function() {
            var $spy = $(this);
            Plugin.call($spy, $spy.data());
        });
    });

});

if (define.isFake) {
    define = undefined;
}
