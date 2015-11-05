/* ==========================================================
 * wdesk-transition.js v1.3.0 (http://bit.ly/1bh9VJL)
 * adapted from bootstrap-transition v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery, window.Modernizr);
    };
    define.isFake = true;
}

define(['jquery', 'modernizr'],

function($, Modernizr) {

    'use strict';

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-transition.js requires wf-vendor.js');
    }
    if (typeof Modernizr === 'undefined') {
        throw new Error('wdesk-transition.js requires modernizr.js');
    }

    // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
    // ============================================================

    var transitionEnd = function() {

        var el = document.createElement('wdesk');

        var transEndEventNames = {
            WebkitTransition : 'webkitTransitionEnd'
          , MozTransition    : 'transitionend'
          , OTransition      : 'oTransitionEnd otransitionend'
          , transition       : 'transitionend'
        };

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return { end: transEndEventNames[name] };
            }
        }

        return false; // explicit for MSIE 8 ( ._.)
    };

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function(duration) {
        var called = false,
            $el    = this;
        $(this).one('wdeskTransitionEnd', function() { called = true });
        var callback = function() {
            if (!called) {
                $($el).trigger($.support.transition.end);
            }
        };
        setTimeout(callback, duration);
        return this;
    };

    $(function() {
        $.support.transition = transitionEnd();

        if (!$.support.transition) {
            return;
        }

        $.event.special.wdeskTransitionEnd = {
            bindType: $.support.transition.end,
            delegateType: $.support.transition.end,
            handle: function(e) {
                if ($(e.target).is(this)) {
                    return e.handleObj.handler.apply(this, arguments);
                }
            }
        };
    });

    $.fn.getTransitionDuration = ! Modernizr.csstransitions ? (function() {return 0;}) :
        (function(property) {
            var $element = this;
            var millis = 0;

            var properties = $element.css(Modernizr.prefixed('transitionProperty'));
            if (properties) {
                properties = properties.split(', ');
            } else {
                properties = ['all'];
            }

            var index = property ? properties.indexOf(property) : 0;

            if (index !== -1) {
                var durations = $element.css(Modernizr.prefixed('transitionDuration'));
                if (durations) {
                    durations = durations.split(', ');
                } else {
                    durations = [0];
                }

                // Modulo here, because transition durations wrap around
                var duration = durations[index % durations.length];
                var number = parseFloat(duration);

                if (/ms$/.test(duration)) {
                    millis = number;
                } else if (/s$/.test(duration)) {
                    millis = number * 1000;
                } else {
                    millis = number;
                }
            }

            return Math.round(millis);
        });

    return $.fn.getTransitionDuration;

});

if (define.isFake) {
    define = undefined;
}

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

/* ==========================================================
 * wdesk-affix.js v1.3.0 (http://bit.ly/15J47Ss)
 * adapted from bootstrap-affix v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery'],

function($) {

    'use strict';

    // AFFIX CLASS DEFINITION
    // ======================

    var Affix = function(element, options) {
        this.options = $.extend({}, Affix.DEFAULTS, options);
        this.$window = $(window);
        this.$scrollElement = this.options.scrollElement || this.$window;

        this.$scrollElement
            .on('scroll.wdesk.affix.data-api', $.proxy(this.checkPosition, this))
            .on('click.wdesk.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this));

        this.$element     = $(element);
        this.affixed      = null;
        this.unpin        = null;
        this.pinnedOffset = null;

        this.checkPosition();
    };

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-affix.js requires wf-vendor.js');
    }

    Affix.VERSION = '1.3.0';

    Affix.RESET = 'affix affix-top affix-bottom';

    Affix.DEFAULTS = {
        offset: 0
    };

    Affix.prototype.getPinnedOffset = function() {
        if (this.pinnedOffset) {
            return this.pinnedOffset;
        }

        this.$element
            .removeClass(Affix.RESET)
            .addClass('affix');

        var scrollTop = this.$scrollElement.scrollTop();
        var position  = this.$element.offset();
        return (this.pinnedOffset = position.top - scrollTop);
    };

    Affix.prototype.checkPositionWithEventLoop = function() {
        setTimeout($.proxy(this.checkPosition, this), 1);
    };

    Affix.prototype.checkPosition = function() {
        if (!this.$element.is(':visible')) {
            return;
        }

        var scrollHeight    = this.$scrollElement === this.$window ? $(document).height() : this.$scrollElement[0].scrollHeight;
        var scrollTop       = this.$scrollElement.scrollTop();
        var position        = this.$element.offset();
        var offset          = this.options.offset;
        var offsetTop       = offset.top;
        var offsetBottom    = offset.bottom;

        if (this.affixed == 'top') {
            position.top += scrollTop;
        }

        if (typeof offset != 'object')          offsetBottom = offsetTop = offset;
        if (typeof offsetTop == 'function')     offsetTop    = offset.top(this.$element);
        if (typeof offsetBottom == 'function')  offsetBottom = offset.bottom(this.$element);

        var affix = this.unpin      != null && (scrollTop + this.unpin <= position.top) ? false :
                    offsetBottom    != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ? 'bottom' :
                    offsetTop       != null && (scrollTop <= offsetTop) ? 'top' : false;

        if (this.affixed === affix) {
            return;
        }
        if (this.unpin) {
            this.$element.css('top', '');
        }

        var affixType = 'affix' + (affix ? '-' + affix : '');
        var event     = $.Event(affixType + '.wdesk.affix');

        this.$element.trigger(event);

        if (event.isDefaultPrevented()) {
            return;
        }

        this.affixed = affix;
        this.unpin   = affix == 'bottom' ? this.getPinnedOffset() : null;

        this.$element
            .removeClass(Affix.RESET)
            .addClass(affixType)
            .trigger($.Event(affixType.replace('affix', 'affixed')));

        if (affix == 'bottom') {
            this.$element.offset({ top: scrollHeight - offsetBottom - this.$element.height() });
        }
    };


    // AFFIX PLUGIN DEFINITION
    // =======================

    function Plugin(option) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('wdesk.affix');
            var options = typeof option == 'object' && option;

            if (!data) {
                $this.data('wdesk.affix', (data = new Affix(this, options)));
            }
            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    var old = $.fn.affix;

    $.fn.affix             = Plugin;
    $.fn.affix.Constructor = Affix;


    // AFFIX NO CONFLICT
    // =================

    $.fn.affix.noConflict = function() {
        $.fn.affix = old;
        return this;
    };


    // AFFIX DATA-API
    // ==============

    $(window).on('load', function() {
        $('[data-spy="affix"]').each(function() {
            var $spy = $(this);
            var data = $spy.data();

            data.offset = data.offset || {};

            if (data.offsetBottom) {
                data.offset.bottom = data.offsetBottom;
            }
            if (data.offsetTop) {
                data.offset.top = data.offsetTop;
            }

            Plugin.call($spy, data);
        });
    });

});

if (define.isFake) {
    define = undefined;
}

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

/* ==========================================================
 * wdesk-button.js v1.3.0 (http://bit.ly/13EbhbR)
 * adapted from bootstrap-button v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery'],

function($) {

    'use strict';

    // BUTTON PUBLIC CLASS DEFINITION
    // ==============================

    var Button = function(element, options) {
        this.$element = $(element);
        this.options  = $.extend({}, Button.DEFAULTS, this.$element.data(), options);
        this.isLoading = false;
    };

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-button.js requires wf-vendor.js');
    }
    if (typeof $.client === 'undefined') {
        throw new Error('wdesk-button.js requires Web Skin\'s libs.js');
    }

    Button.VERSION = '1.3.0';

    Button.DEFAULTS = {
        activeClass: 'active',
        prop: 'disabled' // what .prop() should we toggle when setState triggers?
    };

    Button.prototype.setState = function(state) {
        var that     = this;
        var d        = this.options.prop;
        var $el      = this.$element;
        var val      = $el.is('input') ? 'val' : 'html';
        var data     = $el.data();
        var $btnText = $el.find('.btn-text');

        state = state + 'Text';

        if (!data.resetText) {
            if ($el.is('input')) {
                $el.data('resetText', $el[val]());
            } else {
                $el.data('resetText', $btnText[val]());
            }
        }

        if ($el.is('input')) {
            $el[val](data[state] || this.options[state]);
        } else {
            $btnText[val](data[state] || this.options[state]);
        }

        //
        // try to focus the elem, even though it may be impossible
        // if the prop being toggled is `readonly` or `disabled`
        //
        $el.focus();

        // push to event loop to allow forms to submit
        setTimeout($.proxy(function() {
            if (state === 'loadingText') {
                this.isLoading = true;
                $el.addClass(d).prop(d, true);
            } else if (this.isLoading) {
                this.isLoading = false;
                $el.removeClass(d).prop(d, false);
                $el.focus();
            }
        }, this), 0);
    };

    Button.prototype.toggle = function(options) {
        var activeClass = options.activeClass;
        var changed     = true;
        var $el         = this.$element;
        var $parent     = $el.closest('[data-toggle="buttons"]');
        var data        = $el.data();
        var $input;

        var isActive    = $el.hasClass(activeClass);

        if ($parent.length) {
            activeClass = $parent.data('activeClass') || activeClass;
            $input = $el.find('input');

            if ($input.prop('type') === 'radio') {
                if ($input.prop('checked') && isActive) {
                    changed = false;
                } else {
                    $parent.find('.' + activeClass)
                        .removeClass(activeClass)
                        .removeClass('js-focus')
                        .attr('aria-selected', 'false');
                }
            }

            if (changed) {
                $input
                    .prop('checked', !isActive)
                    .trigger('change');
            }
        }

        if (changed) {
            if (isActive) {
                $el
                    .removeClass(activeClass)
                    .removeClass('js-focus')
                    .attr('aria-selected', 'false');
            } else {
                $el
                    .addClass(activeClass)
                    .addClass('js-focus')
                    .attr('aria-selected', 'true');
            }
        }

        if ($input) {
            $input.focus();
        } else {
            $el.focus();
        }
    };

    // toggle nothing but a property / attribute
    Button.prototype.toggleProp = function(options) {
        var $el         = this.$element;
        var data        = $el.data();
        var toggleProp  = data.toggleProp || options.prop;

        function check($element) {
            $element
                .prop('checked', true)
                .addClass(toggleProp);
        }

        function uncheck($element) {
            $element
                .prop('checked', false)
                .removeClass(toggleProp);

            if (isLtMSIE9 || $.unitTest) {
                $element.removeAttr('checked');
            }
        }

        function _toggleProp() {
            if ($el.prop(toggleProp)) {
                if (toggleProp === 'checked') {
                    uncheck($el);
                } else {
                    $el.removeClass(toggleProp);
                }
            } else {
                if (toggleProp === 'checked') {
                    check($el);
                } else {
                    $el.addClass(toggleProp);
                }
            }
        }

        if (toggleProp === 'checked') {
            // checked property... need to account for radio groups
            if ($el.prop('type') === 'radio') {
                // make sure that all currently "checked" radios with the same name attr are un-checked
                var $activeRadio = $el.closest('form').find('[name=' + $el.prop('name') + ']:checked');
                if ($el.attr('id') !== $activeRadio.attr('id')) {
                    // the radio clicked is not already active
                    // de-activate the currently active one and activate this one
                    check($el);
                    uncheck($activeRadio);
                } else {
                    // the radio clicked is already active - do nothing.
                }
            } else {
                // checkbox - do a basic toggle
                _toggleProp();
            }
        } else {
            // not the checked property... do a basic toggle
            _toggleProp();
        }
    };

    Button.prototype.clearSearch = function(options) {
        var $that        = this;
        var $searchBox   = this.$element.closest('.input-group-search');
        var $searchInput = $searchBox.find('.form-control');
        var $clearSearchBtn = this.$element;
        var searchQuery;
        var searchActive = false;

        var activateSearch = function() {
            searchActive = true;
            $searchBox.addClass('js-searching');
            $clearSearchBtn.attr('aria-hidden', false);
            $searchInput
                .focus()
                .addClass('js-focus')
                .trigger('search.wdesk.button');
        };

        var deActivateSearch = function() {
            searchActive = false;
            $searchBox.removeClass('js-searching');
            $clearSearchBtn.attr('aria-hidden', true);
            $searchInput
                .focus()
                .removeClass('js-focus')
                .trigger('clear.wdesk.button');
        };

        var checkQuery = function(e) {
            searchQuery = $searchInput.val();
            if (searchQuery.length > 0) {
                if (!searchActive) {
                    activateSearch();
                }
            } else {
                deActivateSearch();
            }
        };

        this.$element.on('click.wdesk.button.data-api', function(e) {
            $searchInput[0].value = '';
            $searchInput.trigger('change');

            if ($searchInput.placeholderMSIElt9) {
                $searchInput
                    .trigger('blur')
                    .trigger('focus');
            }

            checkQuery(e);
        });

        $searchInput.on('keyup.wdesk.button.data-api', function(e) {
            checkQuery(e);
        });

    };


    // BUTTON PLUGIN DEFINITION
    // ========================

    function Plugin(option) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('wdesk.button');
            var options = $.extend({}, Button.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) {
                $this.data('wdesk.button', (data = new Button(this, options)));
            }
            if (option == 'toggle') {
                data.toggle(options);
            }
            if (option == 'toggleProp') {
                data.toggleProp(options);
            } else if (option == 'clearSearch') {
                data.clearSearch(options);
            } else if (option) {
                data.setState(option);
            }
        });
    }

    var old = $.fn.button;
    var _client = $.client;
    var isLtMSIE9 = (_client.browser === 'IE' && parseInt(_client.version, 10) < 9) || $.mockMSIE8;
    var isTouch = $.unitTest ? $.mockTouch : 'ontouchstart' in document.documentElement;

    $.fn.button             = Plugin;
    $.fn.button.Constructor = Button;


    // BUTTON NO CONFLICT
    // ==================

    $.fn.button.noConflict = function() {
        $.fn.button = old;
        return this;
    };


    // BUTTON DATA-API
    // ===============
    var toggleBtnSelectors      = '[data-toggle^="button"],        [data-toggle^="checkbox"],        [data-toggle-prop]';
    var toggleBtnInputSelectors = '[data-toggle^="button"] :input, [data-toggle^="checkbox"] :input, [data-toggle-prop] :input';

    $(document).on('click.wdesk.button.data-api', toggleBtnSelectors, function(event) {
        var $this = $(this);
        var $target = $(event.target);
        var toggleType = $this.data('toggle');
        var isCboxOrRadio = $target.is('input:checkbox') ||
                            $target.is('input:radio') ||
                            $target.has('input:checkbox').length ||
                            $target.has('input:radio').length;

        if (!$target.hasClass('btn') && $target.closest('.btn').length > 0) {
            $target = $target.closest('.btn');
        }

        if ($target.data('toggleProp') && (!isLtMSIE9 && !isCboxOrRadio)) {
            // if its a checkbox or radio button, and the browser is IE8 or lower
            // we'll toggleProp using the SHIM below.
            Plugin.call($target, 'toggleProp');
        } else {
            Plugin.call($target, 'toggle');

            if (toggleType === 'button' || toggleType === 'buttons') {
                event.preventDefault();
            }
        }
    });

    $(document).on('focus.wdesk.button.data-api', toggleBtnInputSelectors, function(event) {
        // Ensure that when an input nested within a button is focused,
        // the appearance of the button represents that for accessibility
        var $this = $(this);
        var $toggleGroup = $this.closest('[data-toggle]');
        var $parentButton = $this.closest('.btn');

        if ($parentButton.length > 0) {
            $parentButton.addClass('js-focus');

            $this.one('blur.wdesk.button.data-api', function(event) {
                $toggleGroup.find('.js-focus').removeClass('js-focus');
            });
        }
    });


    //
    // SHIMS FOR CHECKBOXES / RADIO SELECTION
    // (REQUIRES Web Skin's ua-sniffer.js and modernizr.js contained in libs.js)
    //
    // All shims will wire up to a different namespace than the button plugin default
    // so that client apps can still use .off() to disable the other non-critical
    // pieces of this plugin's data-api functionality without unknowingly breaking the shims
    //
    // TOUCH DEVICES SHIMMED BECAUSE:
    //   The behavior described here: http://bit.ly/1twWLNW
    //   necessitates that we fire the checkboxSelectTrigger function
    //   on mouseenter (a.k.a. "touchstart")
    //
    // MSIE 7/8 SHIMMED BECAUSE:
    //   We are using our own custom styles
    //   which hide the default appearance, and MSIE 7 & 8
    //   are unable to render unique styles based on the
    //   `:checked` psuedo-selector
    //
    var cboxShimEventNamespace  = '.wdesk.checked.data-api';
    var radioSelectors          = '.radio, .radio-inline';
    var cboxSelectors           = '.checkbox-switch, .checkbox, .checkbox-inline';
    var radioAndCboxSelectors   = radioSelectors + ', ' + cboxSelectors;
    var cboxInputs              = '.checkbox input, .checkbox-inline input';
    var cboxEvent               = isTouch ? 'mouseenter' : 'click';

    if (isTouch || isLtMSIE9 || $.unitTest) {
        $(document).on(cboxEvent + cboxShimEventNamespace, radioAndCboxSelectors, function(event) {
            var $target = $(this);
            var triggerChange = false;

            if ($target) {
                event.stopPropagation();

                if (!$target.is('input')) {
                    triggerChange = true;
                    $target = $target.find('input');

                    $target.data('clicked', true);
                } else {
                    $target.data('clicked', false);
                }

                $target
                    .data('prop', 'checked')
                    .button('toggleProp')
                    .focus();

                if (triggerChange) {
                    $target.trigger('change');
                }
            }
        });

        // SHIM Indeterminate State Styling
        $(document).on('change' + cboxShimEventNamespace, cboxInputs, function(event) {
            var $this = $(this);
            var data = $this.data();

            if ($this.prop('indeterminate') === true) {
                $this.addClass('indeterminate');
            } else {
                if (!data.clicked) {
                    $this.trigger('click');
                }
                $this.removeClass('indeterminate');
            }

            if ($this.prop('checked')) {
                $this.addClass('checked');
            } else {
                $this.removeClass('checked');
            }

            $this.focus();
        });
    }
});

if (define.isFake) {
    define = undefined;
}

/* ==========================================================
 * wdesk-carousel.js v1.3.0 (http://bit.ly/1gLpN84)
 * adapted from bootstrap-carousel v3.3.2
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

    // CAROUSEL PUBLIC CLASS DEFINITION
    // ================================

    var Carousel = function(element, options) {
        this.$element    = $(element);
        this.$indicators = this.$element.find('.page-indicators');
        this.options     = options;
        this.paused      = null;
        this.sliding     = null;
        this.interval    = null;
        this.$active     = null;
        this.$items      = null;
        this.activeIndex = this.getActiveIndex();

        this.options.pause === 'hover' && !('ontouchstart' in document.documentElement) && this.$element
            .on('mouseenter', $.proxy(this.pause, this))
            .on('mouseleave', $.proxy(this.cycle, this));

        if (!this.options.wrap) {
            this.applyEdgeClasses();
        }

        this.makeAccessibile();
    };

    if (!$.fn.emulateTransitionEnd) {
        throw new Error('wdesk-carousel.js requires wdesk-transition.js');
    }
    if (typeof jQuery === 'undefined') {
        throw new Error('wdesk-carousel.js requires wf-vendor.js');
    }

    Carousel.VERSION = '1.3.0';

    Carousel.DEFAULTS = {
        interval: false,
        pause: 'hover',
        wrap: false
    };

    Carousel.prototype.cycle = function(event) {
        event || (this.paused = false);

        this.interval && clearInterval(this.interval);

        this.options.interval
            && !this.paused
            && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));

        return this;
    };

    Carousel.prototype.getActiveIndex = function() {
        this.$active = this.$element.find('.item.active');
        this.$items  = this.$active.parent().children();

        return this.$items.index(this.$active);
    };

    Carousel.prototype.to = function(pos) {
        var that        = this;
        var activeIndex = this.getActiveIndex();

        if (pos > (this.$items.length - 1) || pos < 0) {
            return;
        }

        if (this.sliding) {
            return this.$element.one('slid.wdesk.carousel', function() {
                that.to(pos);
            });
        }
        if (activeIndex == pos) {
            return this.pause().cycle();
        }

        return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]));
    };

    Carousel.prototype.pause = function(event) {
        event || (this.paused = true);

        if (this.$element.find('[data-slide=prev], [data-slide=next]').length && $.support.transition) {
            this.$element.trigger($.support.transition.end);
            this.cycle(true);
        }

        this.interval = clearInterval(this.interval);

        return this;
    };

    Carousel.prototype.next = function() {
        if (this.sliding) {
            return;
        }
        return this.slide('next');
    };

    Carousel.prototype.prev = function() {
        if (this.sliding) {
            return;
        }
        return this.slide('prev');
    };

    Carousel.prototype.slide = function(type, next) {
        var $active   = this.$element.find('.item.active');
        var $next     = next || $active[type]();
        var isCycling = this.interval;
        var isForward = type == 'next';
        var direction = isForward ? 'left' : 'right';
        var fallback  = isForward ? 'first' : 'last';
        var that      = this;

        if (!$next.length) {
            if (!this.options.wrap) {
                return;
            }
            $next = this.$element.find('.item')[fallback]();
            this.activeIndex = isForward ? 0 : this.$items.length - 1;
        } else {
            this.activeIndex = this.$items.index($next);
        }

        if ($next.hasClass('active')) {
            return this.sliding = false;
        }

        var event = $.Event('slide.wdesk.carousel', { relatedTarget: $next[0], direction: direction });
        this.$element.trigger(event);

        if (event.isDefaultPrevented()) {
            return;
        }

        this.sliding = true;

        isCycling && this.pause();

        if (this.$indicators.length) {
            this.$indicators.find('.active')
                .attr('aria-checked', 'false')
                .removeClass('active');

            this.$element.one('slid.wdesk.carousel', function() {
                var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()]);

                $nextIndicator &&
                $nextIndicator
                    .attr('aria-checked', 'true')
                    .addClass('active');
            });
        }

        if (!this.options.wrap) {
            this.applyEdgeClasses();
        }

        if ($.support.transition && this.$element.hasClass('slide')) {
            $next.addClass(type);
            $next[0].offsetWidth; // force reflow
            $active.addClass(direction);
            $next.addClass(direction);
            $active
                .one('wdeskTransitionEnd', function() {
                    $active
                        .attr({
                            'aria-selected': false,
                            'tabindex': '-1'
                        })
                        .removeClass(['active', direction].join(' '));

                    $next
                        .attr({
                            'aria-selected': true,
                            'tabindex': '0'
                        })
                        .removeClass([type, direction].join(' '))
                        .addClass('active')
                        .focus();

                    that.sliding = false;
                    setTimeout(function() {
                        that.$element.trigger('slid.wdesk.carousel');
                    }, 0);
                })
                // TODO: Use getTransitionDuration() once implemented
                .emulateTransitionEnd($active.css('transition-duration').slice(0, -1) * 1000);
        } else {
            $active
                .attr({
                    'aria-selected': false,
                    'tabindex': '-1'
                })
                .removeClass('active');
            $next
                .attr({
                    'aria-selected': true,
                    'tabindex': '0'
                })
                .addClass('active')
                .focus();

            this.sliding = false;
            this.$element.trigger('slid.wdesk.carousel');
        }

        isCycling && this.cycle();

        return this;
    };

    Carousel.prototype.applyEdgeClasses = function() {
        var activeIndex = this.activeIndex,
            itemCount   = this.$items.length;

        this.$element
            [activeIndex === 0 ? 'addClass' : 'removeClass']('at-left-edge')
            [activeIndex === itemCount - 1 ? 'addClass' : 'removeClass']('at-right-edge');
    };

    Carousel.prototype.makeAccessibile = function() {
        var that = this;

        this.$items.each(function(index) {
            // make sure that any .carousel-caption element is linked to
            // it's parent .item elem as the "label" for WCAG compliance
            var captionClass = 'carousel-caption';
            var $this = $(this);
            var $caption = $this.find('.' + captionClass);
            var captionId = false;
            if ($caption.length) {
                captionId = $caption.attr('id') ? $caption.attr('id') : that.getUID(captionClass);
                $this.attr('aria-labelledby', captionId);
                $caption.attr('id', captionId);
            }

            // make sure that all .item elems have accurate `aria-selected` attribute values
            // and accurate tabindex values for accessibility purposes
            if ($this.hasClass('active')) {
                $this
                    .attr({
                        'aria-selected': 'true',
                        'tabindex': '0'
                    });
            } else {
                $this
                    .attr({
                        'aria-selected': 'false',
                        'tabindex': '-1'
                    });
            }
        });
    };

    Carousel.prototype.getUID = function(prefix) {
        do {
            prefix += ~~(Math.random() * 1000000);
        }
        while (document.getElementById(prefix));

        return prefix;
    };

    Carousel.prototype.keydown = function(event) {
        var that     = this,
            $this    = $(this),
            $listbox = $this.closest('.carousel-inner'),
            $items   = $listbox.find('.item'),
            $parent  = $listbox.parent(),
            k        = event.which || event.keyCode,
            index,
            i;

        if (!/(37|38|39|40)/.test(k)) {
            return;
        }

        index = $items.index($items.filter('.active'));

        //
        // Up / Left
        //
        if (k == 37 || k == 38) {
            $parent.carousel('prev');
            index--;

            if (index < 0) {
                index = $items.length - 1;
            } else {
                $this.prev().focus();
            }
        }

        //
        // Down / Right
        //
        if (k == 39 || k == 40) {
            $parent.carousel('next');
            index++;

            if (index == $items.length) {
                index = 0;
            } else {
                $this.next().focus();
            }
        }

        event.preventDefault();
        event.stopPropagation();
    };


    // CAROUSEL PLUGIN DEFINITION
    // ==========================

    function Plugin(option) {
        return this.each(function() {
            var $this   = $(this);
            var data    = $this.data('wdesk.carousel');
            var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
            var action  = typeof option == 'string' ? option : options.slide;

            if (!data) {
                $this.data('wdesk.carousel', (data = new Carousel(this, options)));
            }
            if (typeof option == 'number') {
                data.to(option);
            } else if (action) {
                data[action]();
            } else if (options.interval) {
                data.pause().cycle();
            }
        });
    }

    var old = $.fn.carousel;

    $.fn.carousel             = Plugin;
    $.fn.carousel.Constructor = Carousel;


    // CAROUSEL NO CONFLICT
    // ====================

    $.fn.carousel.noConflict = function() {
        $.fn.carousel = old;
        return this;
    };


    // CAROUSEL DATA-API
    // =================

    var clickHandler = function(event) {
        var href;
        var $this       = $(this);
        var $target     = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); //strip for ie7
        var options     = $.extend({}, $target.data(), $this.data());
        var slideIndex  = $this.attr('data-slide-to');

        if (slideIndex) {
            options.interval = false;
        }

        $target.carousel(options);

        if (slideIndex = $this.attr('data-slide-to')) {
            $target.data('wdesk.carousel').to(slideIndex);
        }

        event && event.preventDefault();
    };

    $(document).on('click.wdesk.carousel.data-api', '[data-slide]', clickHandler);
    $(document).on('click.wdesk.carousel.data-api', '[data-slide-to]', clickHandler);

    $(document).on('keydown.wdesk.carousel.data-api', '.carousel [role=option], .carousel [role=button]', Carousel.prototype.keydown);

    $(window).on('load', function() {
        $('[data-ride="carousel"]').each(function() {
            var $carousel = $(this);
            Plugin.call($carousel, $carousel.data());
        });
    });

});

if (define.isFake) {
    define = undefined;
}

/* ==========================================================
 * wdesk-chosen.js v1.3.0 (http://bit.ly/18CWEdt)
 * adapted from harvest's chosen.js v1.3.0
 * ===================================================
 * Copyright 2015 Workiva and Harvest
 * ========================================================== */

