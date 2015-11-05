/* ==========================================================
 * wdesk-popover.js v1.3.0 (http://bit.ly/14HLYaP)
 * adapted from bootstrap-popover v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery', 'wdesk-tooltip'],

function($) {

    'use strict';


    // POPOVER PUBLIC CLASS DEFINITION
    // ===============================

    var Popover = function(element, options) {
        this.init('popover', element, options);
    };

    if (!$.fn.tooltip) {
        throw new Error('wdesk-popover.js requires wdesk-tooltip.js');
    }
    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-popover.js requires wf-vendor.js');
    }

    Popover.VERSION = '1.3.0';

    Popover.DEFAULTS = $.extend({} , $.fn.tooltip.Constructor.DEFAULTS, {
        html: true
      , placement: 'bottom'
      , trigger: 'click'
      , content: ''
      , angularContent: false
      , modal: true
      , autoHeightMinHeight: 200
      , template: '<div class="popover" role="tooltip"><div class="arrow" aria-hidden="true"></div><div class="inner"><h3 class="title"></h3><div class="content"></div></div></div>'
      , backdrop: '<div class="popover-backdrop backdrop" role="presentation"></div>'
    });


    // NOTE: POPOVER EXTENDS wdesk-tooltip.js
    // ======================================

    Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

    Popover.prototype.constructor = Popover;

    Popover.prototype.getDefaults = function() {
        return Popover.DEFAULTS;
    };

    Popover.prototype.setContent = function() {
        var $tip              = this.tip();
        var title             = this.getTitle();
        var content           = this.getContent();
        var o                 = this.options;
        var $backdrop         = this.backdrop();
        var $angularContainer = $tip.find('.inner');

        var injectionMethod = function(content) {
            // we use append for html objects to maintain their js events: http://bit.ly/1pFNeW4
            return typeof content === 'string' ? 'html' : 'append';
        };

        if (o.angularContent === true) {
            $angularContainer.empty()[injectionMethod(content)](content);
        } else {
            if (title) {
                $tip.find('.title')[
                    this.options.html ? (injectionMethod(title)) : 'text'
                ](title);
            }
            if (content) {
                $tip.find('.content').empty()[
                    this.options.html ? (injectionMethod(content)) : 'text'
                ](content);
            }
        }

        $tip.removeClass('fade top bottom left right in');

        //
        // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
        // this manually by checking the contents.
        //
        var $tipTitle = $tip.find('.title');
        if (!$tipTitle.html()) {
            $tipTitle.hide();
        }
    };

    Popover.prototype.hasContent = function() {
        return this.getTitle() || this.getContent();
    };

    Popover.prototype.hasInPageContent = function() {
        var o = this.options;
        return o.content ? o.content.toString().charAt(0) === '#' : false;
    };

    Popover.prototype.storeContent = function(html, $container) {
        var storedContent = true;
        try {
            this.$element.data('stored-content', html);
        } catch(err) {
            // did not succeed storing the content
            storedContent = false;
        }
        if (storedContent && this.$element.data('content-container') === 'temporary') {
            // don't need this now
            $container.remove();
        }
    };

    Popover.prototype.getContent = function() {
        var $e = this.$element;
        var o  = this.options;
        var content = $e.attr('data-content') || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content);

        //
        // if the first character of data-content is a hash
        // lets assume we want to populate the content using
        // the html content of the elem on the page with matching id
        // this is useful for injecting django template DOM into menus
        //
        if (o.content) {
            if (this.hasInPageContent()) {
                // existing content on the page as target
                var $contentContainer = $(o.content);
                var storedContent = $e.data('stored-content');

                if ($contentContainer.length > 0 || storedContent) {
                    content = storedContent || $contentContainer.html();
                    // store this in data so we can remove the reference content container
                    if (!storedContent && $contentContainer.length > 0) {
                        this.storeContent(content, $contentContainer);
                    }
                }
            }
        }

        return content;
    };

    Popover.prototype.arrow = function() {
        return (this.$arrow = this.$arrow || this.tip().find('.arrow'));
    };

    Popover.prototype.tip = function() {
        if (!this.$tip) {
            this.$tip = $(this.options.template);
        }
        return this.$tip;
    };

    Popover.prototype.backdrop = function() {
        if (!this.$backdrop) {
            this.$backdrop = $(this.options.backdrop);
        }
        return this.$backdrop;
    };


    // POPOVER PLUGIN DEFINITION
    // =========================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('wdesk.popover');
            var options = typeof option == 'object' && option;

            if (!data) {
                if (option == 'destroy') {
                    return;
                }
                $this.data('wdesk.popover', (data = new Popover(this, options)));
            }
            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    var old = $.fn.popover;

    $.fn.popover             = Plugin;
    $.fn.popover.Constructor = Popover;


    // POPOVER NO CONFLICT
    // ===================

    $.fn.popover.noConflict = function() {
        $.fn.popover = old;
        return this;
    };

});

if (define.isFake) {
    define = undefined;
}
