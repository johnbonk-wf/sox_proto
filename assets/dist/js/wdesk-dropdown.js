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
