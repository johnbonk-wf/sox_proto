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
