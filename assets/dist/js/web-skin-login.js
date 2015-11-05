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
