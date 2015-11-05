/* ==========================================================
 * wdesk-autoheight.js v1.3.0
 *
 * Applies a fixed CSS height to any component to
 * ensure that it fits within the vertical height of
 * the specified container.
 *
 * by Aaron Lademann
 * Copyright 2015 Workiva
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

    // AUTOHEIGHT CLASS DEFINITION
    // ===========================

    var Autoheight = function(element, options) {
        this.$element = $(element);
        this.options = this.getOptions(options);
        this.$container = $(this.options.container);

        if (this.$container.length > 1) {
            this.$container = this.$element.closest(this.options.container);

            if (this.$container.length > 1) {
                throw new Error('A single element must be declared as Autoheight.options.container. ' + this.$container.length + ' were found using the `' + this.options.container + '` option value.');
            }
        }

        this.containerIsBody = this.isBodyContainer();

        this.elemRelativeOffset = 0;
        this.totalElemOffsetHeight = 0;
        this.containerHeight = 0;
        this.elemHeight = 0;
        this.boundToResize = false;
    };

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-autoheight.js requires wf-vendor.js');
    }

    Autoheight.VERSION = '1.3.0';

    Autoheight.DEFAULTS = {
        edgePadding: 15,
        container: 'body',
        edge: 'bottom',
        minHeight: 100,
        bindToResize: true
    };

    Autoheight.prototype.getDefaults = function() {
        return Autoheight.DEFAULTS;
    };

    Autoheight.prototype.getOptions = function(options) {
        return $.extend({}, this.getDefaults(), this.$element.data(), options);
    };

    Autoheight.prototype.isBodyContainer = function() {
        var o = this.options;
        return o.container === document.body || o.container === 'body';
    };

    Autoheight.prototype.measureContainerHeight = function() {
        return this.containerIsBody ? document.documentElement.clientHeight : this.$container[0].clientHeight;
    };

    Autoheight.prototype.getContainerEdgePadding = function() {
        // Measure the amount of padding on the edge set in options
        // so that it will be factored into the final height set
        // for the element
        return parseInt(this.$container.css('padding-' + this.options.edge), 10);
    };

    Autoheight.prototype.getDocumentRootScrollTop = function() {
        // Account for the differences between browsers when getting
        // the scrollTop value of the root documentElement
        return Math.max(this.$container[0].scrollTop, document.documentElement.scrollTop);
    };

    Autoheight.prototype.getElemRelativeOffset = function() {
        var elemHeight = this.$element[0].clientHeight;
        var elemOffset = this.$element.offset();

        elemOffset = $.extend(elemOffset, {bottom: elemHeight + elemOffset.top});

        var containerScrollTop = this.containerIsBody ? this.getDocumentRootScrollTop() : this.$container.offset().top;
        var containerScroll = {
            top: containerScrollTop,
            bottom: containerScrollTop + this.containerHeight
        };

        var offsetDirection = this.options.edge === 'bottom' ? 'top' : 'bottom';
        var elemRelativeOffset = Math.abs(elemOffset[offsetDirection] - containerScroll[offsetDirection]);

        return elemRelativeOffset;
    };

    Autoheight.prototype.doesElemFitWithinContainerHeight = function() {
        // Top offset of element relative to the container element
        this.containerHeight = this.measureContainerHeight();
        this.elemRelativeOffset = this.getElemRelativeOffset();
        this.totalElemOffsetHeight = this.elemRelativeOffset + this.$element[0].clientHeight;

        return this.containerHeight > this.totalElemOffsetHeight;
    };

    Autoheight.prototype.setHeight = function() {
        // for unit test purposes only
        this.$element.trigger($.Event('_settingHeight.wdesk.autoheight'));

        if (!this.doesElemFitWithinContainerHeight()) {
            var containerInnerHeight = this.containerHeight - this.getContainerEdgePadding();
            this.elemHeight = Math.floor(containerInnerHeight - this.elemRelativeOffset - this.options.edgePadding);

            if (this.elemHeight <= 0) {
                // exit early, we never want to make something disappear.
                return;
            }

            if (this.elemHeight < this.options.minHeight) {
                this.$element.trigger($.Event('minHeightReached.wdesk.autoheight'));
            }

            this.$element.css('height', this.elemHeight);
            this.$element.trigger($.Event('ready.wdesk.autoheight'));
        }

        if (this.options.bindToResize) {
            this.bind();
        }

        return this.elemHeight;
    };

    Autoheight.prototype.updateHeight = function() {
        if (this.elemHeight === this.$element.outerHeight()) {
            // @see https://github.com/Workiva/web-skin/issues/982
            return false;
        }

        this.$element.css('height', '');
        this.setHeight();
    };

    Autoheight.prototype.bind = function() {
        if (this.boundToResize || !this.options.bindToResize) {
            // already bound, or should not be bound... get out of here
            return;
        }

        // If the viewport is the container, bind the resize event
        // to the updateHeight method
        if (this.containerIsBody) {
            var that = this;

            var _resizeAction = _.debounce(function() {
                that.updateHeight();
            }, 50);

            $(window).on('resize.wdesk.autoheight', _resizeAction);

            this.boundToResize = true;
        }
    };

    Autoheight.prototype.unbind = function() {
        // If the viewport is the container, unbind the resize event
        // to the updateHeight method
        if (this.containerIsBody) {
            this.$element.css('height', '');
            $(window).off('resize.wdesk.autoheight');

            this.boundToResize = false;
        }
    };

    Autoheight.prototype.destroy = function() {
        this.unbind();

        this.$element
            .off('.autoheight')
            .removeData('wdesk.autoheight');
    };


    // AUTOHEIGHT PLUGIN DEFINITION
    // ============================

    function Plugin(option) {
        return this.each(function() {
            var $element = $(this)
              , data     = $element.data('wdesk.autoheight')
              , options  = typeof option == 'object' && option
              , action;

            if (data) {
                action = 'updateHeight';
            } else {
                $element.data('wdesk.autoheight', (data = new Autoheight(this, options)));
                action = 'setHeight';
            }

            if (typeof option == 'string') {
                // A method was specfied
                data[option]();
            } else {
                // Use default method based on presence of Autoheight instance data
                data[action]();
            }
        });
    }

    var old = $.fn.autoheight;

    $.fn.autoheight             = Plugin;
    $.fn.autoheight.Constructor = Autoheight;


    // AUTOHEIGHT NO CONFLICT
    // ======================

    $.fn.autoheight.noConflict = function() {
        $.fn.autoheight = old;
        return this;
    };

});

if (define.isFake) {
    define = undefined;
}
