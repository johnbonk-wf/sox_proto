/*!
 * Form Input HTML5 Placeholder Behavior Shim
 * by Aaron Lademann <aaron.lademann@workiva.com>
 *
 * WHY?
 *   1. Existing shims like jquery.placeholder implement a shim only
 *      if the browser has no support for the placeholder attribute.
 *      However, MSIE 10+ supports the placeholder attriute, yet it's
 *      behavior when focused is not compliant with the HTML5
 *      placeholder specificiation.
 *   2. MSIE 9 and below can be shimmed using jquery.placeholder,
 *      however the plugin reproduces the MSIE placeholder behavior,
 *      which IE Developers have acknowledged is incorrect.
 *      (@see https://twitter.com/deltakosh/status/479698349906333696)
 *
 * @requires jquery
 * @requires ua-sniffer.js
 */

+function(window, document, $) {

    'use strict';



    // -------------------------------------
    //   PLACEHOLDER CLASS DEFINITION
    // -------------------------------------

    var Placeholder = function(element, options) {
        var that = this;

        this.element = element;
        this.options = options;
        this.isInitialized = false;
        // so we can track value after a `keydown` to
        // prevent duplicate event broadcast again on `change`
        this.checkedVal = null;

        this.$form = $(element.form);
        this.$element = $(element);
        this.elementPlaceholder = this.$element.attr('placeholder');

        this.$element
            .on('focus.wdesk.placeholder',   $.proxy(this.setCaret, this))
            .on('drop.wdesk.placeholder',    $.proxy(this.setCaret, this))
            .on('click.wdesk.placeholder',   $.proxy(this.setCaret, this))
            .on('keydown.wdesk.placeholder', $.proxy(this.clear, this))
            .on('change.wdesk.placeholder',  $.proxy(this.checkNewValue, this))
            .on('keyup.wdesk.placeholder',   $.proxy(this.restore, this))
            .on('blur.wdesk.placeholder',    $.proxy(this.restore, this));

        this.$form
            .on('submit.wdesk.placeholder', $.proxy(this.clearPlaceholderBeforeSubmit, this));

        this.init();
    };



    // -------------------------------------
    //   PLACEHOLDER CLASS DEFAULTS
    // -------------------------------------

    Placeholder.DEFAULTS = {
        className: 'placeholder',
        // where to store the placeholder value after we remove the placeholder attribute
        replacementAttr: 'data-placeholder'
    };



    // -------------------------------------
    //   PLACEHOLDER KEYCODE CONSTANTS
    // -------------------------------------

    Placeholder.nonInputKeyCodes = [
        0, 38, 39, 40, 37, 17, 18, 91, 27, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121
    ];

    Placeholder.directionArrowKeyCodes = [
        40, 39, 37, 38
    ];


    // -------------------------------------
    //   PLACEHOLDER VAL() HOOKS
    //
    //   -> Customize getters and setters
    //      for the jQuery .val() method
    // -------------------------------------

    Placeholder.HOOKS = {
        'get': function(element) {
            var $element = $(element),
                data = $element.data('wdesk.placeholder');

            //
            // ensure that anyone requesting the value of the input
            // via .val() gets '' instead of the placeholder value
            //
            if (data && element.value === $element.attr(data.options.replacementAttr)) {
                if ($element.hasClass(data.options.className)) {
                    return '';
                } else {
                    return element.value;
                }
            }
        },
        'set': function(element, value) {
            var $element = $(element),
                data = $element.data('wdesk.placeholder');

            element.value = value;

            if (data && data.isInitialized) {
                //
                // ensure that placeholder logic knows to check the new value
                // since the change event is not fired by default when the value
                // of a form element is changed programatically.
                //
                $element.trigger('change.wdesk.placeholder');
            }

            return element.value;
        }
    };



    // -------------------------------------
    //   PLACEHOLDER REQUIREMENT CHECKS
    // -------------------------------------

    if (typeof $.client === 'undefined') {
        throw new Error('placeholder-behavior.js requires ua-sniffer.js');
    }

    if (typeof jQuery === 'undefined') {
        throw new Error('placeholder-behavior.js requires jQuery');
    }



    // -------------------------------------
    //   LOCAL HELPER VARS / METHODS
    // -------------------------------------

    var _isValidInputCharacter = function(keyCode) {
        // If we don't check for this, and allow the rest of the
        // clear / restore methods to execute, our inputs will
        // "flicker" when these keystrokes are made
        return Placeholder.nonInputKeyCodes.indexOf(keyCode) < 0;
    };

    var _isDirectionArrowKey = function(keyCode) {
        // If we don't check for this, and allow the rest of the
        // clear / restore methods to execute, our inputs will
        // give away our little secret - that the value that
        // looks like a placeholder is actually the value of the field
        return Placeholder.directionArrowKeyCodes.indexOf(keyCode) > -1;
    };


    // -------------------------------------
    //   PLACEHOLDER CLASS METHODS
    // -------------------------------------

    Placeholder.prototype.init = function() {
        this.$element.trigger('beforeInit.wdesk.placeholder'); // for unit testing

        this.getOptions();

        this.$element
            .attr(this.options.replacementAttr, this.elementPlaceholder)
            .removeAttr('placeholder');

        if (typeof this.element.value === 'undefined' || this.element.value === '') {
            this.$element
                .addClass(this.options.className)
                .val(this.elementPlaceholder);

            this.convertToTextInputType();
        } else {
            this.$element.removeClass(this.options.className);
        }

        if (this.element.type === 'password') {
            this.$element.attr('data-original-type', 'password');
        }

        this.isInitialized = true;

        this.$element.trigger('ready.wdesk.placeholder');
    };

    Placeholder.prototype.getDefaults = function() {
        return Placeholder.DEFAULTS;
    };

    Placeholder.prototype.getOptions = function(options) {
        var _options = options ? options : this.options;
        return this.options = $.extend({}, this.getDefaults(), this.$element.data(), _options);
    };

    Placeholder.prototype.isElementShimmed = function() {
        return this.$element.hasClass(this.options.className);
    };

    Placeholder.prototype.elementValPlaceholderMatch = function() {
        return this.element.value === this.$element.attr(this.options.replacementAttr);
    };

    Placeholder.prototype.convertToTextInputType = function() {
        if (this.element.type === 'password') {
            this.$element.attr('data-original-type', 'password');

            if (this.elementValPlaceholderMatch()) {
                try {
                    this.element.type = 'text';
                } catch(err) {
                    // Thanks MSIE 8!!!
                }
            }
        }
    };

    Placeholder.prototype.clearPlaceholderBeforeSubmit = function(event) {
        var that = this;

        if (this.elementValPlaceholderMatch() && this.isElementShimmed()) {
            this.$element.val('');
        }
    };

    Placeholder.prototype.setCaret = function(event) {
        if (this.elementValPlaceholderMatch() && this.isElementShimmed()) {
            try {
                this.element.setSelectionRange(0, 0);
            } catch(err) {
                // Thanks MSIE 8!!!
            }

            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            return false;
        }
    };

    Placeholder.prototype.checkNewValue = function(event) {
        if (!event.originalEvent) {
            // When change event is fired via our custom
            // jQuery.valHooks setter, we need to check the
            // value that was set to determine whether the
            // placeholder should be added or removed

            var newValue = this.element.value,
                _event = event;

            if (newValue !== this.checkedVal) {
                // only call the associated method once by checking
                // if the value has changed since the event last fired
                // so that duplicate events are not fired in either
                // clear or restore methods
                if (newValue === '') {
                    this.restore(_event);
                } else {
                    this.clear(_event);
                }
            }

            this.checkedVal = newValue;
        } else {
            // change event was not triggered by us - it was the
            // side-affect of another event that we're already subscribed to.
        }
    };

    Placeholder.prototype.clear = function(event) {
        var keyCode = event ? event.keyCode : 0;
        var backspaceKeypress = event ? keyCode === 8 : false;
        var tabKeypress = event ? keyCode === 9 : false;
        var shiftKeypress = event ? (event.shiftKey && keyCode === 16) : false;
        var eventType = event ? event.type : false;

        // If its a direction arrow keypress, we need to make the
        // caret not move like it would if there were actually a value in the field
        if (_isDirectionArrowKey(keyCode) && this.$element.val() === '') {
            event.preventDefault();
        }

        if (!shiftKeypress && !tabKeypress && !backspaceKeypress && _isValidInputCharacter(keyCode)) {
            if ((this.elementValPlaceholderMatch() || eventType === 'change') && this.isElementShimmed()) {

                // Must change the element type before changing the value
                if (this.$element.attr('data-original-type') === 'password') {
                    try {
                        this.element.type = 'password';
                    } catch(err) {
                        // Thanks MSIE 8!!!
                    }
                }

                if (eventType && eventType !== 'change') {
                    // value change was NOT triggered programatically
                    this.element.value = '';
                }

                this.$element.removeClass(this.options.className);

                this.$element.trigger($.Event('cleared.wdesk.placeholder', { relatedEvent: event }));
            }
        }
    };

    Placeholder.prototype.restore = function(event) {
        var keyCode = event ? event.keyCode : 0;

        if (this.element.value === '' && _isValidInputCharacter(keyCode)) {
            this.$element
                .val(this.$element.attr(this.options.replacementAttr))
                .addClass(this.options.className);

            this.setCaret(event);
            this.convertToTextInputType();

            this.$element.trigger($.Event('restored.wdesk.placeholder', { relatedEvent: event }));
        }
    };



    // -------------------------------------
    //   PLACEHOLDER PLUGIN DEFINITION
    // -------------------------------------

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this),
                data  = $this.data('wdesk.placeholder'),
                options = typeof option == 'object' && option;

            if (!data) {
                $this.data('wdesk.placeholder', (data = new Placeholder(this, options)));
            }

            if (typeof option == 'string' && option !== 'init') {
                data[option]();
            }
        });
    }

    var old = $.fn.placeholder;

    $.fn.placeholder             = Plugin;
    $.fn.placeholder.Constructor = Placeholder;



    // -------------------------------------
    //   PLACEHOLDER NO CONFLICT
    // -------------------------------------

    $.fn.placeholder.noConflict = function() {
        $.fn.placeholder = old;
        return this;
    };



    // -------------------------------------
    //   PLACEHOLDER DOM INSTANTIATION
    //
    //   -> Shim inputs/textareas based on
    //      support when the page loads
    // -------------------------------------

    $(document).ready(function() {
        var isMSIE                          = $.mockBrowser === 'IE' || $.client.browser === 'IE',
            isMSIElt9                       = $.mockBrowserVersion < 9 || parseInt($.client.version) < 9,
            isInputPlaceholderSupported     = isMSIE ? false : 'placeholder' in document.createElement('input'),
            isTextareaPlaceholderSupported  = isMSIE ? false : 'placeholder' in document.createElement('textarea'),
            elementsToShimSelector          = '',
            targetSelector                  = '[placeholder]';


        if (!isInputPlaceholderSupported) {
            $.valHooks.input = Placeholder.HOOKS;
            elementsToShimSelector = 'input' + targetSelector;
        }
        if (!isTextareaPlaceholderSupported) {
            $.valHooks.textarea = Placeholder.HOOKS;
            elementsToShimSelector += (isInputPlaceholderSupported ? '' : ', ') + 'textarea' + targetSelector;
        }

        var $dataPlaceholders = $(elementsToShimSelector).not('[type="number"]');


        if ($dataPlaceholders.length > 0) {
            if (!isMSIElt9) {
                Plugin.call($dataPlaceholders, 'init');
            } else {
                // MSIE 8 and below
                // uses the old jquery.placeholder stuff
                // since you cannot change the type of an input
                $dataPlaceholders.placeholderMSIElt9();
            }
        }
    });



    // -----------------------------------------
    //   CLEAR PLACEHOLDERS BEFORE PAGE RELOAD
    // -----------------------------------------

    $(window).on('beforeunload.wdesk.placeholder', function() {
        $('[data-placeholder]').val('');
    });

}(this, document, jQuery);
