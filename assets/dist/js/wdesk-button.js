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