/* jshint quotmark: false, prototypejs: true, shadow: true, -W049: true, -W015: true, -W018: true */
/* global __extends: true */

(function() {

  if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
      throw new Error('wdesk-chosen.js requires wf-vendor.js');
  }

  var $, AbstractChosen, Chosen, SelectParser, _ref,
    __hasProp = {}.hasOwnProperty,
    /* jshint ignore:start */
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
    /* jshint ignore:end */

  SelectParser = (function() {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function(child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function(group) {
      var group_position, option, _i, _len, _ref, _results;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        children: 0,
        disabled: group.disabled
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function(option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function(text) {
      var map, unsafe_chars;
      if ((text == null) || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function(chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;

  })();

  SelectParser.select_to_array = function(select) {
    var child, parser, _i, _len, _ref;
    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = (function() {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
    }

    AbstractChosen.prototype.set_default_values = function() {
      var _this = this;
      this.click_test_action = function(evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function(evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 5;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      return this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
    };

    AbstractChosen.prototype.set_default_text = function() {
      var selectVal = $(this.form_field).val();
      if (selectVal) {
        // by default, set the placeholder equal to the <option selected></option> value
        this.default_text = selectVal;
      } else if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.mouse_enter = function() {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function() {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function(evt) {
      var _this = this;
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout((function() {
            return _this.container_mousedown();
          }), 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function(evt) {
      var _this = this;
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout((function() {
          return _this.blur_test();
        }), 100);
      }
    };

    AbstractChosen.prototype.results_option_build = function(options) {
      var content, data, _i, _len, _ref;
      content = '';
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        if (data.group) {
          content += this.result_add_group(data);
        } else {
          content += this.result_add_option(data);
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(data.text);
          }
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function(option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      option_el.style.cssText = option.style;
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.search_text;
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function(group) {
      var group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      group_el = document.createElement("li");
      group_el.className = "group-result";
      group_el.innerHTML = group.search_text;
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function(evt) {
      var currValue = this.search_field[0].value;

      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build(currValue);
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function() {
      var result, _i, _len, _ref, _results;
      _ref = this.results_data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.selected) {
          _results.push(result.selected = false);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractChosen.prototype.results_toggle = function() {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function(evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function() {
      var escapedSearchText, option, regex, regexAnchor, results, results_group, searchText, startpos, text, zregex, _i, _len, _ref;
      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      regexAnchor = this.search_contains ? "" : "^";
      regex = new RegExp(regexAnchor + escapedSearchText, 'i');
      zregex = new RegExp(escapedSearchText, 'i');
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          if (!(option.group && !this.group_search)) {
            option.search_text = option.group ? option.label : option.html;
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(zregex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.search_string_match = function(search_string, regex) {
      var part, parts, _i, _len;
      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function() {
      var option, _i, _len, _ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function(evt) {
      evt.preventDefault();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keyup_checker = function(evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            return this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            return this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            return this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          return true;
        case 9:
        case 38:
        case 40:
        case 16:
        case 91:
        case 17:
          break;
        default:
          return this.results_search();
      }
    };

    AbstractChosen.prototype.container_width = function() {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function(option) {
      if (this.is_multiple && (!this.display_selected_options && option.selected)) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function(evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function(evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function(evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function(element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.browser_is_supported = function() {
      if (window.navigator.appName === "Microsoft Internet Explorer") {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent)) {
        return false;
      }
      if (/Android/i.test(window.navigator.userAgent)) {
        if (/Mobile/i.test(window.navigator.userAgent)) {
          return false;
        }
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;

  })();

  $ = jQuery;

  $.fn.extend({
    chosen: function(options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function(input_field) {
        var $this, chosen;
        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy' && chosen) {
          chosen.destroy();
        } else if (!chosen) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = (function(_super) {
    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function() {
      this.form_field_jq = $(this.form_field);
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.is_rtl = this.form_field_jq.hasClass("chosen-rtl");
    };

    Chosen.prototype.set_up_html = function() {
      var container_classes, container_props;
      container_classes = ["chosen-container form-control select"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single dropdown"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'style': "width: " + (this.container_width()) + ";",
        'title': this.form_field.title,
        'aria-hidden': 'true'
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      if (this.is_multiple) {
        this.container.html('<ul class="chosen-choices form-control"><li class="search-field"><input type="text" value="' + this.default_text + '" class="form-control default" autocomplete="off" style="width:25px;"></li></ul><div class="chosen-drop dropdown-menu"><ul class="chosen-results"></ul></div>');
      } else {
        this.container.html('<a class="chosen-single chosen-default btn btn-default dropdown-toggle" tabindex="-1"><span>' + this.default_text + '</span><b class="caret"></b></a><div class="chosen-drop dropdown-menu"><div class="dropdown-info chosen-search"><input type="search" autocomplete="off" placeholder="Search" aria-label="Search" class="form-control input-sm"></div><ul class="chosen-results"></ul></div>');
      }
      this.form_field_jq.addClass('sr-only').after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      this.set_label_behavior();
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function() {
      var _this = this;
      this.container.bind('mousedown.chosen', function(evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('mouseup.chosen', function(evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mouseenter.chosen', function(evt) {
        _this.mouse_enter(evt);
      });
      this.container.bind('mouseleave.chosen', function(evt) {
        _this.mouse_leave(evt);
      });
      this.search_results.bind('mouseup.chosen', function(evt) {
        _this.search_results_mouseup(evt);
      });
      this.search_results.bind('mouseover.chosen', function(evt) {
        _this.search_results_mouseover(evt);
      });
      this.search_results.bind('mouseout.chosen', function(evt) {
        _this.search_results_mouseout(evt);
      });
      this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function(evt) {
        _this.search_results_mousewheel(evt);
      });
      this.search_results.bind('touchstart.chosen', function(evt) {
        _this.search_results_touchstart(evt);
      });
      this.search_results.bind('touchmove.chosen', function(evt) {
        _this.search_results_touchmove(evt);
      });
      this.search_results.bind('touchend.chosen', function(evt) {
        _this.search_results_touchend(evt);
      });
      this.form_field_jq.bind("chosen:updated.chosen", function(evt) {
        _this.results_update_field(evt);
      });
      this.form_field_jq.bind("chosen:activate.chosen", function(evt) {
        _this.activate_field(evt);
      });
      this.form_field_jq.bind("chosen:open.chosen", function(evt) {
        _this.container_mousedown(evt);
      });
      this.search_field.bind('blur.chosen', function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('keyup.chosen', function(evt) {
        _this.keyup_checker(evt);
      });
      this.search_field.bind('keydown.chosen', function(evt) {
        _this.keydown_checker(evt);
      });
      this.search_field.bind('focus.chosen', function(evt) {
        _this.input_focus(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.bind('click.chosen', function(evt) {
          _this.choices_click(evt);
        });
      } else {
        return this.container.bind('click.chosen', function(evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function() {
      $(document).unbind("click.chosen", this.click_test_action);
      if (this.search_field[0].tabindex) {
        this.form_field_jq[0].tabindex = this.search_field[0].tabindex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.removeClass('sr-only').removeClass('chosen');
    };

    Chosen.prototype.search_field_disabled = function() {
      this.is_disabled = this.form_field_jq[0].disabled;
      if (this.is_disabled) {
        this.container.addClass('chosen-disabled disabled');
        this.search_field[0].disabled = true;
        if (!this.is_multiple) {
          this.selected_item.unbind("focus.chosen", this.activate_action);
        }
        return this.close_field();
      } else {
        this.container.removeClass('chosen-disabled disabled');
        this.search_field[0].disabled = false;
        if (!this.is_multiple) {
          return this.selected_item.bind("focus.chosen", this.activate_action);
        }
      }
    };

    Chosen.prototype.container_mousedown = function(evt) {
      if (!this.is_disabled && (evt && evt.which !== 3)) {
        if (evt && evt.type === "mousedown" && !this.results_showing) {
          evt.preventDefault();
        }
        if (!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))) {
          if (!this.active_field) {
            if (this.is_multiple) {
              this.search_field.val("");
            }
            $(document).bind('click.chosen', this.click_test_action);
            this.results_show();
          } else if (!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)) {
            evt.preventDefault();
            this.results_toggle();
          }
          return this.activate_field();
        }
      }
    };

    Chosen.prototype.container_mouseup = function(evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function(evt) {
      var delta;
      if (evt.originalEvent) {
        delta = -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
      }
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function(evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function() {
      $(document).unbind("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      return this.search_field_scale();
    };

    Chosen.prototype.activate_field = function() {
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function(evt) {
      if (this.container.is($(evt.target).closest('.chosen-container'))) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function(existingValue) {
      existingValue = existingValue || null;
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      this.results_count = this.results_data.length;
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();

      // reset to value that was entered when refresh was triggered
      if (existingValue !== null) {
        this.search_field[0].value = existingValue;
      }
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function(el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function() {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function() {
      this.no_remaining_results = this.selected_option_count === this.results_count;
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      if (this.is_multiple && this.no_remaining_results) {
        this.form_field_jq.trigger("chosen:allselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop open");
      this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.search_field.val());
      return this.winnow_results();
    };

    Chosen.prototype.update_results_content = function(content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function() {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop open");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function(el) {
      var ti;
      if (this.form_field.tabindex) {
        ti = this.form_field.tabindex;
        this.form_field.tabindex = -1;
        return this.search_field[0].tabindex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function() {
      var _this = this;
      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.bind('click.chosen', function(evt) {
          if (_this.is_multiple) {
            return _this.container_mousedown(evt);
          } else {
            return _this.activate_field();
          }
        });
      }
    };

    Chosen.prototype.show_search_field_default = function() {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function(evt) {
      if (evt && evt.which !== 3) {
        var target;
        target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
        if (target.length) {
          this.result_highlight = target;
          this.result_select(evt);
          return this.search_field.focus();
        }
      }
    };

    Chosen.prototype.search_results_mouseover = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function(evt) {
      if ($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function(item) {
      var choice, close_link,
        _this = this;
      choice = $('<li />', {
        "class": "search-choice btn btn-default btn-xs"
      }).html("<span>" + item.html + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close close',
          'data-option-array-index': item.array_index
        }).html("&times;");
        close_link.bind('click.chosen', function(evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function(link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        this.show_search_field_default();
        if (this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function() {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.form_field_jq.trigger("change");
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function() {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function(evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result active");
        } else {
          this.reset_single_select_options();
        }
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = this.selected_option_count + 1;
        this.no_remaining_results = this.selected_option_count === this.results_count;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(item.text);
        }
        if (!((evt.metaKey || evt.ctrlKey) && this.is_multiple)) {
          this.results_hide();
        }
        this.search_field.val("");
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.form_field_jq.trigger("change", {
            'selected': this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function(text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").text(text);
    };

    Chosen.prototype.result_deselect = function(pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = this.selected_option_count - 1;
        this.no_remaining_results = false;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.form_field_jq.trigger("change", {
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function() {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_text = function() {
      if (this.search_field.val() === this.default_text) {
        return "";
      } else {
        return $('<div/>').text($.trim(this.search_field.val())).html();
      }
    };

    Chosen.prototype.winnow_results_set_highlight = function() {
      var do_high, selected_results;
      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function(terms) {
      var no_results_html;
      no_results_html = $('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
      no_results_html.find("span").first().html(terms);
      return this.search_results.append(no_results_html);
    };

    Chosen.prototype.no_results_clear = function() {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function() {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function() {
      var prev_sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function() {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus btn-danger");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function() {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus btn-danger");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.keydown_checker = function(evt) {
      var stroke, _ref1;
      stroke = (_ref1 = evt.which) != null ? _ref1 : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.search_field.val().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          evt.preventDefault();
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    Chosen.prototype.search_field_scale = function() {
      var div, f_width, h, style, style_block, styles, w, _i, _len;
      if (this.is_multiple) {
        h = 0;
        w = 0;
        style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";
        styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          style_block += style + ":" + this.search_field.css(style) + ";";
        }
        div = $('<div />', {
          'style': style_block
        });
        div.text(this.search_field.val());
        $('body').append(div);
        w = div.width() + 25;
        div.remove();
        f_width = this.container.outerWidth();
        if (w > f_width - 10) {
          w = f_width - 10;
        }
        return this.search_field.css({
          'width': w + 'px'
        });
      }
    };

    return Chosen;

  })(AbstractChosen);

  $.fn.chosen.Constructor = Chosen;

  Chosen.VERSION = '1.3.0';

}).call(this);

/* ==========================================================
 * wdesk-collapse.js v1.3.0 (http://bit.ly/15J56BZ)
 * adapted from bootstrap-collapse v3.3.2
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

    // COLLAPSE PUBLIC CLASS DEFINITION
    // ================================

    var Collapse = function(element, options) {
        this.$element = $(element);
        this.options  = $.extend({}, Collapse.DEFAULTS, options);
        var o = this.options;

        this.transitioning = null;
        this.transDuration = null;
        this.$heading = this.$element.parent().find('[class*=heading]').first();

        // Default the triggerElem to o.initialRelatedTarget
        if (! o.triggerElem) {
            o.triggerElem = o.initialRelatedTarget;
        }

        // which elem receives the "active" class to indicate selection in a collapsible menu?
        this.$activateElem = $(o.triggerElem).closest(o.activateElem);
        if (this.$activateElem.length === 0 && o.activate) {
            this.$activateElem = this.$element.parent();
        }

        this.$parent = this.$element.closest(o.parent);

        this.shownDescendantCollapses = [];
        this.initAndCacheAncestorCollapses();

        // add a tabindex to make keyboard navigation possible on <div> elements
        // wire up keyboard event listeners
        var $keyboardNavHandler = this.$parent;
        if (!this.$parent || this.$parent.length < 1) {
            $keyboardNavHandler = this.$element.closest('[role=tablist], [role=tree], [data-collapse-container], .panel-group');
        }
        $keyboardNavHandler.on('keydown.wdesk.collapse.data-api', $.proxy(this.keydown, this));
    };

    if (!$.fn.emulateTransitionEnd) {
        throw new Error('wdesk-collapse.js requires wdesk-transition.js');
    }
    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-collapse.js requires wf-vendor.js');
    }

    Collapse.VERSION = '1.3.0';

    Collapse.DEFAULTS = {
        toggle: true,
        parent: false,
        speed: 350,
        triggerElem: null,
        activate: false,
        activateElem: false,
        initialRelatedTarget: false,
        activeClass: 'active'
    };

    Collapse.prototype.initAndCacheAncestorCollapses = function() {
        this.ancestorCollapses = [];
        var parents = this.$element.parents();
        var collapse, $parent;
        for (var i = 0, len = parents.length; i < len; i++) {
            collapse = $.data(parents[i], 'wdesk.collapse');
            // Look for uninitialized ancestor collapses via the data-collapse-trigger attr and initialize them
            // This makes it way easier and more performant to auto expand ancestor collapses
            if (! collapse) {
                $parent = $(parents[i]);

                if ($parent.hasClass('collapse')) {
                    if (! $parent.attr('aria-labelledby')) {
                        console.log('Collapsible element auto initialized without label element data-api options.\nSee docs about usage with aria-labelledby.');
                    }
                    $parent.collapse();

                    collapse = $.data(parents[i], 'wdesk.collapse');
                }
            }
            if (collapse) {
                this.ancestorCollapses.push(collapse);
            }
        }
    };

    Collapse.prototype.dimension = function() {
        var hasWidth = this.$element.hasClass('width');
        return hasWidth ? 'width' : 'height';
    };

    Collapse.prototype.getTransDuration = function() {
        if (!this.transDuration) {
            this.transDuration = $.support.transition ? this.$element.getTransitionDuration() : this.options.speed;
        }
        return this.transDuration;
    };

    Collapse.prototype.deactivate = function(elems, $collapseContainer) {
        var that = this;
        var $this = $(this);
        var o = this.options;
        var $container = $collapseContainer ? $collapseContainer : false;

        var getDeactivatedMenu = function($elem, $btn) {
            var target = getTarget($btn);
            var $menu = $container ? $container.find(target) : $elem.find(target);
            return target && $menu.length > 0 ? $menu : false;
        };

        $.each(elems, function(index, elem) {
            var $elem = $(elem);

            $elem
                .removeClass(o.activeClass)
                .removeClass(o.activeClass + '-parent')
                    .find('> [data-toggle="collapse"]')
                        .attr('aria-selected', false);

            var $btn = $elem.find('> [data-toggle="collapse"]');
            var $menu = getDeactivatedMenu($elem, $btn);
            var deactivateEvent;

            if ($menu) {
                var menuData = $menu.data('wdesk.collapse');
                if (menuData) {
                    deactivateEvent = $.Event('deactivate.wdesk.collapse', { relatedTarget: menuData.options.triggerElem, activeElem: menuData.$activateElem[0] });
                } else {
                    deactivateEvent = $.Event('deactivate.wdesk.collapse');
                }

                // TODO: add this event to collapse docs
                $menu.trigger(deactivateEvent);
            }
        });
    };

    Collapse.prototype.activate = function(_relatedTarget) {
        var that = this;
        var $this = $(this);
        var o = this.options;

        // reset some options based on current event
        o.triggerElem = $(_relatedTarget)[0] || o.triggerElem;
        o.activateElem = o.activateElem || this.$element.parent()[0].nodeName.toLowerCase();

        this.$activateElem = $(o.triggerElem).closest(o.activateElem);

        if (this.$activateElem && this.$activateElem.length) {
            var activateEvent = $.Event('activate.wdesk.collapse', { relatedTarget: o.triggerElem, activeElem: this.$activateElem[0] });

            // first, deactivate any currently activated elems
            var $collapseContainer = this.$activateElem.parents('[data-collapse-container]') || this.$activateElem.parent();
            var deactivateCandidates = null;

            if ($collapseContainer && $collapseContainer.length) {
                // if a collapse container has been specified, we are likely dealing with a multi-level hierarchical collapsing structure...
                // use this container as the starting point to search for currently active elems.
                deactivateCandidates = $collapseContainer.find(o.activateElem).filter('[class*=' + o.activeClass + ']');
            } else {
                // otherwise, its a flat collapsing structure... so just go to the parent and search from there.
                deactivateCandidates = this.$activateElem.parent().find(o.activateElem).filter('[class*=' + o.activeClass + ']');
            }

            if (deactivateCandidates && deactivateCandidates.length > 0) {
                this.deactivate(deactivateCandidates, $collapseContainer);
            }

            $.each(this.ancestorCollapses, function(index, element) {
                // if the active element has parent(s), add the .active-parent class to those.
                try {
                    $(element.$activateElem).addClass(o.activeClass + '-parent');
                } catch(err) {

                }
            });
            // now, activate the new active element
            this.$activateElem
                .addClass(o.activeClass)
                .find('> [data-toggle="collapse"]')
                    .attr('aria-selected', true);

            // broadcast an event signifying that a new elem has been activated
            this.$element.trigger(activateEvent);
        }
    };

    Collapse.prototype.hideCurrentElems = function(currentElems, startEvent) {
        $.each(currentElems, function(index, elem) {
            var $elem = $(elem);
            var hasData = $elem.data('wdesk.collapse');
            if (hasData && hasData.transitioning) {
                return;
            }
            $elem.collapse('hide', startEvent.relatedTarget);
            hasData || $elem.data('wdesk.collapse', null);
        });
    };

    Collapse.prototype.show = function(_relatedTarget) {
        if (this.transitioning || this.$element.hasClass('in')) {
            return;
        }

        var that = this;
        var o = this.options;

        // reset some options based on current event
        o.triggerElem = $(_relatedTarget)[0] || o.triggerElem;

        var startEvent = $.Event('show.wdesk.collapse', { relatedTarget: o.triggerElem });
        this.$element.trigger(startEvent);

        if (startEvent.isDefaultPrevented()) {
            return;
        }

        // Collapse all currently expanded siblings IF parent option is set
        if (this.ancestorCollapses.length && o.parent) {
            var parentCollapse = this.ancestorCollapses[0];
            // Iterate through the parent's descendants to find siblings
            var descendantCollapse, descendantParentCollapse;
            for (var i = 0, len = parentCollapse.shownDescendantCollapses.length; i < len; i++) {
                descendantCollapse = parentCollapse.shownDescendantCollapses[i];
                // allow for an undefined descendantCollapse.ancestorCollapses array,
                // as the loop counter can get fouled in MSIE8
                if (descendantCollapse && descendantCollapse.ancestorCollapses && descendantCollapse.ancestorCollapses[0]) {
                    descendantParentCollapse = descendantCollapse.ancestorCollapses[0];
                    // Check to see if the descendant is a direct child of the parent, and thus, a sibling
                    if (descendantParentCollapse === parentCollapse) {
                        descendantCollapse.hide();
                    }
                }
            }
        }

        // find all currently expanded elems under $parent and collapse them
        var currentElems = this.$parent.find('> [class*=group] > .in');
        if (currentElems && currentElems.length) {
            this.hideCurrentElems(currentElems, startEvent);
        } else {
            currentElems = this.$parent.find('> [class*=group] > .panel > .in');
            this.hideCurrentElems(currentElems, startEvent);
        }

        // Recursively expand all ancestor collapse elements, only animating the rootmost collapsed element
        var autoExpandParentCollapse = this.ancestorCollapses.length && ! this.ancestorCollapses[0].$element.hasClass('in');
        if (autoExpandParentCollapse) {
            this.nextTransitionDisabled = true;
        }


        var dimension = this.dimension();

        // decorate the heading, trigger elem (related target), and collapse trigger
        this.$heading.add(o.triggerElem).add(o.initialRelatedTarget)
            .addClass('open')
            .removeClass('collapsed')
            .attr({
                'tabindex': '0',
                'aria-expanded': true
            })
            .focus();

        // decorate the collapsing elem
        this.$element
            .removeClass('collapse')
            .addClass('collapsing')
            [dimension](0);

        this.transitioning = 1;

        var complete = function(e) {
            if (e && e.target !== that.$element[0]) {
                return;
            }

            that.$element
                .removeClass('collapsing')
                .addClass('collapse in')
                .attr({
                    'aria-hidden': false
                })
                .removeAttr('tabindex')
                [dimension]('auto');

            that.transitioning = 0;
            that.nextTransitionDisabled = false;

            var completeEvent = $.Event('shown.wdesk.collapse', { relatedTarget: o.triggerElem });
            that.$element.trigger(completeEvent);

            // Update state of ancestor collapses
            var collapse;
            for (var i = 0, len = that.ancestorCollapses.length; i < len; i++) {
                that.ancestorCollapses[i].shownDescendantCollapses.push(that);
            }

            if (autoExpandParentCollapse) {
                that.ancestorCollapses[0].show();
            }
        };

        if (!$.support.transition || this.nextTransitionDisabled) {
            return complete.call(this);
        }

        var scrollSize = $.camelCase(['scroll', dimension].join('-'));

        this.$element
            .one('wdeskTransitionEnd', $.proxy(complete, this))
            .emulateTransitionEnd(this.getTransDuration())
            [dimension](this.$element[0][scrollSize]);
    };

    Collapse.prototype.hide = function(_relatedTarget) {
        if (this.transitioning || !this.$element.hasClass('in')) {
            return;
        }

        var that = this;
        var o = this.options;

        // reset some options based on current event
        o.triggerElem = $(_relatedTarget)[0] || o.triggerElem;

        var startEvent = $.Event('hide.wdesk.collapse', { relatedTarget: o.triggerElem });
        this.$element.trigger(startEvent);

        if (startEvent.isDefaultPrevented()) {
            return;
        }

        var dimension = this.dimension();

        // decorate the heading, trigger elem (related target), and collapse trigger
        this.$heading.add(o.triggerElem).add(o.initialRelatedTarget)
            .addClass('collapsed')
            .removeClass('open')
            .attr('aria-expanded', false);

        // decorate the collapsing elem
        this.$element
            [dimension](this.$element[dimension]())
            [0].offsetHeight;
        this.$element
            .addClass('collapsing')
            .removeClass('collapse')
            .removeClass('in');

        this.transitioning = 1;

        var complete = function() {
            var i;

            var completeEvent = $.Event('hidden.wdesk.collapse', { relatedTarget: o.triggerElem });

            that.transitioning = 0;
            that.nextTransitionDisabled = false;

            that.$element
                .removeClass('collapsing')
                .addClass('collapse')
                .attr({
                    'tabindex': '-1',
                    'aria-hidden': true
                })
                .trigger(completeEvent);

            var collapse;

            // Collapse all currently expanded descendants synchronously, without any transition.
            // A collapsing element may or may not remove itself from all ancestors'
            // shownDescendantCollapses arrays, so we gots to be tricky to loop over them
            var oldTransitionDisabled;
            for (i = 0; i < that.shownDescendantCollapses.length;) {
                collapse = that.shownDescendantCollapses[i];
                collapse.nextTransitionDisabled = true;
                collapse.hide();
                // If the collapse didn't remove itself from this array, it cancelled the hide.
                if (collapse === that.shownDescendantCollapses[i]) {
                    // Move on to the next one.
                    i++;
                }
            }

            // Update state of ancestor collapses
            var index, len;
            for (i = 0, len = that.ancestorCollapses.length; i < len; i++) {
                index = that.ancestorCollapses[i].shownDescendantCollapses.indexOf(that);
                if (index !== -1) {
                    that.ancestorCollapses[i].shownDescendantCollapses.splice(index, 1);
                }
            }
        };

        if (!$.support.transition || this.nextTransitionDisabled) {
            return complete.call(this);
        }

        this.$element
            [dimension](0)
            .one('wdeskTransitionEnd', $.proxy(complete, this))
            .emulateTransitionEnd(this.getTransDuration());
    };

    Collapse.prototype.toggle = function(_relatedTarget) {
        this[this.$element.hasClass('in') ? 'hide' : 'show'](_relatedTarget);
    };

    Collapse.prototype.keydown = function(event) {
        if (event.isDefaultPrevented() || $(event.target).is(':input')) {
            return;
        }

        var that = this,
            $items,
            $currentItem,
            index,
            key = event.which || event.keyCode;

        var $collapseParent = this.$element.closest('.panel-group');
        var $treeParent = this.$element.closest('[role=tree]');

        if ($collapseParent.length) {

            if (!/(13|32|37|38|39|40)/.test(key)) {
                return;
            }

            // in order to support nested collapses, only count items that are visible
            $items = $collapseParent.find('[data-toggle=collapse]:visible');

            if (!$items.length) {
                return;
            }

            // which $item has :focus?
            index = $items.index($(document.activeElement));
            $currentItem = $items.eq(index);

            if (key == 32 || key == 13) {
                if ($currentItem.is('.disabled', ':disabled')) {
                    return;
                }

                if (!$treeParent.length) { // standard panel / accordion collapse

                    $currentItem.trigger('click');

                } else { // tree collapse

                    if ($currentItem.attr('aria-selected') == 'true') {
                        var elemCollapsed = $currentItem.attr('aria-expanded') == 'true';
                        // try to click the caret that will collapse without deactivating
                        $currentItem.parent().find('[data-activate=false]').click();

                        if (elemCollapsed) {
                            $items.eq(index - 1).focus();
                            // since collapsing will make the current item un-focusable,
                            // focus the previous item
                        } else {
                            // else focus the current element after clicking
                            // it's "data-activate=false" sister element
                            // since the sister element is likely not visible / lacks a tabindex
                            $currentItem.focus();
                        }
                    } else {
                        $currentItem.trigger('click');
                    }

                }

                index = $items.index($(document.activeElement));
            }

            if (key == 38 || key == 37) { index--; } // up & left
            if (key == 40 || key == 39) { index++; } // down & right

            if (index < 0) {
                index = $items.length - 1;
            }
            if (index == $items.length) {
                index = 0;
            }

            $currentItem = $items.eq(index);
            $currentItem.focus();

            event.preventDefault();
            event.stopPropagation();
        } else {
            // something went wrong... no panel-group found
        }
    };


    // COLLAPSE PLUGIN DEFINITION
    // ==========================

    function Plugin(option, _relatedTarget) {
        return this.each(function() {
            var $this = $(this);
            var collapse  = $this.data('wdesk.collapse');
            var $relatedTarget =  $(_relatedTarget);

            if (! collapse) {
                var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option);

                // If no valid _relatedTarget was passed in, default to the element specified by the aria-labelledby attribute
                if ($relatedTarget.length === 0) {
                    var labelId = $this.attr('aria-labelledby');
                    if (labelId) {
                        /*
                            Why not use $('#' + labelId), you ask?
                            Since aria-labelledby specifies just an ID, not a selector, it can be an ID with
                            characters that get identified as parts of other selectors by jQuery.

                            var looksLikeSelector = 'yolo.swag';
                            document.body.id = looksLikeSelector;
                            console.log(!! document.getElementById(looksLikeSelector)); // prints true
                            console.log(!! $('#' + looksLikeSelector)[0]);              // prints false
                        */
                        $relatedTarget = $(document.getElementById(labelId));
                    }
                }

                if ($relatedTarget.length) {
                    $.extend(options, $relatedTarget.data());
                    options.initialRelatedTarget = $relatedTarget[0];
                }
                collapse = new Collapse(this, options);
                $this.data('wdesk.collapse', collapse);
            }
            if (typeof option == 'string') {
                collapse[option]($relatedTarget[0]);
            }
        });
    }

    var old = $.fn.collapse;

    $.fn.collapse             = Plugin;
    $.fn.collapse.Constructor = Collapse;


    // COLLAPSE NO CONFLICT
    // ====================

    $.fn.collapse.noConflict = function() {
        $.fn.collapse = old;
        return this;
    };


    // COLLAPSE DATA-API
    // =================

    $(document).on('click.wdesk.collapse.data-api', '[data-toggle=collapse]', function(e) {
        var $this   = $(this), href;
        var target  = getTarget($this, e);
        var $target = $(target);
        // if there are nested elems within a [data-toggle=collapse] elem... which one was clicked?
        var $relatedTarget = $(e.target);
        // does the nested item instruct use that a click "activates" a menu item?
        var activate = !! $relatedTarget.data('activate');

        var collapse = $target.data('wdesk.collapse');

        if (! collapse) {
            // Initialize the collapse with 'this' (the [data-toggle=collapse] elem) as
            // the related target so that it loads the data attribute settings properly
            Plugin.call($target, {}, this);

            collapse = $target.data('wdesk.collapse');
        }

        if (activate) {
            // "activate" and show the specified elem
            collapse.activate($relatedTarget);
            collapse.show($relatedTarget);
        } else {
            collapse.toggle($relatedTarget);
        }
    });


    // HELPER FUNCTION(S)
    // ====================

    var getTarget = function(elem, event) {
        // determine the target elem to be collapsed via
        //   1. `data-target` attribute
        //   2. `aria-controls` attribute
        //   3. `href` attribute
        var href = elem.attr('href');
        var target = elem.attr('data-target');

        if (!target) {
            if (href) {
                event && event.preventDefault();
                target = href.replace(/.*(?=#[^\s]+$)/, ''); //strip for ie7
            } else {
                target = '#' + elem.attr('aria-controls');
            }
        }

        return target;
    };
});

if (define.isFake) {
    define = undefined;
}

/* ==========================================================
 * wdesk-datepicker.js v1.3.0 (http://bit.ly/1hdXeCi)
 * adapted from bootstrap-datepicker - http://bit.ly/1cBY5uw
 * ===================================================
 * Copyright 2015 Workiva
 * ========================================================== */

/* jshint loopfunc: true, newcap: false, shadow: true */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery'],

function($) {

    'use strict';

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-datepicker.js requires wf-vendor.js');
    }

    // HELPER FUNCTIONS
    // ==============================

    var $window = $(window);
    var $document = $(document);

    function utcDate() {
        return new Date(Date.UTC.apply(Date, arguments));
    }
    function utcToday() {
        var today = new Date();
        return utcDate(today.getFullYear(), today.getMonth(), today.getDate());
    }
    function opts_from_el(el, prefix) {
        // Derive options from element data-attrs
        var data = $(el).data();
        var out = {};
        var inkey;
        var replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])');
        prefix = new RegExp('^' + prefix.toLowerCase());

        for (var key in data)
            if (prefix.test(key)) {
                inkey = key.replace(replace, function(_, a) { return a.toLowerCase(); });
                out[inkey] = data[key];
            }
        return out;
    }
    function opts_from_locale(lang) {
        // Derive options from locale plugins
        var out = {};
        // Check if "de-DE" style date is available, if not language should
        // fallback to 2 letter code eg "de"
        if (!dates[lang]) {
            lang = lang.split('-')[0];
            if (!dates[lang]) {
                return;
            }
        }
        var d = dates[lang];
        $.each(locale_opts, function(i,k) {
            if (k in d) {
                out[k] = d[k];
            }
        });
        return out;
    }

    // DATE PICKER PUBLIC CLASS DEFINITION
    // ==============================

    var Datepicker = function(element, options) {
        this.date = undefined;
        this.viewDate = utcToday();

        this._process_options(options);

        this.element = $(element);
        this.isShown = false;
        this.isInline = false;
        this.isInput = this.element.is('.form-control');
        this.component = this.element.is('.date') ? this.element.find('.input-group-addon, .btn') : false;
        this.hasInput = this.component && this.element.find('.form-control').length;
        this.focusElem = this.isInput ? this.element : (this.hasInput ? this.element.find('.form-control') : (this.component ? this.component : this.element));

        if (!this.focusElem[0]) {
            this.focusElem = this.element;
        }
        if (this.component && this.component.length === 0) {
            this.component = false;
        }

        this.picker = $(DPGlobal.template);

        this.isDateRange = this.element.is('input-daterange');
        this.$rangeContainer = this.element.is('.input-daterange') ? this.element : this.element.closest('.input-daterange');
        this.isDateRange = this.$rangeContainer.length > 0;
        this.this_dateRange = this.isDateRange && this.$rangeContainer.data('wdesk.datepicker');

        this._buildEvents();
        this._attachEvents();

        if (this.isInline) {
            this.picker.addClass('datepicker-inline').appendTo(this.element);
        } else {
            this.picker.addClass('datepicker-dropdown');
        }

        if (this.o.rtl) {
            this.picker.addClass('datepicker-rtl');
            this.picker
                .find('.prev i, .next i')
                    .toggleClass('icon-chevron-left icon-chevron-right');
        }

        this.viewMode = this.o.startView;

        if (this.o.calendarWeeks) {
            this.picker
                .find('tfoot th.today')
                    .attr('colspan', function(i, val) {
                        return parseInt(val, 10) + 1;
                    });
        }

        this._allow_update = false;

        this.setStartDate(this._o.startDate);
        this.setEndDate(this._o.endDate);
        this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);

        this.fillDow();
        this.fillMonths();

        this._allow_update = true;

        this.update();
        this.showMode();

        if (this.isInline) {
            this.show();
        }
    };


    // COLLECTIONS / CONSTANTS
    Datepicker.VERSION = '1.3.0';
    Datepicker.prototype._events = [];
    Datepicker.prototype._secondaryEvents = [];
    Datepicker.prototype._allow_update = true;


    // METHODS
    Datepicker.prototype._process_options = function(opts) {
        // Store raw options for reference
        this._o = $.extend({}, this._o, opts);
        // Processed options
        var o = this.o = $.extend({}, this._o);

        // Check if "de-DE" style date is available, if not language should
        // fallback to 2 letter code eg "de"
        var lang = o.language;
        if (!dates[lang]) {
            lang = lang.split('-')[0];
            if (!dates[lang]) {
                lang = defaults.language;
            }
        }
        o.language = lang;
        o.keyboardNavigation = this.isInline ? false : o.keyboardNavigation;

        switch (o.startView)
        {
        case 2:
        case 'decade':
            o.startView = 2;
            break;
        case 1:
        case 'year':
            o.startView = 1;
            break;
        default:
            o.startView = 0;
        }

        switch (o.minViewMode)
        {
        case 1:
        case 'months':
            o.minViewMode = 1;
            break;
        case 2:
        case 'years':
            o.minViewMode = 2;
            break;
        default:
            o.minViewMode = 0;
        }

        o.startView = Math.max(o.startView, o.minViewMode);

        o.weekStart %= 7;
        o.weekEnd = ((o.weekStart + 6) % 7);

        var format = DPGlobal.parseFormat(o.format);
        if (o.startDate !== -Infinity) {
            if (!!o.startDate) {
                if (o.startDate instanceof Date) {
                    o.startDate = this._local_to_utc(this._zero_time(o.startDate));
                } else {
                    o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
                }
            } else {
                o.startDate = -Infinity;
            }
        }
        if (o.endDate !== Infinity) {
            if (!!o.endDate) {
                if (o.endDate instanceof Date) {
                    o.endDate = this._local_to_utc(this._zero_time(o.endDate));
                } else {
                    o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
                }
            } else {
                o.endDate = Infinity;
            }
        }

        o.daysOfWeekDisabled = o.daysOfWeekDisabled || [];
        if (!$.isArray(o.daysOfWeekDisabled)) {
            o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
        }
        o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function(d) {
            return parseInt(d, 10);
        });

        var plc  = String(o.orientation).toLowerCase().split(/\s+/g),
            _plc = o.orientation.toLowerCase();
        plc = $.grep(plc, function(word) {
            return (/^auto|left|right|top|bottom$/).test(word);
        });
        o.orientation = {x: 'auto', y: 'auto'};
        if (!_plc || _plc === 'auto') {
            // no action
        } else if (plc.length === 1) {
            switch (plc[0])
            {
            case 'top':
            case 'bottom':
                o.orientation.y = plc[0];
                break;
            case 'left':
            case 'right':
                o.orientation.x = plc[0];
                break;
            }
        } else {
            _plc = $.grep(plc, function(word) {
                return (/^left|right$/).test(word);
            });
            o.orientation.x = _plc[0] || 'auto';

            _plc = $.grep(plc, function(word) {
                return (/^top|bottom$/).test(word);
            });
            o.orientation.y = _plc[0] || 'auto';
        }
    };

    Datepicker.prototype._applyEvents = function(events) {
        for (var i = 0, element, event; i < events.length; i++) {
            element = events[i][0];
            event = events[i][1];
            element.on(event);
        }
    };

    Datepicker.prototype._unapplyEvents = function(events) {
        for (var i = 0, element, event; i < events.length; i++) {
            element = events[i][0];
            event = events[i][1];
            element.off(event);
        }
    };

    Datepicker.prototype._buildEvents = function() {
        if (this.isInput) { // single input
            this._events = [
                [this.element, {
                    focus:   $.proxy(function() { this.show(this.element) }, this),
                    keyup:   $.proxy(function() { this.update() }, this),
                    keydown: $.proxy(this.keydown, this)
                }]
            ];
        } else if (this.component && this.hasInput) { // component: input + button
            var $input = this.element.find('.form-control');
            var $addon = this.element.find('.input-group-addon');

            this._events = [
                // For components that are not readonly, allow keyboard nav
                [$input, {
                    focus:   $.proxy(function() { this.show($input) }, this),
                    keyup:   $.proxy(function() { this.update() }, this),
                    keydown: $.proxy(this.keydown, this)
                }],
                [$addon, {
                    click:   $.proxy(function() { $input.focus() }, this)
                }]
            ];
        } else if (this.element.is('[data-provide="datepicker-inline"]')) {  // inline datepicker
            this.isInline = true;
            this._events = [
                [this.picker, {
                    click: $.proxy(this.click, this)
                }]
            ];
        } else {
            this._events = [
                [this.element, {
                    focus: $.proxy(function() { this.show(this.element) }, this),
                    click: $.proxy(function() { this.show(this.element) }, this)
                }]
            ];
        }

        if (!this.isInline) {
            this._secondaryEvents = [
                [this.picker, {
                    click: $.proxy(this.click, this)
                }],
                [$(window), {
                    resize: $.proxy(this.place, this)
                }],
                [$(document), {
                    'click': $.proxy(function(event) {
                        var $target = $(event.target);
                        var isAnotherDatepickerInput = $target.data('wdesk.datepicker') && $target.is('.form-control');
                        // Clicked outside the datepicker, hide it
                        if (!(
                            this.element.is(event.target) ||
                            this.element.find(event.target).length ||
                            this.picker.is(event.target) ||
                            this.picker.find(event.target).length
                        )) {
                            if (isAnotherDatepickerInput) {
                                var $prevDp = $(document.body).data('previousDatepicker');

                                if ($prevDp) {
                                    if (this.isDateRange && $prevDp.isDateRange) {
                                        $prevDp.hide('mutex_range');
                                    } else {
                                        $prevDp.hide('mutex');
                                    }
                                }
                            } else {
                                this.hide('exit');
                            }
                        }
                    }, this)
                }]
            ];
        }
    };

    Datepicker.prototype._attachEvents = function() {
        this._detachEvents();
        this._applyEvents(this._events);
    };

    Datepicker.prototype._detachEvents = function() {
        this._unapplyEvents(this._events);
    };

    Datepicker.prototype._attachSecondaryEvents = function() {
        this._detachSecondaryEvents();
        this._applyEvents(this._secondaryEvents);
    };

    Datepicker.prototype._detachSecondaryEvents = function() {
        this._unapplyEvents(this._secondaryEvents);
    },

    Datepicker.prototype._trigger = function(event, altdate) {
        var date = altdate || this.date,
            local_date = this._utc_to_local(date);

        var _format =
            $.proxy(function(altformat) {
                var format = altformat || this.o.format;
                return DPGlobal.formatDate(date, format, this.o.language);
            }, this);

        var namespacedEvent = $.Event(event + '.wdesk.datepicker', {
            date: local_date,
            format: _format
        });

        this.element.trigger(namespacedEvent);
    };

    Datepicker.prototype.setDateRangeDom = function() {
        this.$rangeContainer = this.element.is('.input-daterange') ? this.element : this.element.closest('.input-daterange');
        this.isDateRange = this.$rangeContainer.length > 0;
        this.this_dateRange = this.isDateRange && this.$rangeContainer.data('wdesk.datepicker');
    };

    Datepicker.prototype.isStartDateOfRange = function() {
        this.setDateRangeDom();

        if (this.isDateRange && this.this_dateRange && this.focusElem.is($(this.this_dateRange.inputs[0]))) {
            // console.log('isStartDateOfRange', this);
            return true;
        } else {
            return false;
        }
    };

    Datepicker.prototype.isEndDateOfRange = function() {
        this.setDateRangeDom();

        if (this.isDateRange && this.this_dateRange && this.focusElem.is($(this.this_dateRange.inputs[1]))) {
            // console.log('isEndDateOfRange', this);
            return true;
        } else {
            return false;
        }
    };

    Datepicker.prototype.enableBodyScroll = function() {
        if (!this.isShown || !this.picker.is(':visible')) {
            $(document.body).removeClass('modal-open');
        }
    };

    Datepicker.prototype.disableBodyScroll = function() {
        if (this.isShown || this.picker.is(':visible')) {
            $(document.body).addClass('modal-open');
        }
    };

    Datepicker.prototype.show = function(relatedTarget) {
        if (this.isShown) {
            // console.log('show return early');
            this.disableBodyScroll();
            return;
        }

        if (!this.isInline) {
            this.picker.appendTo('body');
            this.disableBodyScroll();

            if (this.component || (!this.isInput && (this.focusElem === this.element))) {
                if (this.focusElem[0] !== document.activeElement) {
                    this.refocus(true); // actually focus the input if it wasn't already
                    return; // the refocus will trigger show again, so return here to prevent show event from triggering twice
                }
            }
        }

        this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
        this.picker.css('display', 'block');
        this.place();
        this.isShown = true;
        this._attachSecondaryEvents();
        this._registerMutex();
        this._trigger('show');
    };

    Datepicker.prototype.focusNext = function($rangeContainer, this_dateRange) {
        var secondInput = this_dateRange.inputs[1];

        // its a range, and they picked a date for startDate
        // so if the second date is still blank... focus it
        // automagically to make it easier for the user to
        // pick two dates in-succession
        if (!$(secondInput).val()) {
            // console.log('focusNext', this.isShown);
            $(secondInput).focus();
        }
    };

    Datepicker.prototype.focusPrev = function($rangeContainer, this_dateRange) {
        var firstInput = this_dateRange.inputs[0];

        $(firstInput).focus();
    };

    Datepicker.prototype.refocus = function(shown) {
        if (!this.isInline) {
            // re-focus the elem that triggered the datepicker
            // without re-opening the datepicker
            this.focusElem &&
            this.focusElem
                .data('refocused', true)
                .focus();

            this.isShown = shown;

            if (this.isShown) {
                this.disableBodyScroll();
            } else {
                this.enableBodyScroll();
            }
        }
    };

    Datepicker.prototype.dateRangePickerHide = function(method, event) {
        event = event || null;

        var preventTabDefault = true;
        var $dateRangeStart = $(this.this_dateRange.inputs[0]);
        var $dateRangeEnd = $(this.this_dateRange.inputs[1]);

        if (this.isStartDateOfRange()) {
            // ----------------------------------------------------
            //   START DATE HAS FOCUS
            // ----------------------------------------------------
            if (method !== 'tab_shift') {
                //
                // shift + tab means focus previous item - not the next one
                // so only execute this logic if that is not the case
                //
                if (!$dateRangeEnd.val()) {
                    // end date value is empty... auto-focus it
                    this.focusNext(this.$rangeContainer, this.this_dateRange);
                    $dateRangeStart.data('refocused', false);
                } else {
                    if (method !== 'tab') {
                        this.refocus(this.isShown);
                    } else {
                        //
                        // the endDate has a value, but the user
                        // pressed the tab key, so we should focus
                        // that field even though they did not select
                        // a new date.
                        //
                        preventTabDefault = false;
                        $dateRangeStart.data('refocused', false);
                        $dateRangeEnd.data('refocused', false);
                    }
                }
            } else {
                //
                // shift + tab means we should not prevent default
                // so that the natural tab order in the layout is preserved
                //
                preventTabDefault = false;
            }
        } else {
            // ----------------------------------------------------
            //   END DATE HAS FOCUS
            // ----------------------------------------------------
            if (method === 'tab_shift') {
                //
                // shift + tab means focus previous item - not the next one
                // in this case, that means focus the startDate input
                //
                this.focusPrev(this.$rangeContainer, this.this_dateRange);
                $dateRangeEnd.data('refocused', false);
            } else if (method === 'tab') {
                //
                // do not prevent default so that tab order in layout
                // is preserved regardless of datepicker responsibilities
                //
                preventTabDefault = false;
                $dateRangeStart.data('refocused', false);
                $dateRangeEnd.data('refocused', false);
            } else {
                //
                // as long as method is not tab, simply refocus the endDate
                // if it was a tab - we should not refocus so that the natural
                // tab order in the layout is preserved
                //
                if (method !== 'mutex_range') {
                    this.refocus(this.isShown);
                } else {
                    //
                    // the endDate was focused, and the startDate was clicked
                    // so do not re-focus the endDate
                    //
                }
            }
        }

        if (preventTabDefault) {
            $dateRangeStart.data('refocused', false);
            $dateRangeEnd.data('refocused', false);
            event && event.preventDefault();
        }
    };

    Datepicker.prototype.hide = function(method, event) {
        event = event || null;
        this.isDateRange = this.isStartDateOfRange() || this.isEndDateOfRange();
        var shouldRefocus = true;

        if (!this.isShown || this.isInline) {
            return;
        }

        method = method || null;

        this.picker
            .removeClass('in')
            .detach();

        this._detachSecondaryEvents();
        this.viewMode = this.o.startView;
        this.showMode();

        this.enableBodyScroll();

        if (this.valueShouldBeSetOnHide()) {
            this.setValue();
        }

        if (method !== 'exit') {
            if (this.isDateRange) {
                this.dateRangePickerHide(method, event);
                shouldRefocus = false;
            }
        }

        if (method === 'mutex') {
            shouldRefocus = false;
        }

        shouldRefocus && this.refocus(false);

        this.isShown = false;
        this._trigger('hide');
    };

    Datepicker.prototype.remove = function() {
        this.hide();
        this._detachEvents();
        this._detachSecondaryEvents();
        this.picker.remove();

        this.element
            .off('.datepicker')
            .removeData('wdesk.datepicker');
        if (!this.isInput) {
            this.element.removeData('date');
        }
    };

    Datepicker.prototype._registerMutex = function() {
        var $docBody = $(document.body);
        var currentDp = $docBody.data('currentDatepicker');
        var previousDp = false;

        // console.log(this);

        if (currentDp) {
            previousDp = $docBody.data('previousDatepicker', currentDp);
        }

        $docBody.data('currentDatepicker', this);
    };

    Datepicker.prototype._utc_to_local = function(utc) {
        return utc && new Date(utc.getTime() + (utc.getTimezoneOffset() * 60000));
    };

    Datepicker.prototype._local_to_utc = function(local) {
        return local && new Date(local.getTime() - (local.getTimezoneOffset() * 60000));
    };

    Datepicker.prototype._zero_time = function(local) {
        return local && new Date(local.getFullYear(), local.getMonth(), local.getDate());
    };

    Datepicker.prototype._zero_utc_time = function(utc) {
        return utc && new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()));
    };

    Datepicker.prototype.getDate = function() {
        return this._utc_to_local(this.getUTCDate());
    };

    Datepicker.prototype.getUTCDate = function() {
        return this.date;
    };

    Datepicker.prototype.setDate = function(d) {
        this.setUTCDate(this._local_to_utc(d));
    };

    Datepicker.prototype.setUTCDate = function(d) {
        this.date = d;
        this.setValue();
    };

    Datepicker.prototype.valueShouldBeSetOnHide = function() {
        var inputHasValue = this.isInput && this.element.val() || this.hasInput && this.element.find('.form-control').val();
        return this.o.forceParse && inputHasValue;
    };

    Datepicker.prototype.setValue = function() {
        var formatted = this.getFormattedDate();
        if (!this.isInput) {
            if (this.component) {
                this.element
                    .find('.form-control')
                        .val(formatted).change();
            }
        } else {
            this.element
                .val(formatted).change();
        }
    };

    Datepicker.prototype.getFormattedDate = function(format) {
        if (format === undefined) {
            format = this.o.format;
        }
        return DPGlobal.formatDate(this.date, format, this.o.language);
    };

    Datepicker.prototype.setStartDate = function(startDate) {
        this._process_options({startDate: startDate});
        this.update();
        this.updateNavArrows();
    };

    Datepicker.prototype.setEndDate = function(endDate) {
        this._process_options({endDate: endDate});
        this.update();
        this.updateNavArrows();
    };

    Datepicker.prototype.setDaysOfWeekDisabled = function(daysOfWeekDisabled) {
        this._process_options({daysOfWeekDisabled: daysOfWeekDisabled});
        this.update();
        this.updateNavArrows();
    };

    Datepicker.prototype.place = function() {
        if (this.isInline) {
            return;
        }
        var calendarWidth  = this.picker.outerWidth(),
            calendarHeight = this.picker.outerHeight(),
            visualPadding  = 10,
            windowWidth    = $window.width(),
            windowHeight   = $window.height(),
            docHeight      = $document.height(),
            scrollTop      = $window.scrollTop();

        var zIndex = parseInt(this.element.parents().filter(function() {
                        return $(this).css('z-index') != 'auto';
                    }).first().css('z-index'), 10) + 10;
        var offset = this.component ? this.component.parent().offset() : this.element.offset();
        var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
        var width  = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
        var left   = offset.left;
        var top    = offset.top;
        var bottom = docHeight - top + visualPadding + 2; // the extra two is the border

        this.picker.removeClass(
            'top bottom ' +
            'orient-right orient-left'
        );

        if (this.o.orientation.x !== 'auto') {
            this.picker.addClass('orient-' + this.o.orientation.x);
            if (this.o.orientation.x === 'right') {
                left -= calendarWidth - width;
            }
        } else {
            // auto x orientation is best-placement: if it crosses a window edge, fudge it sideways
            // Default to left
            this.picker.addClass('orient-left');
            if (offset.left < 0) {
                left -= offset.left - visualPadding;
            } else if (offset.left + calendarWidth > windowWidth) {
                left = windowWidth - calendarWidth - visualPadding;
            }
        }

        // auto y orientation is best-situation: top or bottom, no fudging,
        // decision based on which shows more of the calendar
        var yorient = this.o.orientation.y,
            top_overflow, bottom_overflow;
        if (yorient === 'auto') {
            top_overflow = -scrollTop + offset.top - calendarHeight;
            bottom_overflow = scrollTop + windowHeight - (offset.top + height + calendarHeight);
            if (Math.max(top_overflow, bottom_overflow) === bottom_overflow) {
                yorient = 'bottom';
            } else {
                yorient = 'top';
            }
        }
        this.picker.addClass(yorient);
        if (yorient === 'bottom') {
            top += height;
            this.picker.css({
                bottom: 'auto',
                top: top,
                left: left,
                zIndex: zIndex
            });
        } else {
            // in this case, we want to use bottom positioning so that if there is a variance in
            // overall height between the days / months / years veiws... the "arrow" of the container
            // will still be pointing at the correct spot
            this.picker.css({
                bottom: bottom,
                top: 'auto',
                left: left,
                zIndex: zIndex
            });
        }

        this.picker.addClass('in'); // begin fade animation
    };

    Datepicker.prototype.update = function() {
        if (!this._allow_update) {
            return;
        }

        var oldDate = this.date && new Date(this.date),
            date, fromArgs = false;
        if (arguments.length) {
            date = arguments[0];
            if (date instanceof Date) {
                date = this._local_to_utc(date);
            }
            fromArgs = true;
        } else {
            date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('.form-control').val();
            this.element.removeData('date');
        }

        this.date = DPGlobal.parseDate(date, this.o.format, this.o.language);

        if (this.date < this.o.startDate) {
            this.viewDate = new Date(this.o.startDate);
            this.date = new Date(this.o.startDate);
        } else if (this.date > this.o.endDate) {
            this.viewDate = new Date(this.o.endDate);
            this.date = new Date(this.o.endDate);
        } else if (this.date) {
            this.viewDate = new Date(this.date);
            this.date = new Date(this.date);
        } else {
            this.date = undefined;
        }

        if (fromArgs) {
            // setting date by clicking
            this.setValue();
        } else if (date) {
            // setting date by typing
            if (oldDate && this.date && oldDate.getTime() !== this.date.getTime()) {
                this._trigger('changeDate');
            }
        }
        if (!this.date && oldDate) {
            this._trigger('clearDate');
        }

        this.fill();
    };

    Datepicker.prototype.fillDow = function() {
        var dowCnt = this.o.weekStart,
        html = '<tr>';
        if (this.o.calendarWeeks) {
            var cell = '<th scope="col" class="cw">&nbsp;</th>';
            html += cell;
            this.picker
                .find('.datepicker-days thead tr:first-child')
                    .prepend(cell);
        }
        while (dowCnt < this.o.weekStart + 7) {
            html += '<th scope="col" class="dow">' + dates[this.o.language].daysMin[(dowCnt++) % 7] + '</th>';
        }
        html += '</tr>';
        this.picker
            .find('.datepicker-days thead')
                .append(html);
    };

    Datepicker.prototype.fillMonths = function() {
        var html = '',
            i = 0;
        while (i < 12) {
            html += '<span class="month">' + dates[this.o.language].monthsShort[i++] + '</span>';
        }
        this.picker
            .find('.datepicker-months td')
                .html(html);
    };

    Datepicker.prototype.setRange = function(range) {
        if (!range || !range.length) {
            delete this.range;
        } else {
            this.range = $.map(range, function(d) { return d.valueOf(); });
        }
        this.fill();
    };

    Datepicker.prototype.getClassNames = function(date) {
        var cls = [],
            year = this.viewDate.getUTCFullYear(),
            month = this.viewDate.getUTCMonth(),
            currentDate = this.date && this.date.valueOf(),
            today = new Date();
        if (date.getUTCFullYear() < year || (date.getUTCFullYear() == year && date.getUTCMonth() < month)) {
            cls.push('old');
        } else if (date.getUTCFullYear() > year || (date.getUTCFullYear() == year && date.getUTCMonth() > month)) {
            cls.push('new');
        }
        // Compare internal UTC date with local today, not UTC today
        if (this.o.todayHighlight &&
            date.getUTCFullYear() == today.getFullYear() &&
            date.getUTCMonth() == today.getMonth() &&
            date.getUTCDate() == today.getDate()) {
            cls.push('today');
        }
        if (date.valueOf() == currentDate) {
            cls.push('active');
        }
        if (date.valueOf() < this.o.startDate || date.valueOf() > this.o.endDate ||
            $.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1) {
            cls.push('disabled');
        }
        if (this.range) {
            if (date > this.range[0] && date < this.range[this.range.length - 1]) {
                cls.push('range');
            }
            if ($.inArray(date.valueOf(), this.range) != -1) {
                cls.push('selected');
            }
        }
        return cls;
    };

    Datepicker.prototype.fill = function() {
        var d = new Date(this.viewDate),
            year = d.getUTCFullYear(),
            month = d.getUTCMonth(),
            startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
            startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
            endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
            endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
            tooltip,
            isActive,
            isDisabled,
            isOld,
            isNew;

        this.picker
            .find('.datepicker-days thead th.datepicker-switch')
                .text(dates[this.o.language].months[month] + ' ' + year);
        this.picker
            .find('tfoot th.today')
                .text(dates[this.o.language].today)
                .toggle(this.o.todayBtn !== false);
        this.picker
            .find('tfoot th.clear')
                .text(dates[this.o.language].clear)
                .toggle(this.o.clearBtn !== false);
        this.updateNavArrows();
        this.fillMonths();
        var prevMonth = utcDate(year, month - 1, 28),
            day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
        prevMonth.setUTCDate(day);
        prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
        var nextMonth = new Date(prevMonth);
        nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
        nextMonth = nextMonth.valueOf();
        var html = [];
        var clsName;
        while (prevMonth.valueOf() < nextMonth) {
            if (prevMonth.getUTCDay() == this.o.weekStart) {
                html.push('<tr>');
                if (this.o.calendarWeeks) {
                    // ISO 8601: First week contains first thursday.
                    // ISO also states week starts on Monday, but we can be more abstract here.
                    var
                        // Start of current week: based on weekstart/current date
                        ws = new Date( +prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
                        // Thursday of this week
                        th = new Date( +ws + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
                        // First Thursday of year, year from thursday
                        yth = new Date( +(yth = utcDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 864e5),
                        // Calendar week: ms between thursdays, div ms per day, div 7 days
                        calWeek =  (th - yth) / 864e5 / 7 + 1;
                    html.push('<td class="cw">' + calWeek + '</td>');

                }
            }
            clsName = this.getClassNames(prevMonth);
            clsName.push('day');

            if (this.o.beforeShowDay !== $.noop) {
                var before = this.o.beforeShowDay(this._utc_to_local(prevMonth));
                if (before === undefined) {
                    before = {};
                } else if (typeof(before) === 'boolean') {
                    before = {enabled: before};
                } else if (typeof(before) === 'string') {
                    before = {classes: before};
                }

                if (before.enabled === false) {
                    clsName.push('disabled');
                }
                if (before.classes) {
                    clsName = clsName.concat(before.classes.split(/\s+/));
                }
                if (before.tooltip) {
                    tooltip = before.tooltip;
                }
            }

            clsName = $.unique(clsName).join(' ');
            var dayIsDisabled = clsName.lastIndexOf('disabled') > -1;
            var dayIsActive = clsName.lastIndexOf('active') > -1;
            var dayAttrs = (dayIsDisabled ? ' aria-disabled="true"' : '') + (dayIsActive ? ' aria-selected="true"' : '');

            html.push('<td class="' + clsName + '"' + dayAttrs + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + prevMonth.getUTCDate() + '</td>');

            if (prevMonth.getUTCDay() == this.o.weekEnd) {
                html.push('</tr>');
            }
            prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
        }
        this.picker
            .find('.datepicker-days tbody')
            .empty()
            .append(html.join(''));
        var currentYear = this.date && this.date.getUTCFullYear();

        var months =
            this.picker
                .find('.datepicker-months')
                    .find('th:eq(1)')
                        .text(year)
                        .end()
                    .find('span')
                        .removeClass('active')
                        .attr('aria-selected', 'false');

        if (currentYear && currentYear == year) {
            months.eq(this.date && this.date.getUTCMonth())
                .addClass('active')
                .attr('aria-selected', 'true');
        } else {
            months.eq(this.date && this.date.getUTCMonth())
                .removeClass('active')
                .attr('aria-selected', 'false');
        }


        if (year < startYear || year > endYear) {
            months
                .addClass('disabled')
                .attr('aria-disabled', 'true');
        } else {
            months
                .removeClass('disabled')
                .attr('aria-disabled', 'false');
        }

        if (year == startYear) {
            months.slice(0, startMonth)
                .addClass('disabled')
                .attr('aria-disabled', 'true');
        } else {
            months.slice(0, startMonth)
                .removeClass('disabled')
                .attr('aria-disabled', 'false');
        }

        if (year == endYear) {
            months.slice(endMonth + 1)
                .addClass('disabled')
                .attr('aria-disabled', 'true');
        } else {
            months.slice(endMonth + 1)
                .removeClass('disabled')
                .attr('aria-disabled', 'false');
        }

        html = '';
        year = parseInt(year / 10, 10) * 10;
        var yearCont =
            this.picker
                .find('.datepicker-years')
                    .find('th:eq(1)')
                        .text(year + '-' + (year + 9))
                        .end()
                    .find('td');
        year -= 1;

        var tempClass;
        var tempAttrs;
        for (var i = -1; i < 11; i++) {
            isActive = currentYear == year;
            isDisabled = year < startYear || year > endYear;
            isOld = i == -1;
            isNew = i == 10;
            tempClass = 'year' + (isOld ? ' old' : isNew ? ' new' : '') + (isActive ? ' active' : '') + (isDisabled ? ' disabled' : '');
            tempAttrs = (isActive ? ' aria-selected="true"' : '') + (isDisabled ? ' aria-disabled="true' : '');

            html += '<span class="' + tempClass + '"' + tempAttrs + '>' + year + '</span>';
            year += 1;
        }
        yearCont.html(html);
    };

    Datepicker.prototype.updateNavArrows = function() {
        if (!this._allow_update) {
            return;
        }

        var d = new Date(this.viewDate),
            year = d.getUTCFullYear(),
            month = d.getUTCMonth();

        var $next = this.picker.find('.next');
        var $prev = this.picker.find('.prev');

        switch (this.viewMode)
        {
        case 0:
            if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()) {
                $prev.css({visibility: 'hidden'});
            } else {
                $prev.css({visibility: 'visible'});
            }
            if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()) {
                $next.css({visibility: 'hidden'});
            } else {
                $next.css({visibility: 'visible'});
            }
            break;
        case 1:
        case 2:
            if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear()) {
                $prev.css({visibility: 'hidden'});
            } else {
                $prev.css({visibility: 'visible'});
            }
            if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear()) {
                $next.css({visibility: 'hidden'});
            } else {
                $next.css({visibility: 'visible'});
            }
            break;
        }
    };

    Datepicker.prototype.click = function(event) {
        event && event.preventDefault();

        var target = $(event.target).closest('span, td, th'), year, month, day;

        if (target.length == 1) {
            switch (target[0].nodeName.toLowerCase())
            {
            case 'th':
                event.stopImmediatePropagation();
                switch (target[0].className)
                {

                case 'datepicker-switch':
                    this.showMode(1);
                    break;

                case 'prev':

                case 'next':
                    var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
                    switch (this.viewMode)
                    {
                    case 0:
                        this.viewDate = this.moveMonth(this.viewDate, dir);
                        this._trigger('changeMonth', this.viewDate);
                        break;
                    case 1:
                    case 2:
                        this.viewDate = this.moveYear(this.viewDate, dir);
                        if (this.viewMode === 1) {
                            this._trigger('changeYear', this.viewDate);
                        }
                        break;
                    }
                    this.fill();
                    break;

                case 'today':
                    var date = new Date();
                    date = utcDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

                    this.showMode( -2 );
                    var which = this.o.todayBtn == 'linked' ? null : 'view';
                    this._setDate(date, which);
                    break;

                case 'clear':
                    var element;
                    if (this.isInput) {
                        element = this.element;
                    } else if (this.component) {
                        element = this.element.find('.form-control');
                    }

                    if (element) {
                        element.val('').change();
                    }
                    this.update();
                    this._trigger('changeDate');
                    if (this.o.autoclose) {
                        this.hide('click');
                    }
                    break;
                }
                break;

            case 'span':
                event.stopImmediatePropagation();
                if (!target.is('.disabled')) {
                    this.viewDate.setUTCDate(1);
                    if (target.is('.month')) {
                        day = 1;
                        month = target.parent().find('span').index(target);
                        year = this.viewDate.getUTCFullYear();
                        this.viewDate.setUTCMonth(month);
                        this._trigger('changeMonth', this.viewDate);
                        if (this.o.minViewMode === 1) {
                            this._setDate(utcDate(year, month, day));
                        }
                    } else {
                        day = 1;
                        month = 0;
                        year = parseInt(target.text(), 10) || 0;
                        this.viewDate.setUTCFullYear(year);
                        this._trigger('changeYear', this.viewDate);
                        if (this.o.minViewMode === 2) {
                            this._setDate(utcDate(year, month, day));
                        }
                    }
                    this.showMode( -1 );
                    this.fill();
                }
                break;

            case 'td':
                event.stopImmediatePropagation();
                if (target.is('.day') && !target.is('.disabled')) {
                    day = parseInt(target.text(), 10) || 1;
                    year = this.viewDate.getUTCFullYear();
                    month = this.viewDate.getUTCMonth();
                    if (target.is('.old')) {
                        if (month === 0) {
                            month = 11;
                            year -= 1;
                        } else {
                            month -= 1;
                        }
                    } else if (target.is('.new')) {
                        if (month == 11) {
                            month = 0;
                            year += 1;
                        } else {
                            month += 1;
                        }
                    }
                    this._setDate(utcDate(year, month, day));
                }
                break;
            }
        }
    };

    Datepicker.prototype._setDate = function(date, which) {
        if (!which || which == 'date') {
            this.date = date && new Date(date);
        }
        if (!which || which  == 'view') {
            this.viewDate = date && new Date(date);
        }
        this.fill();
        this.setValue();
        this._trigger('changeDate');
        var element;
        if (this.isInput) {
            element = this.element;
        } else if (this.component) {
            element = this.element.find('.form-control');
        }

        if (element) {
            element.change();
        }

        if (this.o.autoclose && (!which || which == 'date')) {
            this.hide('setDate');
        }
    };

    Datepicker.prototype.moveMonth = function(date, dir) {
        if (!date) {
            return undefined;
        }
        if (!dir) {
            return date;
        }
        var new_date = new Date(date.valueOf()),
            day = new_date.getUTCDate(),
            month = new_date.getUTCMonth(),
            mag = Math.abs(dir),
            new_month, test;
        dir = dir > 0 ? 1 : -1;
        if (mag == 1) {
            if (dir == -1) {
                // If going back one month, make sure month is not current month
                // (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
                test = function() { return new_date.getUTCMonth() == month; };
            } else {
                // If going forward one month, make sure month is as expected
                // (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
                test = function() { return new_date.getUTCMonth() != new_month; };
            }

            new_month = month + dir;
            new_date.setUTCMonth(new_month);
            // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
            if (new_month < 0 || new_month > 11) {
                new_month = (new_month + 12) % 12;
            }
        } else {
            // For magnitudes >1, move one month at a time...
            for (var i = 0; i < mag; i++) {
                // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
                new_date = this.moveMonth(new_date, dir);
            }
            // ...then reset the day, keeping it in the new month
            new_month = new_date.getUTCMonth();
            new_date.setUTCDate(day);
            test = function() { return new_month != new_date.getUTCMonth(); };
        }
        // Common date-resetting loop -- if date is beyond end of month, make it
        // end of month
        while (test()) {
            new_date.setUTCDate(--day);
            new_date.setUTCMonth(new_month);
        }
        return new_date;
    };

    Datepicker.prototype.moveYear = function(date, dir) {
        return this.moveMonth(date, dir * 12);
    };

    Datepicker.prototype.dateWithinRange = function(date) {
        return date >= this.o.startDate && date <= this.o.endDate;
    };

    Datepicker.prototype.keydown = function(event) {
        var isCtrlKey = false;
        if (event.ctrlKey || event.metaKey) {
            isCtrlKey = true;
        }

        if (this.picker.is(':not(:visible)')) {
            if (event.keyCode == 27) {
                // allow escape to hide and re-show picker
                this.show();
            }
            return;
        }
        if (!this.date) {
            // if there is no date currently set, they cannot use the keys to navigate
            this.date = this.viewDate;
        }
        var dateChanged = false,
            dir, newDate, newViewDate;

        switch (event.keyCode)
        {
        case 27: // escape
            this.hide('exit');
            event.preventDefault();
            break;
        case 37: // left
        case 39: // right
            if (!this.o.keyboardNavigation) {
                break;
            }
            dir = event.keyCode == 37 ? -1 : 1;
            if (isCtrlKey) {
                newDate = this.moveYear(this.date || utcToday(), dir);
                newViewDate = this.moveYear(this.viewDate, dir);
                this._trigger('changeYear', this.viewDate);
            } else if (event.shiftKey) {
                newDate = this.moveMonth(this.date || utcToday(), dir);
                newViewDate = this.moveMonth(this.viewDate, dir);
                this._trigger('changeMonth', this.viewDate);
            } else {
                newDate = new Date(this.date || utcToday());
                newDate.setUTCDate(newDate.getUTCDate() + dir);
                newViewDate = new Date(this.viewDate);
                newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
            }
            if (this.dateWithinRange(newDate)) {
                this.date = newDate;
                this.viewDate = newViewDate;
                this.setValue();
                this.update();
                event.preventDefault();
                dateChanged = true;
            }
            break;
        case 38: // up
        case 40: // down
            if (!this.o.keyboardNavigation) {
                break;
            }
            dir = event.keyCode == 38 ? -1 : 1;
            if (isCtrlKey) {
                newDate = this.moveYear(this.date || utcToday(), dir);
                newViewDate = this.moveYear(this.viewDate, dir);
                this._trigger('changeYear', this.viewDate);
            } else if (event.shiftKey) {
                newDate = this.moveMonth(this.date || utcToday(), dir);
                newViewDate = this.moveMonth(this.viewDate, dir);
                this._trigger('changeMonth', this.viewDate);
            } else {
                newDate = new Date(this.date || utcToday());
                newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
                newViewDate = new Date(this.viewDate);
                newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
            }
            if (this.dateWithinRange(newDate)) {
                this.date = newDate;
                this.viewDate = newViewDate;
                this.setValue();
                this.update();
                event.preventDefault();
                dateChanged = true;
            }
            break;
        case 13: // enter
            this.hide('enter');
            event.preventDefault();
            break;
        case 9: // tab
            if (event.shiftKey) {
                this.hide('tab_shift', event);
            } else {
                this.hide('tab', event);
            }
            break;
        }
        if (dateChanged) {
            this._trigger('changeDate');
            var element;
            if (this.isInput) {
                element = this.element;
            } else if (this.component) {
                element = this.element.find('.form-control');
            }
            if (element) {
                element.change();
            }
        }
    };

    Datepicker.prototype.showMode = function(dir) {
        if (dir) {
            this.viewMode = Math.max(this.o.minViewMode, Math.min(2, this.viewMode + dir));
        }

        var $pickerDateScopes = this.picker.find('.content > div');
        var $currentPickerDateScope = $pickerDateScopes.filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName);

        $pickerDateScopes
            .css({
                display: 'none',
                visibility: 'hidden'
            })
            .attr('aria-hidden', 'true');

        $currentPickerDateScope
            .css({
                display: 'block',
                visibility: 'visible'
            })
            .attr('aria-hidden', 'false');

        this.updateNavArrows();
    };


    // DATE RANGE PICKER PUBLIC CLASS DEFINITION
    // ==============================

    var DateRangePicker = function(element, options) {
        this.element = $(element);
        this.inputs = $.map(options.inputs, function(i) { return i.jquery ? i[0] : i; });
        delete options.inputs;

        $(this.inputs)
            .datepicker(options)
            .bind('changeDate.wdesk.datepicker', $.proxy(this.dateUpdated, this));

        this.pickers = $.map(this.inputs, function(i) { return $(i).data('wdesk.datepicker'); });
        this.updateDates();
    };

    DateRangePicker.prototype = {

        updateDates: function() {
            this.dates = $.map(this.pickers, function(i) { return i.date; });
            this.updateRanges();
        },

        updateRanges: function() {
            var range = $.map(this.dates, function(d) { return d.valueOf(); });
            $.each(this.pickers, function(i, p) {
                p.setRange(range);
            });
        },

        dateUpdated: function(event) {
            var dp = $(event.target).data('wdesk.datepicker'),
                new_date = dp.getUTCDate(),
                i = $.inArray(event.target, this.inputs),
                l = this.inputs.length;

            if (i == -1) {
                return;
            }

            if (new_date < this.dates[i]) {
                // Date being moved earlier/left
                while (i >= 0 && new_date < this.dates[i]) {
                    this.pickers[i--].setUTCDate(new_date);
                }
            } else if (new_date > this.dates[i]) {
                // Date being moved later/right
                while (i < l && new_date > this.dates[i]) {
                    this.pickers[i++].setUTCDate(new_date);
                }
            }
            this.updateDates();
        },

        remove: function() {
            $.map(this.pickers, function(p) { p.remove(); });
            this.element
                .off('.datepicker')
                .removeData('wdesk.datepicker');
        }
    };


    // DATEPICKER PLUGIN DEFINITION
    // ================================

    var old = $.fn.datepicker;

    $.fn.datepicker = function(option) {
        var args = Array.apply(null, arguments);
        var internal_return;

        args.shift();

        this.each(function() {
            var $this = $(this),
                data = $this.data('wdesk.datepicker'),
                options = typeof option == 'object' && option;

            if (!data) {
                var elopts = opts_from_el(this, 'date'),
                    // Preliminary otions
                    xopts = $.extend({}, defaults, elopts, options),
                    locopts = opts_from_locale(xopts.language),
                    // Options priority: js args, data-attrs, locales, defaults
                    opts = $.extend({}, defaults, locopts, elopts, options);

                if ($this.is('.input-daterange') || opts.inputs) {
                    var ropts = {
                        inputs: opts.inputs || $this.find('.form-control').toArray()
                    };
                    $this.data('wdesk.datepicker', (data = new DateRangePicker(this, $.extend(opts, ropts))));
                } else {
                    $this.data('wdesk.datepicker', (data = new Datepicker(this, opts)));
                }
            }

            if (typeof option == 'string' && typeof data[option] == 'function') {
                internal_return = data[option].apply(data, args);
                if (internal_return !== undefined) {
                    return false;
                }
            }
        });

        if (internal_return !== undefined) {
            return internal_return;
        } else {
            return this;
        }
    };

    $.fn.datepicker.Constructor = Datepicker;

    var defaults = $.fn.datepicker.defaults = {
        autoclose: true,
        beforeShowDay: $.noop,
        calendarWeeks: false,
        clearBtn: false,
        daysOfWeekDisabled: [],
        endDate: Infinity,
        forceParse: true,
        format: 'mm/dd/yyyy',
        keyboardNavigation: true,
        language: 'en',
        minViewMode: 0,
        orientation: 'auto',
        rtl: false,
        startDate: -Infinity,
        startView: 0,
        todayBtn: false,
        todayHighlight: true,
        weekStart: 0
    };

    var locale_opts = $.fn.datepicker.locale_opts = [
        'format',
        'rtl',
        'weekStart'
    ];

    // Additional language locale scripts are in
    // ./locales/datepicker/*
    var dates = $.fn.datepicker.dates = {
        en: {
            days:           ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            daysShort:      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            daysMin:        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
            months:         ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthsShort:    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            today:          'Today',
            clear:          'Clear'
        }
    };


    // GLOBAL TIME STUFF
    // ================================

    var DPGlobal = {
        modes: [
            {
                clsName: 'days',
                navFnc: 'Month',
                navStep: 1
            },
            {
                clsName: 'months',
                navFnc: 'FullYear',
                navStep: 1
            },
            {
                clsName: 'years',
                navFnc: 'FullYear',
                navStep: 10
            }
        ],
        isLeapYear: function(year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
        },
        getDaysInMonth: function(year, month) {
            return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },
        validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
        nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
        parseFormat: function(format) {
            // IE treats \0 as a string end in inputs (truncating the value),
            // so it's a bad format delimiter, anyway
            var separators = format.replace(this.validParts, '\0').split('\0'),
                parts = format.match(this.validParts);
            if (!separators || !separators.length || !parts || parts.length === 0) {
                throw new Error('Invalid date format.');
            }
            return {separators: separators, parts: parts};
        },
        parseDate: function(date, format, language) {
            if (!date) {
                return undefined;
            }
            if (date instanceof Date) {
                return date;
            }
            if (typeof format === 'string') {
                format = DPGlobal.parseFormat(format);
            }

            var part_re, parts, part, dir, val, filtered;
            if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
                part_re = /([\-+]\d+)([dmwy])/,
                parts = date.match(/([\-+]\d+)([dmwy])/g),
                part, dir;
                date = new Date();
                for (var i = 0; i < parts.length; i++) {
                    part = part_re.exec(parts[i]);
                    dir = parseInt(part[1], 10);
                    switch (part[2])
                    {
                    case 'd':
                        date.setUTCDate(date.getUTCDate() + dir);
                        break;
                    case 'm':
                        date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
                        break;
                    case 'w':
                        date.setUTCDate(date.getUTCDate() + dir * 7);
                        break;
                    case 'y':
                        date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
                        break;
                    }
                }
                return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
            }
            parts = date && date.match(this.nonpunctuation) || [];
            date = new Date();

            var parsed = {},
                setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
                setters_map = {
                    yyyy: function(d,v) { return d.setUTCFullYear(v); },
                    yy: function(d,v) { return d.setUTCFullYear(2000 + v); },
                    m: function(d,v) {
                        if (isNaN(d)) {
                            return d;
                        }
                        v -= 1;
                        while (v < 0) {
                            v += 12;
                        }
                        v %= 12;
                        d.setUTCMonth(v);
                        while (d.getUTCMonth() != v) {
                            d.setUTCDate(d.getUTCDate() - 1);
                        }
                        return d;
                    },
                    d: function(d,v) {
                        return d.setUTCDate(v);
                    }
                };

            setters_map.M = setters_map.MM = setters_map.mm = setters_map.m;
            setters_map.dd = setters_map.d;
            date = utcDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            var fparts = format.parts.slice();
            // Remove noop parts
            if (parts.length != fparts.length) {
                fparts = $(fparts).filter(function(i, p) {
                    return $.inArray(p, setters_order) !== -1;
                }).toArray();
            }
            // Process remainder
            if (parts.length == fparts.length) {
                for (var i = 0, cnt = fparts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10);
                    part = fparts[i];

                    if (isNaN(val)) {
                        switch (part)
                        {
                        case 'MM':
                            filtered = $(dates[language].months).filter(function() {
                                var m = this.slice(0, parts[i].length),
                                    p = parts[i].slice(0, m.length);
                                return m == p;
                            });
                            val = $.inArray(filtered[0], dates[language].months) + 1;
                            break;
                        case 'M':
                            filtered = $(dates[language].monthsShort).filter(function() {
                                var m = this.slice(0, parts[i].length),
                                    p = parts[i].slice(0, m.length);
                                return m == p;
                            });
                            val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                            break;
                        }
                    }
                    parsed[part] = val;
                }
                for (var i = 0, _date, s; i < setters_order.length; i++) {
                    s = setters_order[i];
                    if (s in parsed && !isNaN(parsed[s])) {
                        _date = new Date(date);
                        setters_map[s](_date, parsed[s]);

                        if (!isNaN(_date)) {
                            date = _date;
                        }
                    }
                }
            }
            return date;
        },
        formatDate: function(date, format, language) {
            if (!date) {
                return '';
            }
            if (typeof format === 'string') {
                format = DPGlobal.parseFormat(format);
            }
            var val = {
                d: date.getUTCDate(),
                D: dates[language].daysShort[date.getUTCDay()],
                DD: dates[language].days[date.getUTCDay()],
                m: date.getUTCMonth() + 1,
                M: dates[language].monthsShort[date.getUTCMonth()],
                MM: dates[language].months[date.getUTCMonth()],
                yy: date.getUTCFullYear().toString().substring(2),
                yyyy: date.getUTCFullYear()
            };
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            var date = [],
                seps = $.extend([], format.separators);
            for (var i = 0, cnt = format.parts.length; i <= cnt; i++) {
                if (seps.length) {
                    date.push(seps.shift());
                }
                date.push(val[format.parts[i]]);
            }
            return date.join('');
        },
        headTemplate:
            '<thead>' +
                '<tr>' +
                    '<th class="prev"><i class="icon icon-chevron-left"></i></th>' +
                    '<th colspan="5" class="datepicker-switch"></th>' +
                    '<th class="next"><i class="icon icon-chevron-right"></i></th>' +
                '</tr>' +
            '</thead>',
        contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
        footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr><tr><th colspan="7" class="clear"></th></tr></tfoot>'
    };
    DPGlobal.template =
        '<div class="datepicker popover fade">' +
            '<span class="arrow"></span>' +
            '<div class="inner">' +
                '<div class="content">' +
                    '<div class="datepicker-days">' +
                        '<table class="table table-condensed">' +
                            DPGlobal.headTemplate +
                            '<tbody></tbody>' +
                            DPGlobal.footTemplate +
                        '</table>' +
                    '</div>' +
                    '<div class="datepicker-months">' +
                        '<table class="table table-condensed">' +
                            DPGlobal.headTemplate +
                            DPGlobal.contTemplate +
                            DPGlobal.footTemplate +
                        '</table>' +
                    '</div>' +
                    '<div class="datepicker-years">' +
                        '<table class="table table-condensed">' +
                            DPGlobal.headTemplate +
                            DPGlobal.contTemplate +
                            DPGlobal.footTemplate +
                        '</table>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    $.fn.datepicker.DPGlobal = DPGlobal;


    // DATEPICKER NO CONFLICT
    // ================================

    $.fn.datepicker.noConflict = function() {
        $.fn.datepicker = old;
        return this;
    };


    // DATEPICKER DATA-API
    // ================================

    $(document).on('focus.wdesk.datepicker.data-api click.wdesk.datepicker.data-api', '[data-provide="datepicker"]', function(event) {
        var $this = $(this);
        var $input = $this.is('.form-control') ? $this : $this.find('.form-control');
        var $inputs, inputRangeData, _tempInput;

        //
        // Check to see if it is a date range picker
        // and if it is, set $input equal to the one
        // that was actually clicked so we know which
        // picker to open
        //
        if ($input.length > 1 && $input.data('wdesk.datepicker')) {
            inputRangeData = $($input.context).data('wdesk.datepicker');
            $inputs = $(inputRangeData.inputs);
            // determine which one of the inputs was clicked
            _tempInput = $inputs.filter(event.target);

            if (_tempInput.length === 1) {
                $input = _tempInput;
            }
        }

        if ($input.data('refocused') && event.type == 'click') {
            // console.log('refocused click');
            $input.data('refocused', false);

            //
            // Check to see if the input is where the datepicker instance is stored
            // if not, it is most likely a "component" (input + button), so use the
            // base [data-provide] selector bound to the document events
            //
            if ($input.data('provide') == 'datepicker') {
                $input.datepicker('show');
            } else {
                $this.datepicker('show');
            }
        }

        if ($input.data('wdesk.datepicker') ||
            ($input.data('refocused') && (event.type == 'focusin' || event.type == 'focus'))) {
            return;
        }

        // component click requires us to explicitly show it
        if (!this.isInput) {
            event && event.preventDefault();
            $this.datepicker('show');
        }
    });
    $(function() {
        $('[data-provide="datepicker-inline"]').datepicker();
    });

});

if (define.isFake) {
    define = undefined;
}

/* ==========================================================
 * wdesk-dropdown.js v1.3.0 (http://bit.ly/19iagKq)
 * adapted from bootstrap-dropdown v3.3.2
 * ===================================================
 * Copyright 2015 Workiva and Twitter, Inc.
 * ========================================================== */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery', 'wdesk-autoheight'],

function($) {

    'use strict';

    // DROPDOWN CLASS DEFINITION
    // =========================

    var backdrop = '.dropdown-backdrop';
    var toggle   = '[data-toggle="dropdown"]';

    var Dropdown = function(element, options) {
        this.isTouch = 'ontouchstart' in document.documentElement;
        this.options  = null;
        this.$element = null;
        this.$menu    = null;
        this.$parent  = null;
        this.$clearTrigger = null;
        this.elementId = null;
        this.isActive = false;
        this.isShown = null;
        this.scrollbarWidth = 0;
        this.menuIsOverflowing = false;
        this.menuDirectionChanged = false;

        this.init(element, options);
    };

    if (!$.fn.autoheight) {
        throw new Error('wdesk-dropdown.js requires wdesk-autoheight.js');
    }

    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-dropdown.js requires wf-vendor.js');
    }

    Dropdown.VERSION = '1.3.0';

    Dropdown.DEFAULTS = {
        persistent: false,
        autoWidth: false,
        // If the triggering item is a nav-item, how much "overhang" do
        // you want for the menu (e.g. when dd menu is coming out of a navbar)
        autoWidthOffset: 10,
        viewportFit: false
    };

    Dropdown.prototype.init = function(element, options) {
        this.$element = $(element);
        this.$parent = getParent(this.$element);
        this.$menu = $('.dropdown-menu', this.$parent);
        this.parentWidth = getParentWidth(this.$parent);
        this.options = this.getOptions(options);

        // ensure that the triggering element has a unique ID so it can be associated
        // with the dropdown-menu via `aria-labelledby` for WCAG accessibility when it is visible
        // so that the menu can use
        if (! this.elementId) {
            this.elementId = this.$element.attr('id') || this.getUID('dropdown-toggle');
        }
        this.$element.attr('id', this.elementId);

        var that = this;
        var relatedTarget = { relatedTarget: this };

        this.$parent.find(toggle)
            .on('click.wdesk.dropdown.data-api', $.proxy(this.toggle, this));
        this.$parent.find(toggle + ', [role=menu], [role=listbox], .dropdown-menu li:not(.divider):visible > .hitarea')
            .on('keydown.wdesk.dropdown.data-api', $.proxy(this.keydown, this));

        // if the dropdown menu loses focus, close the menu for WCAG compliance
        // $(document).on('focusout.wdesk.dropdown.data-api', '.dropdown-menu', function(event) {
        //     var focusedElem = $(document.activeElem);
        //     if (! $(this).find(focusedElem).length) {
        //         console.log('focus lost', event, focusedElem);
        //     }
        // });
    };

    Dropdown.prototype.getDefaults = function() {
        return Dropdown.DEFAULTS;
    };

    Dropdown.prototype.getOptions = function(options) {
        return $.extend({}, this.getDefaults(), this.$element.data(), options);
    };

    Dropdown.prototype.focusIn = function() {
        // try to focus the first item in the dropdown menu for WCAG accessibility compliance
        // if it fails, fall back to focusing the triggering element.
        var that = this;
        var $firstItem = $('.hitarea:visible, :input:visible', this.$menu)[0];
        try {
            $firstItem.focus();
        } catch(err) {
            that.$element.focus();
        }
    };

    Dropdown.prototype.focusOut = function() {
        var $elemToFocus;

        if (typeof(this.$clearTrigger) !== 'string') {
            if (this.$clearTrigger[0].tabIndex > -1) {
                // $clearTrigger element is focusable,
                // focus it instead of the dropdown-toggle element
                $elemToFocus = this.$clearTrigger;
            } else {
                // $clearTrigger element is not focusable,
                // move focus back to the dropdown-toggle element
                $elemToFocus = this.$element;
            }
        }

        try {
            $elemToFocus.focus();
        } catch(err) {
            // must have been a menu triggered programatically
        }
    };

    Dropdown.prototype.isNestedFormInput = function(event) {
        var isFormInputNestedWithinDropdown = false;

        if ($(event.target).closest('.dropdown-menu').length > 0) {
            isFormInputNestedWithinDropdown = true;
        }

        return isFormInputNestedWithinDropdown;
    };

    Dropdown.prototype.show = function(event) {
        var that = this,
            relatedTarget = { relatedTarget: this };

        // make sure the width of the triggering elem
        // does not exceed the width of the dropdown-menu itself
        if (this.options.autoWidth) {
            var _width = getParentWidth(this.$parent);

            if (this.$parent.is('.nav-item')) {
                _width += this.options.autoWidthOffset;
            }

            this.$menu.css('min-width', _width);
        }

        this.$parent.trigger(event = $.Event('show.wdesk.dropdown', relatedTarget));

        // set up some event listeners so that clicking outside
        // the dropdown menu triggers a toggle()
        if (this.options.persistent === false) {
            $(document)
                .on('click.wdesk.dropdown.data-api', function(event) {
                    that.toggle(event);
                })
                .on('click.wdesk.dropdown.data-api', 'form', function(event) {
                    if (!that.isNestedFormInput(event)) {
                        event.stopPropagation();

                        that.toggle(event);

                        $(event.target).focus();
                    }
                });
        }
        if (this.isTouch && !this.$parent.closest('.navbar-nav').length) {
            // if mobile we we use a backdrop because click events don't delegate
            $('<div class="dropdown-backdrop"/>').insertAfter(this.$parent).on('click.wdesk.dropdown.data-api', function(event) {
                that.toggle(event);
            });
        }

        this.$parent.toggleClass('open');
        this.$element.attr('aria-expanded', 'true');
        this.$menu.attr('aria-labelledby', this.elementId);

        this.isShown = true;

        // keep height of dd menu within viewport bounds
        if (this.options.viewportFit) {
            this.viewportAwarenessOn();
        }

        this.focusIn();

        this.$parent.trigger(event = $.Event('shown.wdesk.dropdown', relatedTarget));
    };

    Dropdown.prototype.hide = function(event) {
        var that = this,
            relatedTarget = { relatedTarget: this };

        this.$parent.trigger(event = $.Event('hide.wdesk.dropdown', relatedTarget));

        if (!this.isShown || event.isDefaultPrevented()) {
            return;
        }

        // de-register event listener registered in this.show()
        $(document).off('click.wdesk.dropdown.data-api');
        $(backdrop).remove();

        this.$parent.removeClass('open');
        this.$element.attr('aria-expanded', 'false');
        this.$menu.removeAttr('aria-labelledby');

        this.isShown = false;


        if (this.options.viewportFit) {
            this.viewportAwarenessOff();
        }

        this.focusOut();

        this.$parent.trigger(event = $.Event('hidden.wdesk.dropdown', relatedTarget));
    };

    Dropdown.prototype.toggle = function(event) {

        if (this.$element.is('.disabled, :disabled')) {
            return;
        }

        // do not allow focus to remain after click
        this.$element.blur();

        // in order to allow dropdowns to be controlled via js-api methods
        // we still need the `data-toggle=dropdown` attr on the DOM object
        // so that clearMenus() functions properly when it iterates through
        // all of the $(toggle) elems
        ! this.$element.data('toggle') && this.$element.attr('data-toggle', 'dropdown');

        // before we go through and close all the open menus
        // check to see if this was the menu that was open in the first place
        this.isActive = this.$parent.hasClass('open');

        // ensure that the triggering element has a unique ID so it can be associated
        // with the dropdown-menu via `aria-labelledby` for WCAG accessibility when it is visible
        // so that the menu can use
        if (! this.elementId) {
            this.elementId = this.$element.attr('id') || this.getUID('dropdown-toggle');
        }
        this.$element.attr('id', this.elementId);

        // dropdown mutex
        this.clearMenus(event);

        // if it was not open before we executed this.clearMenus
        // then open it now
        !this.isActive && this.show(event);

        return false;
    };

    Dropdown.prototype.keydown = function(event) {
        var $items
          , desc
          , hitareas
          , input
          , inputs
          , index;

        this.isActive = this.$parent.hasClass('open');

        if (!/(38|40|27|32)/.test(event.keyCode)) {
            if (event.keyCode == 9 && this.isActive) {
                // if the dropdown menu loses focus via tab,
                // close the menu for WCAG compliance
                this.hide(event);
            } else {
                return;
            }
        }

        event.preventDefault();
        event.stopPropagation();

        if (this.$element.is('.disabled, :disabled')) {
            return;
        }

        if ((!this.isActive && event.keyCode != 27) || this.isActive && (event.keyCode == 27 || event.keyCode == 32)) {
            return this.$element.click();
        }

        desc = '.menu-item:not(.divider):visible .hitarea';
        input = '.menu-item:not(.divider):visible :input:not([aria-hidden=true])';
        hitareas = '[role=menu] ' + desc + ', [role=listbox] ' + desc;
        inputs = '[role=menu] ' + input + ', [role=listbox] ' + input;
        $items = $(hitareas + ', ' + inputs, this.$parent);

        if (!$items.length) {
            return;
        }

        index = $items.index($(document.activeElement));

        if (event.keyCode == 38 && index > 0)                 { index--; } // up
        if (event.keyCode == 40 && index < $items.length - 1) { index++; } // down
        if (!~index) {
            index = 0;
        } else {
            $items
                .eq(index)
                .focus();
        }
    };

    Dropdown.prototype.clearMenus = function(event) {
        var eventTarget;

        if (event) {
            eventTarget = event.target || event.currentTarget;
            this.$clearTrigger = $(eventTarget);
        } else {
            this.$clearTrigger = 'js-api';
        }

        var that = this,
            ev = event,
            // make sure original clearTrigger is set locally so when we checkPersistence, we have two objects to compare
            $clearTrigger = this.$clearTrigger;

        // check for all dropdown toggles in the dom
        $(toggle).each(function() {
            var $this = $(this)
              , data = $this.data('wdesk.dropdown')
              , $parent = getParent($this)
              , relatedTarget = { relatedTarget: this }
              , isActive = $parent.hasClass('open');

            // we only need to check persistence if its currently open
            isActive && checkPersistence(data, ev, $clearTrigger);
        });
    };

    Dropdown.prototype.getUID = function(prefix) {
        do {
            prefix += ~~(Math.random() * 1000000);
        }
        while (document.getElementById(prefix));

        return prefix;
    };

    Dropdown.prototype.adaptMenuDirectionForViewport = function() {
        this.$parent.toggleClass('dropup');
        this.$menu.data('wdesk.autoheight').options.edge = 'top';
        this.$menu.autoheight('updateHeight');
    };

    Dropdown.prototype.resetMenuDirectionForViewport = function() {
        this.$menu.data('wdesk.autoheight').options.edge = 'bottom';
        this.$parent.toggleClass('dropup');

        this.menuDirectionChanged = false;
    };

    Dropdown.prototype.viewportAwarenessOn = function() {
        var that = this;

        this.$menu
            .on('minHeightReached.wdesk.autoheight', function(event) {
                that.adaptMenuDirectionForViewport();
                that.menuDirectionChanged = true;
            })
            .autoheight();
    };

    Dropdown.prototype.viewportAwarenessOff = function() {
        this.$menu
            .off('minHeightReached.wdesk.autoheight') // turn off autoheight resize listener
            .autoheight('unbind'); // turn off autoheight bindings and remove fixed height of menu while hidden

        if (this.menuDirectionChanged) {
            this.resetMenuDirectionForViewport();
        }
    };


    // ----------------------------------------------------
    //   HELPER FUNCTIONS
    // ----------------------------------------------------

    function getParentWidth($parent) {
        var parentWidth = 0;
        if ($parent) {
            parentWidth = $parent.outerWidth();
        }

        return parentWidth;
    }

    function getParent($this) {
        var selector = $this.attr('data-target')
          , $parent;

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
        }

        $parent = selector && $(selector);

        return $parent && $parent.length ? $parent : $this.parent();
    }

    function checkPersistence(el, event, $clearTrigger) {
        var that = el;

        // run through persistence check before
        // determining if we should hide this menu
        if (that.options.persistent === true) {
            if ($clearTrigger === 'js-api' || $clearTrigger.is(that.$element)) {
                // triggered by toggle button or directly via a js api method
                // close it
                that.hide(event);
            } else {
                // something other than the original toggle button
                // triggered the call - do nothing since the menu is persistent
            }
        } else {
            that.hide(event);
        }
    }

    function isNestedFormInput(event) {
        var _isNestedFormInput = false;
        var $elem = $(event.target);

        if ($elem.closest('.dropdown-menu').length > 0) {
            if ($elem.is('input') || $elem.is('textarea')) {
                _isNestedFormInput = true;
            }
        }

        return _isNestedFormInput;
    }

    function swallowClickPropagation(event) {
        if (event) {
            // if it was a right click, or a form input within a dropdown menu has gained focus
            if (event.button === 2 || isNestedFormInput(event)) {
                event.stopImmediatePropagation();
            }

            // no matter what
            event.stopPropagation();
        }
    }


    // DROPDOWN PLUGIN DEFINITION
    // ==========================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
               , data = $this.data('wdesk.dropdown')
               , options = typeof option == 'object' && option;

            if (!data) {
                $this.data('wdesk.dropdown', (data = new Dropdown(this, options)));
            }
            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    var old = $.fn.dropdown;

    $.fn.dropdown             = Plugin;
    $.fn.dropdown.Constructor = Dropdown;


    // DROPDOWN NO CONFLICT
    // ====================

    $.fn.dropdown.noConflict = function() {
        $.fn.dropdown = old;
        return this;
    };


    // APPLY TO STANDARD DROPDOWN ELEMENTS
    // ===================================

    $(document)
        .on('click.wdesk.dropdown.data-api', '.dropdown form', function(event) { swallowClickPropagation(event); })
        .on('click.wdesk.dropdown-menu', function(event) { swallowClickPropagation(event); });

    $(toggle, document).dropdown();

});

if (define.isFake) {
    define = undefined;
}

/* ==========================================================
 * wdesk-inputmask.js v1.3.0 (http://bit.ly/19IOiQj)
 * adapted from inputmask.js v3.0.0-p7 by Jasny, BV
 * ===================================================
 * Copyright 2015 Workiva and Jasny, BV.
 * ========================================================== */

/* jshint quotmark: true, -W110 */

if (typeof define !== 'function') {
    define = function(deps, module) {
        module(window.jQuery);
    };
    define.isFake = true;
}

define(['jquery'],

function($) {

    'use strict';

    var isIE = window.navigator.appName == 'Microsoft Internet Explorer',
        isIE10 = navigator.userAgent.match(new RegExp("msie 10", "i")) !== null,
        isIphone = navigator.userAgent.match(new RegExp("iphone", "i")) !== null,
        isAndroid = navigator.userAgent.match(new RegExp("android.*safari.*", "i")) !== null,
        isAndroidchrome = navigator.userAgent.match(new RegExp("android.*chrome.*", "i")) !== null;


    // HELPER FUNCTIONS
    // =================================

    var isInputEventSupported = function(eventName) {
        eventName = 'on' + eventName;
        var el = document.createElement('input');
        var isSupported = (eventName in el);
        if (!isSupported) {
            el.setAttribute(eventName, 'return;');
            isSupported = typeof el[eventName] == 'function';
        }
        el = null;
        return isSupported;
    };


    // INPUTMASK PUBLIC CLASS DEFINITION
    // =================================

    var Inputmask = function(element, options) {
        if (isAndroid) {
            // No support because caret positioning doesn't work on Android
            return;
        }

        this.$element       = $(element);
        this.options        = $.extend({}, Inputmask.DEFAULTS, options);
        this.mask           = String(this.options.mask);
        this.isComplete     = false;
        this.unmaskedValue  = '';

        this.init();
        this.listen();

        // Perform initial check for existing values
        this.checkVal();
    };

    Inputmask.VERSION = '1.3.0';

    Inputmask.DEFAULTS = {
        mask: "",
        placeholder: "_",
        definitions: {
            '9': "[0-9]",
            'a': "[A-Za-z]",
            '~': "[A-Za-z0-9]",
            '*': "."
        },
        clearIncomplete: false // clear the incomplete input on blur
    };

    Inputmask.prototype.init = function() {
        var o = this.options;
        var defs = o.definitions;
        var len = this.mask.length;

        this.tests = [];
        this.partialPosition = this.mask.length;
        this.firstNonMaskPos = null;

        $.each(this.mask.split(""), $.proxy(function(i, c) {
            if (c == '?') {
                len--;
                this.partialPosition = i;
            } else if (defs[c]) {
                this.tests.push(new RegExp(defs[c]));
                if (this.firstNonMaskPos === null) {
                    this.firstNonMaskPos = this.tests.length - 1;
                }
            } else {
                this.tests.push(null);
            }
        }, this));

        this.buffer = $.map(this.mask.split(""), $.proxy(function(c, i) {
            if (c != '?') {
                return defs[c] ? o.placeholder : c;
            }
        }, this));

        this.focusText = this.$element.val();

        this.$element.data('rawMaskFn', $.proxy(function() {
            return $.map(this.buffer, function(c, i) {
                return this.tests[i] && c != o.placeholder ? c : null;
            }).join('');
        }, this));
    };

    Inputmask.prototype.isMask = function(pos) {
        return this.tests[pos];
    };

    Inputmask.prototype.listen = function() {
        if (this.$element.attr('readonly')) {
            return;
        }

        var pasteEventName = isInputEventSupported('paste') && !isIE10 ? 'paste' : isInputEventSupported('input') ? 'input' : 'propertychange';

        this.$element
            .on('unmask.wdesk.inputmask', $.proxy(this.unmask, this))

            .on('focus.wdesk.inputmask', $.proxy(this.focusEvent, this))
            .on('blur.wdesk.inputmask', $.proxy(this.blurEvent, this))

            .on('keydown.wdesk.inputmask', $.proxy(this.keydownEvent, this))
            .on('keypress.wdesk.inputmask', $.proxy(this.keypressEvent, this))

            .on(pasteEventName + ' dragdrop drop', $.proxy(this.pasteEvent, this));
    };

    Inputmask.prototype.caret = function(begin, end) {
        if (this.$element.length === 0) {
            return;
        }
        if (typeof begin == 'number') {
            end = (typeof end == 'number') ? end : begin;
            return this.$element.each(function() {
                if (this.setSelectionRange) {
                    this.setSelectionRange(begin, end);
                } else if (this.createTextRange) {
                    var range = this.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', end);
                    range.moveStart('character', begin);
                    range.select();
                }
            });
        } else {
            if (this.$element[0].setSelectionRange) {
                begin = this.$element[0].selectionStart;
                end = this.$element[0].selectionEnd;
            } else if (document.selection && document.selection.createRange) {
                var range = document.selection.createRange();
                begin = 0 - range.duplicate().moveStart('character', -100000);
                end = begin + range.text.length;
            }
            return {
                begin: begin,
                end: end
            };
        }
    };

    Inputmask.prototype.seekNext = function(pos) {
        var len = this.mask.length;
        if (pos >= len) {
            return len;
        }
        var position = pos;
        while (++position < len && !this.tests[position]) {
        }
        return position;
    };

    Inputmask.prototype.seekPrev = function(pos) {
        var position = pos;
        if (position <= 0) {
            return 0;
        }
        while (--position > 0 && !this.tests[position]) {
        }
        return position;
    };

    Inputmask.prototype.shiftL = function(begin, end) {
        var len = this.mask.length;

        if (begin < 0) {
            return;
        }

        for (var i = begin, j = this.seekNext(end); i < len; i++) {
            if (this.tests[i]) {
                if (j < len && this.tests[i].test(this.buffer[j])) {
                    this.buffer[i] = this.buffer[j];
                    this.buffer[j] = this.options.placeholder;
                } else {
                    break;
                }

                j = this.seekNext(j);
            }
        }

        this.writeBuffer();
        this.caret(Math.max(this.firstNonMaskPos, begin));
    };

    Inputmask.prototype.shiftR = function(pos) {
        var len = this.mask.length;

        for (var i = pos, c = this.options.placeholder; i < len; i++) {
            if (this.tests[i]) {
                var j = this.seekNext(i);
                var t = this.buffer[i];
                this.buffer[i] = c;
                if (j < len && this.tests[j].test(t)) {
                    c = t;
                } else {
                    break;
                }
            }
        }
    };

    Inputmask.prototype.unmask = function() {
        var unmaskedValue = this.unmaskValue();
        this.$element
            .off('.inputmask')
            .removeData('wdesk.inputmask');

        // if there is a value, make sure the "unmasked" value remains
        this.$element.val(unmaskedValue);
    };

    Inputmask.prototype.unmaskValue = function() {
        var that = this;
        return $.map(this.buffer, function(c, i) {
            return that.tests[i] && c != that.options.placeholder ? c : null;
        }).join('');
    };

    Inputmask.prototype.focusEvent = function() {
        var that = this;
        var len  = this.mask.length;
        var pos  = this.checkVal();

        this.focusText = this.$element.val();
        this.writeBuffer();

        var moveCaret = function() {
            if (pos == len) {
                that.caret(0, pos);
            } else {
                that.caret(pos);
            }
        };

        moveCaret();
        setTimeout(moveCaret, 50);
    };

    Inputmask.prototype.blurEvent = function() {
        this.checkVal();
        if (this.$element.val() !== this.focusText) {
            var _relatedEvent   = 'blur.wdesk.inputmask';
            var incompleteEvent = $.Event('incomplete.wdesk.inputmask', { relatedEvent: _relatedEvent });
            var completeEvent   = $.Event('complete.wdesk.inputmask',   { relatedEvent: _relatedEvent });
            this.$element.trigger(this.isComplete ? completeEvent : incompleteEvent);
            this.$element.trigger('change');
        }
    };

    Inputmask.prototype.keydownEvent = function(e) {
        var k = e.which;

        if (k == 8 || k == 46 || (isIphone && k == 127)) {
            // backspace, delete, and escape get special treatment
            var pos   = this.caret(),
                begin = pos.begin,
                end   = pos.end;

            if (end - begin === 0) {
                begin = k != 46 ? this.seekPrev(begin) : (end = this.seekNext(begin - 1));
                end   = k == 46 ? this.seekNext(end)   : end;
            }

            this.clearBuffer(begin, end);
            this.shiftL(begin, end - 1);
            return false;
        } else if (k == 27) {
            // escape
            this.$element.val(this.focusText);

            if (this.focusText.length === 0) {
                this.clearBuffer(0, this.mask.length);
                this.caret(0, 0);
            } else {
                this.caret(0, this.checkVal());
            }

            this.unmaskedValue = this.unmaskValue();

            return false;
        } else {
            // continue
        }
    };

    Inputmask.prototype.keypressEvent = function(e) {
        var len = this.mask.length;
        var _relatedEvent   = 'keypress.wdesk.inputmask';
        var incompleteEvent = $.Event('incomplete.wdesk.inputmask', { relatedEvent: _relatedEvent });
        var completeEvent   = $.Event('complete.wdesk.inputmask',   { relatedEvent: _relatedEvent });

        var k   = e.which,
            pos = this.caret();

        if (e.ctrlKey || e.altKey || e.metaKey || k < 32) {
            // Ignore
            return true;
        } else if (k) {

            if (pos.end - pos.begin !== 0) {
                this.clearBuffer(pos.begin, pos.end);
                this.shiftL(pos.begin, pos.end - 1);
            }

            var p = this.seekNext(pos.begin - 1);
            var c = String.fromCharCode(k);
            var next;

            if (p < len) {
                if (this.tests[p].test(c)) {
                    if (p == len - 1) {
                        this.$element.trigger(completeEvent);
                    } else {
                        this.$element.trigger(incompleteEvent);
                    }

                    this.shiftR(p);
                    this.buffer[p] = c;
                    this.writeBuffer();
                    next = this.seekNext(p);
                    this.caret(next);
                }
            }
            return false;
        }
    };

    Inputmask.prototype.pasteEvent = function() {
        var that = this;

        setTimeout(function() {
            that.caret(that.checkVal(true));
        }, 0);
    };

    Inputmask.prototype.clearBuffer = function(start, end) {
        var len = this.mask.length;

        for (var i = start; i < end && i < len; i++) {
            if (this.tests[i]) {
                this.buffer[i] = this.options.placeholder;
            }
        }
    };

    Inputmask.prototype.writeBuffer = function() {
        this.unmaskedValue = this.unmaskValue();
        return this.$element.val(this.buffer.join('')).val();
    };

    Inputmask.prototype.checkVal = function(allow) {
        var len = this.mask.length;
        // try to place characters where they belong
        var test = this.$element.val();
        var lastMatch = -1;

        for (var i = 0, pos = 0; i < len; i++) {
            if (this.tests[i]) {
                this.buffer[i] = this.options.placeholder;
                while (pos++ < test.length) {
                    var c = test.charAt(pos - 1);
                    if (this.tests[i].test(c)) {
                        this.buffer[i] = c;
                        lastMatch = i;
                        break;
                    }
                }
                if (pos > test.length) {
                    break;
                }
            } else if (this.buffer[i] == test.charAt(pos) && i != this.partialPosition) {
                pos++;
                lastMatch = i;
            }
        }
        if (!allow && lastMatch + 1 < this.partialPosition) {
            this.isComplete = false;
            if (this.options.clearIncomplete || this.unmaskValue().length === 0) {
                this.$element.val('');
                this.unmaskedValue = '';
                this.clearBuffer(0, len);
            }
        } else if (allow || lastMatch + 1 >= this.partialPosition) {
            if (lastMatch + 1 >= this.partialPosition) {
                this.isComplete = true;
            }

            this.writeBuffer();

            if (!allow) {
                this.$element.val(this.$element.val().substring(0, lastMatch + 1));
            }
            this.unmaskedValue = this.unmaskValue();
        }

        return (this.partialPosition ? i : this.firstNonMaskPos);
    };


    // INPUTMASK PLUGIN DEFINITION
    // ===========================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('wdesk.inputmask');
            var options = $.extend({}, Inputmask.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) {
                $this.data('wdesk.inputmask', (data = new Inputmask(this, options)));
            }
            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    var old = $.fn.inputmask;

    $.fn.inputmask             = Plugin;
    $.fn.inputmask.Constructor = Inputmask;


    // INPUTMASK NO CONFLICT
    // ====================

    $.fn.inputmask.noConflict = function() {
        $.fn.inputmask = old;
        return this;
    };


    // INPUTMASK DATA-API
    // ==================

    $(document).on('focus.wdesk.inputmask.data-api', '[data-mask]', function(e) {
        var $this = $(this);
        if ($this.data('wdesk.inputmask')) {
            return;
        }

        Plugin.call($this, $this.data());
    });

});

if (define.isFake) {
    define = undefined;
}

/* ==========================================================
 * wdesk-modal.js v1.3.0 (http://bit.ly/164zLvx)
 * adapted from bootstrap-modal v3.3.2
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

    // MODAL CLASS DEFINITION
    // ======================

    var Modal = function(element, options) {
        this.options        = options;
        this.$body          = $(document.body);
        this.$element       = $(element);
        this.$backdrop      = null;
        this.$modalBody     = null;
        this.$modalHeader   = null;
        this.$modalFooter   = null;
        this.isShown        = null;
        this.resizable      = undefined;
        this.scrollbarWidth = 0;
        this.transDuration;
        this.transDurationBackdrop;

        var o = this.options;

        this.$container = o.container       === 'body' ? $(document.body) : this.$element.closest(o.container);
        this.$parent    = o.parentContainer === 'body' ? $(document.body) : this.$element.closest(o.parentContainer);
    };

    if (!$.fn.emulateTransitionEnd) {
        throw new Error('wdesk-modal.js requires wdesk-transition.js');
    }
    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-modal.js requires wf-vendor.js');
    }

    Modal.VERSION = '1.3.0';

    Modal.DEFAULTS = {
        backdrop: true
      , backdropClass: ''
      , keyboard: true
      , show: true
      , duration: 300
      , backdropDuration: 150
      , container: 'body'
      , parentContainer: 'body'
      , sticky: false
    };

    Modal.prototype.toggle = function(_relatedTarget) {
        return this[this.isShown ? 'hide' : 'show'](_relatedTarget);
    };

    Modal.prototype.dismissContainedModal = function(event) {
        if ($(event.target).closest('.modal').length < 1) {
            $(document.body).off('click.wdesk.modal');
            this.$element.trigger('click.dismiss.wdesk.modal');
        }
    };

    Modal.prototype.setupContainedModal = function($elem) {
        var that = this;

        this.$container.addClass('modal-container');

        $elem
            .on('backdrop_shown.wdesk.modal', function() {
                that.$parent.addClass('overlaid');
            })
            .on('backdrop_hide.wdesk.modal', function() {
                that.$parent.removeClass('overlaid');
                that.$container.removeClass('modal-container');
            });

        //
        // Clicking anywhere outside the contained modal
        // should dismiss the modal if 'sticky' option is not set to true
        if (!this.options.sticky) {
            $(document.body).on('click.wdesk.modal', $.proxy(this.dismissContainedModal, this));
        }
    };

    Modal.prototype.autoSizeContainedModal = function() {
        this.$modalBody   = this.$element.find('.modal-body');
        this.$modalHeader = this.$element.find('.modal-header');
        this.$modalFooter = this.$element.find('.modal-footer');

        var reversedBodyAlignment = this.$modalBody.hasClass('top');

        var containerHeight = this.$parent.outerHeight();
        var containerWidth  = this.$parent.outerWidth();
        var containerFooterOffset = parseInt(this.$modalFooter.css('bottom'), 10);
        var containerFooterHeight = this.$modalFooter.outerHeight() + containerFooterOffset;

        var modalHeaderHeight = this.$modalHeader.height();
        var hasBodyContent = this.$modalBody.length > 0 && this.$modalBody.text().length > 0;
        var modalBodyHeight = hasBodyContent ? this.$modalBody.outerHeight() : 0;

        var availableMsgHeight = containerHeight - containerFooterHeight;
        var bottomOffset = ((availableMsgHeight - modalHeaderHeight - modalBodyHeight) / 2) + containerFooterHeight;

        if (reversedBodyAlignment) {
            // reverse configuration (header below body)
            this.$modalBody.css('bottom', bottomOffset + modalBodyHeight);
            this.$modalHeader.css('bottom', bottomOffset);
        } else {
            // normal configuration (header on top, body below)
            this.$modalBody.css('bottom', bottomOffset);
            this.$modalHeader.css('bottom', bottomOffset + modalBodyHeight);
        }
    };

    Modal.prototype.getTransDuration = function() {
        if (!this.transDuration) {
            this.transDuration = $.support.transition ? this.$element.find('.modal-dialog').getTransitionDuration() : this.options.duration;
        }
        return this.transDuration;
    };

    Modal.prototype.getTransDurationBackdrop = function() {
        if (!this.transDurationBackdrop) {
            this.transDurationBackdrop = $.support.transition ? this.$backdrop.getTransitionDuration() : this.options.backdropDuration;
        }
        return this.transDurationBackdrop;
    };

    Modal.prototype.show = function(_relatedTarget) {

        var that    = this;
        var o       = this.options;
        var event   = $.Event('show.wdesk.modal', { relatedTarget: _relatedTarget });
        var relatedTarget = _relatedTarget;

        this.$element.trigger(event);

        if (this.isShown || event.isDefaultPrevented()) {
            return;
        }

        this.isShown = true;

        this.$container = o.container       === 'body' ? this.$body : this.$element.closest(o.container);
        this.$parent    = o.parentContainer === 'body' ? this.$body : this.$element.closest(o.parentContainer);

        this.checkScrollbar();
        this.setScrollbar();

        this.$parent.addClass('modal-open');
        if (o.parentContainer === 'body') {
            //
            // Kill scroll on `<html>` as well since MSIE
            // has overflow on that node by default
            //
            $('html').addClass('modal-open');
        }

        this.$element.trigger($.Event('modal_open_class_added.wdesk.modal')); // for unit testing

        this.escape();
        this.resize();

        this.$element.on('click.dismiss.wdesk.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

        if (this.isContained()) {
            this.$element.addClass('contained');
            this.setupContainedModal(this.$element);
        }

        if (o.remote) {
            // make sure that each time a modal is shown, the content is re-loaded
            this.$element.load(o.remote, $.proxy(function() {
                this.$element.trigger('content_load.wdesk.modal');
                // wait until the content is done loading to call showModal
                this.showModal(relatedTarget);
            }, this));
        } else {
            this.showModal(relatedTarget);
        }
    };

    Modal.prototype.showModal = function(_relatedTarget) {

        var that = this;
        var o    = this.options;
        var relatedTarget = _relatedTarget;

        this.backdrop(function() {

            var transition = $.support.transition && (that.$element.hasClass('fade') || that.$element.hasClass('slide'));

            if (o.backdrop) {
                that.$element.insertAfter(that.$backdrop);
            } else {
                that.$element.appendTo(that.$container);
            }

            that.$element
                .show()
                .scrollTop(0);

            that.handleUpdate();

            if (transition) {
                that.$element[0].offsetWidth; // force reflow
            }

            that.$element
                .addClass('in')
                .attr('aria-hidden', false);

            that.enforceFocus();

            // modal content alignment helpers
            if (that.isContained()) {
                that.autoSizeContainedModal();
            }

            var complete = function() {
                var event = $.Event('shown.wdesk.modal', { relatedTarget: relatedTarget });
                that.$element.trigger('focus').trigger(event);
            };

            if (o.backdrop) {
                that.$element.trigger($.Event('backdrop_shown.wdesk.modal'));
            }

            var transDuration = that.getTransDuration();

            transition ?
                that.$element.find('.modal-dialog')
                    .one('wdeskTransitionEnd', complete)
                    .emulateTransitionEnd(transDuration) :
                complete();

        });
    };

    Modal.prototype.hide = function(event) {
        var that = this;
        var o    = this.options;

        var transition = $.support.transition && (that.$element.hasClass('fade') || that.$element.hasClass('slide'));

        if (event) {
            try {
                event.preventDefault();
            } catch(err) {
                // preventDefault() not defined
            }
        }

        event = $.Event('hide.wdesk.modal');
        if (o.backdrop) {
            this.$element.trigger($.Event('backdrop_hide.wdesk.modal'));
        }
        this.$element.trigger(event);

        if (!this.isShown || event.isDefaultPrevented()) {
            return;
        }
        this.isShown = false;

        this.escape();
        this.resize();

        $(document).off('focusin.wdesk.modal');

        this.$element
            .removeClass('in')
            .attr('aria-hidden', true)
            .off('click.dismiss.wdesk.modal');

        var transDuration = this.getTransDuration();

        transition ?
            this.$element.find('.modal-dialog')
                .one('wdeskTransitionEnd', $.proxy(this.hideModal, this))
                .emulateTransitionEnd(transDuration) :
            this.hideModal();
    };

    Modal.prototype.hideModal = function() {
        var that = this;
        var o    = this.options;

        this.$element.hide();

        this.backdrop(function() {

            that.$parent.removeClass('modal-open');
            if (o.parentContainer === 'body') {
                $('html').removeClass('modal-open');
            }

            that.resetAdjustments();
            that.resetScrollbar();

            if (o.remote) {
                that.removeModal();
            }

            that.$element
                .removeClass('contained')
                .trigger('hidden.wdesk.modal');
        });
    };

    Modal.prototype.removeModal = function() {
        this.$element && this.$element.find('.modal-dialog').remove();
        this.$element.trigger($.Event('content_unload.wdesk.modal'));
    };

    Modal.prototype.removeBackdrop = function() {
        this.$backdrop && this.$backdrop.remove();
        this.$backdrop = null;
    };

    Modal.prototype.backdrop = function(callback) {
        var that    = this;
        var o       = this.options;
        var animate = (this.$element.hasClass('fade') || this.$element.hasClass('slide')) ? 'fade' : '';
        var transition = $.support.transition && animate;
        var transDuration;

        if (this.isShown && o.backdrop) {

            this.$backdrop = $('<div class="backdrop modal-backdrop ' + animate + ' ' + o.backdropClass + '" role="presentation" />');
            this.$backdrop.appendTo(this.$container);

            this.$element.on('click.dismiss.wdesk.modal', $.proxy(function(event) {
                if (event.target !== event.currentTarget) { return; }
                o.backdrop == 'static'
                    ? this.$element[0].focus.call(this.$element[0])
                    : this.hide.call(this);
            }, this));

            transition && this.$backdrop[0].offsetWidth; // force reflow

            this.$element.trigger($.Event('backdrop_show.wdesk.modal'));
            this.$backdrop.addClass('in');

            if (!callback) {
                return;
            }

            transDuration = this.getTransDurationBackdrop();

            transition ?
                this.$backdrop
                    .one('wdeskTransitionEnd', callback)
                    .emulateTransitionEnd(transDuration) :
                callback();

        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass('in');

            var callbackRemove = function() {
                that.removeBackdrop();
                that.$element.trigger('backdrop_hidden.wdesk.modal');

                callback && callback();
            };

            transDuration = this.getTransDurationBackdrop();

            transition ?
                this.$backdrop
                    .one('wdeskTransitionEnd', callbackRemove)
                    .emulateTransitionEnd(transDuration) :
                callbackRemove();

        } else if (callback) {
            callback();
        }
    };

    Modal.prototype.enforceFocus = function() {
        $(document)
            .off('focusin.wdesk.modal') // guard against infinite focus loop
            .on('focusin.wdesk.modal', $.proxy(function(event) {
                if (this.$element[0] !== event.target && !this.$element.has(event.target).length) {
                    this.$element.trigger('focus');
                }
            }, this));
    };

    Modal.prototype.escape = function() {
        if (this.isShown && this.options.keyboard) {
            this.$element.on('keyup.dismiss.wdesk.modal', $.proxy(function(event) {
                event.which == 27 && this.hide();
            }, this));
        } else if (!this.isShown) {
            this.$element.off('keyup.dismiss.wdesk.modal');
        }
    };

    Modal.prototype.isContained = function() {
        return this.options.container !== 'body';
    };

    // ----------------------------------------------------
    //   Methods to handle overflowing modals
    //   when the modal's parent is document.body
    // ----------------------------------------------------

    Modal.prototype.isResizable = function() {
        return this.$parent[0] === document.body;
    };

    Modal.prototype.resize = function() {
        if (this.isResizable()) {
            if (this.isShown) {
                $(window).on('resize.wdesk.modal', $.proxy(this.handleUpdate, this));
            } else {
                $(window).off('resize.wdesk.modal');
            }
        }
    };

    Modal.prototype.handleUpdate = function() {
        if (this.isResizable()) {
            if (this.options.backdrop) {
                this.adjustBackdrop();
            }

            this.adjustDialog();
        }
    };

    Modal.prototype.adjustBackdrop = function() {
        if (this.isResizable() && this.$backdrop) {
            this.$backdrop
                .css('height', 0)
                .css('height', this.$element[0].scrollHeight);
        }
    };

    Modal.prototype.adjustDialog = function() {
        if (this.isResizable()) {
            var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

            this.$element.css({
                paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
                paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
            });
        }
    };

    Modal.prototype.resetAdjustments = function() {
        if (this.isResizable()) {
            this.$element.css({
                paddingLeft: '',
                paddingRight: ''
            });
        }
    };

    Modal.prototype.checkScrollbar = function() {
        if (this.isResizable()) {
            this.bodyIsOverflowing = document.body.scrollHeight > document.documentElement.clientHeight;
            this.scrollbarWidth = this.scrollbarWidth || this.measureScrollbar();
        }
    };

    Modal.prototype.setScrollbar =  function() {
        if (this.isResizable()) {
            var bodyPad = parseInt(this.$body.css('padding-right') || 0, 10);
            if (this.bodyIsOverflowing) {
                this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
            }
        }
    };

    Modal.prototype.resetScrollbar = function() {
        if (this.isResizable()) {
            this.$body.css('padding-right', '');
        }
    };

    Modal.prototype.measureScrollbar = function() {
        if (this.isResizable()) {
            var scrollDiv = document.createElement('div');
            scrollDiv.className = 'scrollbar-measure';

            this.$body.append(scrollDiv);
            var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
            this.$body[0].removeChild(scrollDiv);

            return scrollbarWidth;
        }
    };


    // MODAL PLUGIN DEFINITION
    // =======================

    var old = $.fn.modal;

    function Plugin(option, _relatedTarget) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('wdesk.modal');
            var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) {
                $this.data('wdesk.modal', (data = new Modal(this, options)));
            }
            if (typeof option == 'string') {
                data[option](_relatedTarget);
            } else if (options.show) {
                data.show(_relatedTarget);
            }
        });
    }

    $.fn.modal             = Plugin;
    $.fn.modal.Constructor = Modal;


    // MODAL NO CONFLICT
    // =================

    $.fn.modal.noConflict = function() {
        $.fn.modal = old;
        return this;
    };


    // MODAL DATA-API
    // ==============

    $(document).on('click.wdesk.modal.data-api', '[data-toggle="modal"]', function(event) {
        var $this   = $(this);
        var href    = $this.attr('href') || $this.attr('data-href');
        var target  = $this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''));
        var $target = $(target); //strip for ie7
        var option  = $target.data('wdesk.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

        if ($this.is('a')) { event.preventDefault(); }


        $target
            .one('show.wdesk.modal', function(showEvent) {
                if (showEvent.isDefaultPrevented()) {
                    // only register focus restorer if modal will actually get shown
                    return;
                }

                $target.one('hidden.wdesk.modal', function() {
                    $this.is(':visible') && $this.trigger('focus');
                    $target.trigger($.Event('refocus.wdesk.modal'));
                });
            });

        Plugin.call($target, option, this);
    });

});

if (define.isFake) {
    define = undefined;
}

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

/* ==========================================================
 * wdesk-tab.js v1.3.0 (http://bit.ly/13E6Cqd)
 * adapted from bootstrap-tab v3.3.2
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

    var tabSelectors = '[data-toggle=tab], [data-toggle=pill]';

    // TAB CLASS DEFINITION
    // ====================

    var Tab = function(element) {
        this.$element = $(element);
        this.$targetPane = null;
        this.transDuration = null;

        this.$element.on('keydown.wdesk.tab.data-api', $.proxy(this.keydown, this));
    };

    if (!$.fn.emulateTransitionEnd) {
        throw new Error('wdesk-tab.js requires wdesk-transition.js');
    }
    if (typeof _ === 'undefined' || typeof jQuery === 'undefined') {
        throw new Error('wdesk-tab.js requires wf-vendor.js');
    }

    Tab.VERSION = '1.3.0';

    Tab.DEFAULTS = {
        duration: 150
    };

    Tab.prototype.show = function() {
        var that = this;
        var $this = this.$element;
        var $triggerContainer = this.$element.closest('ul:not(.dropdown-menu)');

        var selector = getTabSelector($this);

        if ( $this.parent('li').hasClass('active') ) {
            return;
        }

        var previous = $triggerContainer.find('.active:last .hitarea')[0];
        var event = $.Event('show.wdesk.tab', { relatedTarget: previous });

        $this.trigger(event);

        if (event.isDefaultPrevented()) {
            return;
        }

        this.$targetPane = $(selector);

        this.activate($this.closest('li'), $triggerContainer);
        this.activate(this.$targetPane, this.$targetPane.parent(), function() {
            $this
                .focus()
                .trigger({
                    type: 'shown.wdesk.tab',
                    relatedTarget: previous
                });
        });
    };

    Tab.prototype.activate = function($element, $container, callback) {
        var that = this;
        var $elementToggle = $element.find(tabSelectors);
        var $active = $container.find('> .active');
        var $activeToggle = $active.find(tabSelectors);
        var $activePane = $active.filter('.tab-pane');
        var transition = callback && $.support.transition && $activePane.hasClass('fade');
        var transDuration = transition ? $activePane.getTransitionDuration() : Tab.DEFAULTS.duration;

        function next() {
            $active
                .removeClass('active')
                .find('> .dropdown-menu > .active')
                .removeClass('active');

            $activeToggle.attr({
                'tabindex': '0',
                'aria-selected': 'false'
            });
            $activePane.attr({
                'tabindex': '-1',
                'aria-hidden': 'true'
            });

            $element.addClass('active');
            $elementToggle.attr({
                'tabindex': '0',
                'aria-selected': 'true'
            });
            $element.filter('.tab-pane').attr({
                'tabindex': '0',
                'aria-hidden': 'false'
            });

            if (transition) {
                $element[0].offsetWidth; // reflow for transition
                $element.addClass('in');
            }

            if ($element.parent('.dropdown-menu')) {
                $element.closest('li.dropdown').addClass('active');
            }

            callback && callback();
        }

        transition ?
            $active
                .one('wdeskTransitionEnd', next)
                .emulateTransitionEnd(transDuration) :
            next();

        $active.removeClass('in');
    };

    Tab.prototype.keydown = function(event) {
        if (event.isDefaultPrevented()) {
            return;
        }

        var that = this,
            $tabParent = this.$element.closest('[role=tablist]'),
            key = event.which || event.keyCode,
            $items,
            $nextTab,
            index;

        if ($tabParent.length) {
            if (!/(37|38|39|40)/.test(key)) {
                return;
            }

            // in order to support nested collapses, only count items that are visible and not disabled
            $items = $tabParent.find('[role=tab]:visible:not(:disabled):not(.disabled):not([aria-disabled="true"])');

            if (!$items.length) {
                return;
            }

            // which $item has :focus?
            index = $items.index($(document.activeElement));

            if (key == 38 || key == 37) { index--; } // up & left
            if (key == 40 || key == 39) { index++; } // down & right

            if (index < 0) {
                index = $items.length - 1;
            }
            if (index == $items.length) {
                index = 0;
            }

            $nextTab = $items.eq(index);

            if ($nextTab.attr('role') === 'tab') {
                if ($nextTab.data('toggle') !== 'dropdown') {
                    $nextTab.tab('show').focus();
                } else {
                    // initialize it as a valid tab nav item even though its a dd
                    $nextTab.tab()
                    .click();
                }
            }

            event.preventDefault();
            event.stopPropagation();
        } else {
            // something went wrong... no tablist or tree found.
        }
    };


    // TAB HELPER FUNCTION(S)
    // =====================

    var getTabSelector = function($tabTrigger) {
        var selector = $tabTrigger.attr('data-target');

        if (!selector) {
            selector = $tabTrigger.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
        }

        return selector;
    };

    var getUID = function(prefix) {
        do {
            prefix += ~~(Math.random() * 1000000);
        }
        while (document.getElementById(prefix));

        return prefix;
    };


    // TAB PLUGIN DEFINITION
    // =====================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this);
            var data  = $this.data('wdesk.tab');
            if (!data) {
                $this.data('wdesk.tab', (data = new Tab(this)));
            }
            if (typeof option == 'string') {
                data[option]();
            }
        });
    }

    var old = $.fn.tab;

    $.fn.tab             = Plugin;
    $.fn.tab.Constructor = Tab;


    // TAB NO CONFLICT
    // ===============

    $.fn.tab.noConflict = function() {
        $.fn.tab = old;
        return this;
    };


    // TAB DATA-API
    // ============

    var clickHandler = function(event) {
        event.preventDefault();
        Plugin.call($(this), 'show');
    };


    $(document).on('mousedown.wdesk.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function(event) {
        if ($(event.target).is('.disabled') || $(event.target).is('[aria-disabled="true"]')) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
    });

    $(document).on('click.wdesk.tab.data-api', '[data-toggle="tab"]:not(.disabled):not([aria-disabled="true"])', clickHandler);
    $(document).on('click.wdesk.tab.data-api', '[data-toggle="pill"]:not(.disabled):not([aria-disabled="true"])', clickHandler);


    // ===============================================================
    //   MAKE TABBED CONTENT ACCESSIBLE
    //
    //   Consumer apps have two choices:
    //     1. Use fully-compliant markup in their templates
    //     2. Use minimal markup in their templates, and
    //        call $(tabbedNavSelector).accessibleTabs(); on page load
    // ===============================================================
    $.fn.accessibleTabs = function() {
        return this.each(function() {
            var $tabList = $(this),
                $lis     = $tabList.children('li'),
                $tabs    = $tabList.find(tabSelectors);

            $tabList.attr('role', 'tablist');
            $lis.attr('role', 'presentation');
            $tabs.attr('role', 'tab');

            $tabs.each(function(index) {
                var $tab        = $(this),
                    $tabParent  = $tab.parent(),
                    selector    = getTabSelector($tab),
                    tabPanelId  = selector.substr(1),
                    $tabPanel   = $('#' + tabPanelId),
                    tabId       = $tab.attr('id') || getUID('tab-control');

                $tab.attr('id', tabId);

                if ($tabParent.hasClass('active')) {
                    $tab.attr({
                        'tabindex':         '0',
                        'aria-selected':    'true',
                        'aria-controls':    tabPanelId
                    });
                    $tabPanel.attr({
                        'role':             'tabpanel',
                        'tabindex':         '0',
                        'aria-hidden':      'false',
                        'aria-labelledby':  tabId
                    });
                } else {
                    $tab.attr({
                        'tabindex':         '0',
                        'aria-selected':    'false',
                        'aria-controls':    tabPanelId
                    });
                    $tabPanel.attr({
                        'role':             'tabpanel',
                        'tabindex':         '-1',
                        'aria-hidden':      'true',
                        'aria-labelledby':  tabId
                    });
                }
            });

        });
    };

});

if (define.isFake) {
    define = undefined;
}

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
