/* ==========================================================
 * wdesk-tooltip.js v1.3.0 (http://bit.ly/12iYtta)
 * adapted from bootstrap-tooltip v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery, window._);
    };
    define.isFake = true;
}

define(['jquery', 'lodash', 'wdesk-transition', 'wdesk-autoheight'],

function($, _) {

    'use strict';


    // TOOLTIP PUBLIC CLASS DEFINITION
    // ===============================

    var Tooltip = function(element, options) {
        this.type           =
        this.options        =
        this.enabled        =
        this.timeout        =
        this.transDuration  =
        this.hoverState     =
        this.isFollowing    =
        this.$element       = null;
        this.$innerElem     = null;
        this.boundToAutoHeight = false;
        this.updatingExistingPlacement = false;
        this.changingExistingPlacementDirection = false;

        this.cursorOffset   = 20; // how tall is the mouse cursor (for `follow` placement option)

        this.init('tooltip', element, options);
    };

    if (!$.fn.emulateTransitionEnd) {
        throw new Error('wdesk-tooltip.js requires wdesk-transition.js');
    }

    if (!$.fn.autoheight) {
        throw new Error('wdesk-tooltip.js requires wdesk-autoheight.js');
    }

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-tooltip.js requires wf-vendor.js');
    }

    Tooltip.VERSION = '1.3.0';

    Tooltip.DEFAULTS = {
        animation: true
      , html: false
      , placement: 'top'
      , selector: false
      , template: '<div class="tooltip" role="tooltip"><div class="arrow" aria-hidden="true"></div><div class="inner"></div></div>'
      , trigger: 'hover focus'
      , title: ''
      , delay: 0
      , duration: 150
      , container: false
      , persist: false
      , modal: false
      , backdrop: '<div class="tooltip-backdrop backdrop" role="presentation"></div>'
      , angularContent: false
      , viewport: {
            selector: 'body',
            padding: 0
        }
    };

    Tooltip.prototype.init = function(type, element, options) {
        this.enabled    = true;
        this.type       = type;
        this.$element   = $(element);
        this.options    = this.getOptions(options);
        this.$viewport  = this.options.viewport && $(this.options.viewport.selector || this.options.viewport);

        var triggers = this.options.trigger.split(' ');

        for (var i = triggers.length; i--;) {
            var trigger = triggers[i];

            if (trigger == 'click') {
                this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
            } else if (trigger != 'manual') {
                var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin';
                var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout';

                this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
                this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));
            }
        }

        this.options.selector ?
            (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
            this.fixTitle();
    };

    Tooltip.prototype.getDefaults = function() {
        return Tooltip.DEFAULTS;
    };

    Tooltip.prototype.getOptions = function(options) {
        options = $.extend({}, this.getDefaults(), this.$element.data(), options);

        // if placement option is follow, we need to delay the hide a little bit to make it
        // easier for people to hover a small object without having the tooltip flicker
        // because its too "sensitive"
        if (options.placement === 'follow') {
            options.delay = {
                show: 0,
                hide: 200
            };

            // if follow placement option chosen, the tip must be placed
            // in the body so we can use .mousemove() api
            options.container = 'body';
        }

        if (options.delay && typeof options.delay == 'number') {
            options.delay = {
                show: options.delay
              , hide: options.delay
            };
        }

        return options;
    };

    Tooltip.prototype.getDelegateOptions = function() {
        var options  = {};
        var defaults = this.getDefaults();

        this._options && $.each(this._options, function(key, value) {
            if (defaults[key] != value) options[key] = value;
        });

        return options;
    };

    Tooltip.prototype.getTransDuration = function() {
        return this.transDuration = $.support.transition ? this.$tip.getTransitionDuration() : this.options.duration;
    };

    Tooltip.prototype.hasModality = function() {
        var o = this.options;
        return o.modal && (o.trigger == 'click' || o.trigger == 'manual');
    };

    Tooltip.prototype.enter = function(obj) {
        var self = obj instanceof this.constructor ?
            obj : $(obj.currentTarget).data('wdesk.' + this.type);

        if (self && self.$tip && self.$tip.is(':visible')) {
            self.hoverState = 'in';
            return;
        }

        if (!self) {
            self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
            $(obj.currentTarget).data('wdesk.' + this.type, self);
        }

        clearTimeout(self.timeout);

        self.hoverState = 'in';

        if (!self.options.delay || !self.options.delay.show) {
            return self.show(obj);
        }

        self.timeout = setTimeout(function() {
            if (self.hoverState == 'in') {
                self.show(obj);
            }
        }, self.options.delay.show);
    };

    Tooltip.prototype.leave = function(obj) {
        var self = obj instanceof this.constructor ?
            obj : $(obj.currentTarget).data('wdesk.' + this.type);

        if (!self) {
            self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
            $(obj.currentTarget).data('wdesk.' + this.type, self);
        }

        clearTimeout(self.timeout);

        self.hoverState = 'out';

        if (!self.options.delay || !self.options.delay.hide) {
            return self.hide();
        }

        self.timeout = setTimeout(function() {
            if (self.hoverState == 'out') {
                self.hide();
            }
        }, self.options.delay.hide);
    };

    Tooltip.prototype.show = function(enterEvent) {
        var e = $.Event('show.wdesk.' + this.type);
        var o = this.options;

        if (this.hasContent() && this.enabled) {
            this.$element.trigger(e);

            var inDom = $.contains(document.documentElement, this.$element[0]);

            if (e.isDefaultPrevented() || !inDom) {
                return;
            }

            var that = this; // must localize this to get it to pass through setTimeout below

            var $tip = this.tip();
            var $innerElem = this.getInnerElem();
            var $backdrop = this.backdrop();
            var tipId = typeof(this.$element.attr('data-target')) == 'string' ?
                this.$element.attr('data-target') :
                this.getUID(this.type);

            this.enableKeyboardNavigation();
            this.setContent();
            $tip.attr('id', tipId);
            this.$element.attr('aria-describedby', tipId);

            if (o.animation) {
                $tip.addClass('fade');
                if (this.hasModality()) {
                    $backdrop.addClass('fade');
                }
            }

            var mousePos  = enterEvent ? { left: enterEvent.clientX, top: enterEvent.clientY } : { left: 0, top: 0 };
            var placement = typeof o.placement == 'function' ?
                o.placement.call(this, $tip[0], this.$element[0]) :
                o.placement;

            var autoToken = /\s?auto?\s?/i;
            var autoPlace = autoToken.test(placement);
            if (autoPlace) {
                placement = placement.replace(autoToken, '') || Tooltip.DEFAULTS.placement;
            }

            $tip
                .detach()
                .css({ top: 0, left: 0, display: 'block' })
                .addClass(placement)
                .data('wdesk.' + this.type, this);

            if (this.hasModality()) {
                $backdrop
                    .css({ top: 0, left: 0, display: 'block' })
                    .attr('id', tipId + '_backdrop');

                // close tooltip if backdrop is clicked
                $backdrop.on('click.wdesk.' + this.type, $.proxy(this.hide, this, false));
            }

            if (o.container) {
                $tip.appendTo(o.container);
                if (this.hasModality()) {
                    $backdrop.insertAfter($tip);
                }
            } else {
                $tip.insertAfter(this.$element);
                if (this.hasModality()) {
                    $backdrop.appendTo(document.body);
                }
            }

            var showAndPlace = function() {
                // Ensure that subsequent calls to setupPlacement result in same placement
                that.setupPlacement(mousePos);

                var complete = function() {
                    var prevHoverState = that.hoverState;
                    that.$element.trigger('shown.wdesk.' + that.type);
                    that.hoverState = null;

                    if (prevHoverState == 'out') {
                        that.leave(that);
                    }
                };

                var transDuration = that.getTransDuration();

                $.support.transition && that.$tip.hasClass('fade') ?
                    $tip
                        .one('wdeskTransitionEnd', complete)
                        .emulateTransitionEnd(transDuration) :
                    complete();
            };

            if (o.angularContent) {
                // we need to delay just a bit before measuring this
                // because angular must inject our content before the container will be sized accordingly.
                setTimeout(showAndPlace, 5);
            } else {
                showAndPlace();
            }

            // update the position of the tooltip as the window is resized
            var updatePlacement = _.debounce(function() {
                that.updatingExistingPlacement = true;
                that.changingExistingPlacementDirection = false;
                that.setupPlacement(mousePos);
                that.$element.trigger('update.wdesk.' + that.type);
            }, 50);

            $(window)
                .on('resize.wdesk.' + that.type, updatePlacement)
                .on('orientationchange.wdesk.' + that.type, updatePlacement);

        } // END if (this.hasContent() && this.enabled)
    }; // END show()

    Tooltip.prototype.getCalculatedOffset = function(placement, btnOffset, actualWidth, actualHeight) {
        return placement == 'bottom' ? { top: btnOffset.top + btnOffset.height, left: btnOffset.left + btnOffset.width / 2 - actualWidth / 2 } :
               placement == 'top'    ? { top: btnOffset.top - actualHeight,     left: btnOffset.left + btnOffset.width / 2 - actualWidth / 2 } :
               placement == 'left'   ? { top: btnOffset.top + btnOffset.height / 2 - actualHeight / 2, left: btnOffset.left - actualWidth    } :
            /* placement == 'right' */ { top: btnOffset.top + btnOffset.height / 2 - actualHeight / 2, left: btnOffset.left + btnOffset.width};
    };

    Tooltip.prototype.getViewportAdjustedDelta = function(placement, pos, actualWidth, actualHeight) {
        var delta = { top: 0, left: 0 };
        if (!this.$viewport) {
            return delta;
        }

        var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
        var viewportDimensions = this.getPosition(this.$viewport);

        if (/right|left/.test(placement)) {
            var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll;
            var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
            if (topEdgeOffset < viewportDimensions.top) { // top overflow
                delta.top = viewportDimensions.top - topEdgeOffset;
            } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
                delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
            }
        } else {
            var leftEdgeOffset  = pos.left - viewportPadding;
            var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
            if (leftEdgeOffset < viewportDimensions.left) { // left overflow
                delta.left = viewportDimensions.left - leftEdgeOffset;
            } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
                delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
            }
        }

        return delta;
    };

    Tooltip.prototype.setupPlacement = function(mousePos) {
        var that = this;
        var $tip = this.tip();
        var $innerElem = this.getInnerElem();
        var o    = this.options;

        //
        // Leave early if selector option was used,
        // but specified selector has not loaded in DOM yet (MSIE 8)
        //
        if (!$tip[0]) {
            return;
        }

        var placement = typeof o.placement == 'function' ?
            o.placement.call(this, $tip[0], this.$element[0]) :
            o.placement;
        var _placement = placement;

        var autoToken = /\s?auto?\s?/i;
        var autoPlace = autoToken.test(placement);
        if (autoPlace) {
            placement = placement.replace(autoToken, '') || Tooltip.DEFAULTS.placement;
        }

        // if placement is 'follow', our "btn" that we want to align the tooltip to, is the mouse cursor position.
        var btnOffset = o.placement === 'follow' ?
            $.extend(mousePos, { width: 0, height: this.cursorOffset, top: mousePos.top }) :
            this.getPosition(); // a.k.a "pos"

        var actualWidth  = $tip[0].offsetWidth;
        var actualHeight = $tip[0].offsetHeight;

        if (o.placement === 'follow') {
            _placement = 'bottom';
            $tip.addClass('bottom');
        }

        if (autoPlace) {
            var $container      = this.options.container ? $(this.options.container) : (this.$element.parent() || $(document.body)); // second part of || is just to make unit tests happy
            var containerDim    = this.getPosition($container); // a.k.a "container"

            var _minHeightReached = function(placement, fallback) {
                var minHeightReached;

                if (that.useAutoHeightLogic()) {
                    var autoHeightMinHeight = that.options.autoHeightMinHeight || $.fn.autoheight.Constructor.DEFAULTS.minHeight;
                    var pendingHeight; // height the popover would have applied if it passes through the logic gates

                    if (placement == 'top') {
                        pendingHeight = btnOffset.top - containerDim.top_rel;
                    } else if (placement == 'bottom') {
                        pendingHeight = containerDim.bottom_rel - btnOffset.bottom;
                    } else {
                        // something went wrong... should only use this logic helper fn if placement is top or bottom
                    }

                    minHeightReached = pendingHeight < autoHeightMinHeight;
                } else {
                    // autoHeight logic will not be used, which means the
                    // calculations involving `actualHeight` will return a valid result
                    minHeightReached = fallback;
                }

                return minHeightReached;
            };

            placement = placement == 'bottom' && _minHeightReached(placement, btnOffset.bottom + actualHeight > containerDim.bottom_rel) ? 'top'    :
                        placement == 'top'    && _minHeightReached(placement, btnOffset.top    - actualHeight < containerDim.top_rel)    ? 'bottom' :
                        placement == 'right'  && btnOffset.right  + actualWidth  > containerDim.width                                    ? 'left'   :
                        placement == 'left'   && btnOffset.left   - actualWidth  < containerDim.left                                     ? 'right'  :
                        placement;

            _placement = placement;

            if (!$tip.hasClass(placement)) {
                $tip
                    .removeClass('bottom top right left')
                    .addClass(placement);
                this.changingExistingPlacementDirection = true;
            }
        }

        var calculatedOffset = this.getCalculatedOffset(_placement, btnOffset, actualWidth, actualHeight);

        this.applyPlacement(calculatedOffset, _placement, autoPlace);

        if (o.placement === 'follow' && !this.isFollowing) {
            // while mouse is moving within the bounds of the tooltip trigger elem...
            // keep updating the position.
            this.$element.on('mousemove.wdesk.' + that.type, function(e) {
                btnOffset = $.extend(btnOffset, { left: e.pageX, top: e.pageY });
                calculatedOffset = that.getCalculatedOffset('bottom', btnOffset, actualWidth, actualHeight);

                // update mousePos
                that.setupPlacement({ left: e.pageX, top: e.pageY });

                // make sure we don't bind this twice.
                that.isFollowing = true;
            });
        }
    };

    Tooltip.prototype.applyPlacement = function(offset, placement, isAutoPlacement) {
        var that = this;
        var replace = placement === 'follow' ? true : false;
        var $tip    = this.tip();
        var $backdrop = this.backdrop();
        var width  = $tip[0].offsetWidth;
        var height = $tip[0].offsetHeight;

        // if placement is follow - set it to bottom so we get an arrow
        placement = placement === 'follow' ? 'bottom' : placement;

        // manually read margins because getBoundingClientRect includes difference
        var marginTop  = parseInt($tip.css('margin-top'), 10);
        var marginLeft = parseInt($tip.css('margin-left'), 10);

        // we must check for NaN for ie 8/9
        if (isNaN(marginTop))  marginTop  = 0;
        if (isNaN(marginLeft)) marginLeft = 0;

        offset.top  = offset.top  + marginTop;
        offset.left = offset.left + marginLeft;

        // $.fn.offset doesn't round pixel values
        // so we use setOffset directly with our own function
        $.offset.setOffset($tip[0], $.extend({
            using: function(props) {
                $tip.css({
                    top:  Math.round(props.top),
                    left: Math.round(props.left)
                });
            }
        }, offset), 0);

        $tip.addClass('in');
        if (this.hasModality()) {
            $backdrop.addClass('in');
        }

        // check to see if placing tip in new offset caused the tip to resize itself
        var actualWidth  = $tip[0].offsetWidth;
        var actualHeight = $tip[0].offsetHeight;

        if (placement == 'top' && actualHeight != height) {
            offset.top = offset.top + height - actualHeight;
        }

        var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);

        if (delta.left) {
            offset.left += delta.left;
        } else {
            offset.top += delta.top;
        }

        var isVertical          = /top|bottom/.test(placement);
        var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
        var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';

        $tip.offset(offset);
        this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical);

        if (this.useAutoHeightLogic()) {
            this.fitInViewportHeight(placement, isAutoPlacement);
        }

        // reset
        this.updatingExistingPlacement = false;
        this.changingExistingPlacementDirection = false;
    };

    Tooltip.prototype.replaceArrow = function(delta, dimension, isHorizontal) {
        this.arrow()
            .css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
            .css(isHorizontal ? 'top' : 'left', '');
    };

    Tooltip.prototype.fitInViewportHeight = function(placement, isAutoPlacement) {
        this.$innerElem = this.getInnerElem();

        var that = this;
        var autoHeightDefaultEdge = $.fn.autoheight.Constructor.DEFAULTS.edge;
        var autoHeightDefaultPadding = $.fn.autoheight.Constructor.DEFAULTS.edgePadding;
        var tooltipViewportPadding = that.options.viewport.padding;
        var autoheightInstance = this.$innerElem.data('wdesk.autoheight'),
            originalElemHeight,
            originalElemTopOffset,
            updatedElemHeight,
            updatedElemTopOffset;

        if (placement === 'top') {
            // if placement is top, the top offset will have to be updated as well
            originalElemHeight = this.$innerElem[0].clientHeight;
            originalElemTopOffset = parseInt(this.$tip.css('top'), 10);
        }

        if (!autoheightInstance) {
            this.$innerElem.autoheight({
                bindToResize: false, // handle resize events within the tooltip plugin
                container: that.options.viewport.selector,
                edgePadding: tooltipViewportPadding > 0 ? tooltipViewportPadding : autoHeightDefaultPadding,
                edge: /(top|bottom)/.test(placement) ? placement : autoHeightDefaultEdge
            });

            autoheightInstance = this.$innerElem.data('wdesk.autoheight');
        } else {
            // already initialized autoheight... just need to update
            if (this.changingExistingPlacementDirection) {
                autoheightInstance.options.edge = /(top|bottom)/.test(placement) ? placement : autoHeightDefaultEdge;
            }
            this.$innerElem.autoheight('updateHeight');
        }

        if (placement === 'top') {
            // if placement is top, the top offset will have to be updated as well
            updatedElemHeight = autoheightInstance.elemHeight;

            if (updatedElemHeight > 0) {
                // elem was resized by autoheight plugin
                updatedElemTopOffset = originalElemTopOffset + (originalElemHeight - updatedElemHeight);
                this.$tip.css('top', updatedElemTopOffset);
            } else {
                // elem was not resized by autoheight plugin... do nothing
            }
        }

        this.boundToAutoHeight = true;
    };

    Tooltip.prototype.useAutoHeightLogic = function() {
        return this.type === 'popover';
    };

    Tooltip.prototype.setContent = function() {
        var $tip = this.tip()
          , title = this.getTitle();

        $tip.find('.inner')[this.options.html ? 'html' : 'text'](title);
        $tip.removeClass('fade in top bottom left right');
    };

    Tooltip.prototype.hide = function(callback) {
        var that = this
          , $tip = this.tip()
          , $backdrop = this.backdrop()
          , o = that.options
          , e = $.Event('hide.wdesk.' + this.type);

        this.$element.trigger(e);

        if (e.isDefaultPrevented()) {
            return;
        }

        $tip.removeClass('in');
        if (this.hasModality()) {
            $backdrop.removeClass('in');
        }

        this.disableKeyboardNavigation();
        if (/click/.test(o.trigger)) {
            this.$element.focus();
        }

        var complete = function() {
            if (that.hoverState != 'in') {

                that.$element.removeAttr('aria-describedby');

                if (that.boundToAutoHeight && that.$innerElem) {
                    that.$innerElem.autoheight('unbind');
                    that.boundToAutoHeight = false;
                }

                if (!o.persist) {
                    // cleanup .data() on $element if it needs
                    // to have dynamic angular content
                    if (o.angularContent && o.trigger == 'manual') {
                        that.$element.removeData('wdesk.' + that.type);
                    }

                    // remove tooltip
                    $tip.remove();
                    // remove backdrop
                    if (that.hasModality()) {
                        $backdrop.remove();
                    }
                }

                // de-register the mousemove event listener added in this.setupPlacement()
                if (o.placement === 'follow') {
                    that.$element.off('mousemove.wdesk.' + that.type);
                    that.isFollowing = false;
                }
                // de-register the window resize event listener added in this.show()
                $(window)
                    .off('resize.wdesk.' + that.type)
                    .off('orientationchange.wdesk.' + that.type)
                    .removeData('wdesk.' + that.type);
            }
            that.$element.trigger('hidden.wdesk.' + that.type);
            callback && callback();
        };

        var transDuration = this.getTransDuration();

        $.support.transition && this.$tip.hasClass('fade') ?
            $tip
                .one('wdeskTransitionEnd', complete)
                .emulateTransitionEnd(transDuration) :
            complete();

        this.hoverState = null;

        return this;
    };

    Tooltip.prototype.fixTitle = function() {
        var $e = this.$element;
        if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
            $e.attr('data-original-title', $e.attr('title') || '').attr('title', '');
        }
    };

    Tooltip.prototype.hasContent = function() {
        return this.getTitle();
    };

    Tooltip.prototype.getPosition = function($element) {
        $element   = $element || this.$element;
        var el     = $element[0];
        var isBody = el.tagName == 'BODY';

        var elRect = el.getBoundingClientRect();

        // Calculate top / bottom position based on a scrolled viewport
        var relativeTopPosition = isBody ? (document.documentElement.scrollTop || document.body.scrollTop) : $element.offset().top;

        elRect = $.extend({}, elRect, {
            top_rel:    relativeTopPosition,
            bottom_rel: relativeTopPosition + elRect.height
        });

        if (elRect.width == null) {
            // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
            elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top });
        }

        var elOffset  = isBody ? { top: 0, left: 0 } : $element.offset();
        var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
        var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null;

        return $.extend({}, elRect, scroll, outerDims, elOffset);
    };

    Tooltip.prototype.getTitle = function() {
        var title
          , $e = this.$element
          , o  = this.options;

        title = $e.attr('data-original-title')
            || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title);

        return title;
    };

    Tooltip.prototype.enableKeyboardNavigation = function() {
        // wire up keyboard listeners for persistent tooltip/popover control a11y
        $(document).on('keydown.wdesk.' + this.type + '.data-api', $.proxy(this.keydown, this));
    };

    Tooltip.prototype.disableKeyboardNavigation = function() {
        // wire up keyboard listeners for persistent tooltip/popover control a11y
        $(document).off('keydown.wdesk.' + this.type + '.data-api');
    };

    Tooltip.prototype.keydown = function(e) {
        var $tip = this.$tip || this.tip();
        var key = e.which || e.keyCode;

        if (/(click|manual)/.test(this.options.trigger)) {
            if (key === 27) {
                this.hide();
            } else {
                return;
            }
        } else {
            return;
        }
    };

    Tooltip.prototype.getUID = function(prefix) {
        do {
            prefix += ~~(Math.random() * 1000000);
        }
        while (document.getElementById(prefix));

        return prefix;
    };

    Tooltip.prototype.getInnerElem = function() {
        var that = this;

        return this.$innerElem = this.$innerElem || $('> .inner', that.tip());
    };

    Tooltip.prototype.tip = function() {
        return this.$tip = this.$tip || $(this.options.template);
    };

    Tooltip.prototype.backdrop = function() {
        return this.$backdrop = this.$backdrop || $(this.options.backdrop);
    };

    Tooltip.prototype.arrow = function() {
        return this.$arrow = this.$arrow || this.tip().find('.arrow');
    };

    Tooltip.prototype.validate = function() {
        if (!this.$element[0].parentNode) {
            this.hide();
            this.$element = null;
            this.options = null;
        }
    };

    Tooltip.prototype.enable = function() {
        this.enabled = true;
    };

    Tooltip.prototype.disable = function() {
        this.enabled = false;
    };

    Tooltip.prototype.toggleEnabled = function() {
        this.enabled = !this.enabled;
    };

    Tooltip.prototype.toggle = function(event) {
        var self = this;

        if (event) {
            self = $(event.currentTarget).data('wdesk.' + this.type);

            if (!self) {
                self = new this.constructor(event.currentTarget, this.getDelegateOptions());
                $(event.currentTarget).data('wdesk.' + this.type, self);
            }
        }

        self.tip().hasClass('in') ? self.leave(self) : self.enter(self);
    };

    Tooltip.prototype.destroy = function() {
        var that = this;
        clearTimeout(this.timeout);
        this.hide(function() {
            that.$element.off('.' + that.type).removeData('wdesk.' + that.type);
        });
    };


    // TOOLTIP PLUGIN DEFINITION
    // =========================

    function Plugin(option) {
        return this.each(function() {
            var $this   = $(this)
              , data    = $this.data('wdesk.tooltip')
              , options = typeof option == 'object' && option;

            if (!data) {
                if (option == 'destroy') {
                    return;
                }
                $this.data('wdesk.tooltip', (data = new Tooltip(this, options)));
            }
            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    var old = $.fn.tooltip;

    $.fn.tooltip             = Plugin;
    $.fn.tooltip.Constructor = Tooltip;


    // TOOLTIP NO CONFLICT
    // ===================

    $.fn.tooltip.noConflict = function() {
        $.fn.tooltip = old;
        return this;
    };

});

if (define.isFake) {
    define = undefined;
}
