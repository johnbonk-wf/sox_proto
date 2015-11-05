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
