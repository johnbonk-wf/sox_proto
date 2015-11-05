var touchEnabled;

function sidebarMinMaxControl() {
    var $sidebarLeft = $('.wksp-sidebar-left');
    var $sidebarRight = $('.wksp-sidebar-right');

    // Initialize appearance based on whether or not its a touch device
    if (touchEnabled) {
        $sidebarLeft.removeClass('wksp-sidebar-hoverable');
        $sidebarRight.removeClass('wksp-sidebar-hoverable');
    }

    $(document)
        .on('click', '.wksp-sidebar-minimized.wksp-sidebar-right .nav-item > .hitarea', function (e) {
            $sidebarRight.removeClass('wksp-sidebar-minimized');
        })
        .on('click', '.wksp-sidebar-min-max-control-wrapper .sidebar-toggle', function (e) {
            var $trigger = $(e.target);
            var $sidebar = $trigger.closest('.wksp-sidebar');

            if (_isParentSidebarCollapsed($trigger)) {
                $sidebar.removeClass('wksp-sidebar-minimized');

                if (!touchEnabled) {
                    $sidebar.addClass('wksp-sidebar-hoverable');
                }
            } else {
                $sidebar
                    .addClass('wksp-sidebar-minimized')
                    .removeClass('wksp-sidebar-hoverable');
            }
        });
}

function _isParentSidebarCollapsed($elem) {
    return $elem.closest('.wksp-sidebar').is('.wksp-sidebar-minimized');
}

//
// Simulate dropdown menu auto-width option
// if the popover is being triggered by a hitarea
// within a maximized sidebar
//
function setPopoverElemWidth(trigger) {
    var $trigger = $(trigger);
    var popoverInstance = $trigger.data('wdesk.popover');
    var $popoverElem = popoverInstance.$tip;

    if (popoverInstance.options.autoWidth) {
        if (!_isParentSidebarCollapsed($trigger)) {
            $popoverElem.css('min-width', $trigger.outerWidth());
        }
    }
}

function removePopoverElemWidth(trigger) {
    var $trigger = $(trigger);
    var popoverInstance = $trigger.data('wdesk.popover');
    var $popoverElem = popoverInstance.$tip;

    $popoverElem.css('min-width', 'none');
}

function sidebarPopoverMenus() {
    var popoverMenuTemplate = '<div role="tooltip" class="popover popover-menu"><div class="arrow" aria-hidden="true"></div><div class="inner"><div class="content"></div></div></div></div>';

    //
    // Initialize sidebar popovers
    //
    $('.wksp-sidebar [data-toggle=popover]')
        .on('show.wdesk.popover', function(e) {
            $(this).addClass('active open');
            $(this).parent().addClass('active open');
            $(this).closest('.wksp-sidebar')
                .attr('data-popover-open', 'true')
                .addClass('wksp-sidebar-active');

            setPopoverElemWidth(this);
        })
        .on('hide.wdesk.popover', function(e) {
            $(this).removeClass('active open');
            $(this).parent().removeClass('active open');
            $(this).closest('.wksp-sidebar')
                .attr('data-popover-open', 'false')
                .removeClass('wksp-sidebar-active');

            removePopoverElemWidth(this);
        })
        .popover({
            html: true,
            modal: true,
            container: 'body',
            viewport: {
                selector: '.grid-frame',
                padding: 16
            },
            placement: function() {
                var $trigger = this.$element;
                var placement = this.$element.data('placement') || 'bottom auto';

                if (_isParentSidebarCollapsed($trigger)) {
                    placement = 'right auto';
                }

                return placement;
            },
            template: popoverMenuTemplate
        });
}

function sidebarPanelHitareas() {
    // Wire up a mutex / active state for non-panel hitareas
    // that are grouped together with panel hitareas
    var $allNavItems = $('.wksp-pill-panel-container > .wksp-nav-pills > .nav-item');
    var $nonPanelItems = $allNavItems.not('.wksp-pill-panel');

    $('> .hitarea', $allNavItems)
        .on('click', function(e) {
            var $target = $(e.target);

            // mutex
            $nonPanelItems.removeClass('active');

            if ($target.is('.wksp-pill-panel') || $target.closest('.wksp-pill-panel').length > 0) {
                // panel heading was clicked
            } else {
                // regular nav item was clicked
                $target.closest('.nav-item').addClass('active');

                // collapse any expanded collapsible panels
                $('.wksp-pill-panel-container .collapse.in').collapse('hide');
            }
        });


    var $panelChildNavItems = $('.wksp-pill-panel .nav > .nav-item');

    $('> .hitarea', $panelChildNavItems)
        .on('click', function(e) {
            // mutex
            $panelChildNavItems.removeClass('active');

            $(e.target).closest('.nav-item').addClass('active');
        });
}

function sidebarHoverLogic() {
    $('.wksp-sidebar')
        .on('mouseenter', function(e) {
            if (!$(this).hasClass('wksp-sidebar-active')) {
                $(this)
                    .attr('data-hovered', 'true')
                    .addClass('wksp-sidebar-active');
            }
        })
        .on('click', function(e) {
            if (!$(this).hasClass('wksp-sidebar-active')) {
                $(this)
                    .attr('data-hovered', 'true')
                    .addClass('wksp-sidebar-active');
            }
        })
        .on('mouseleave', function(e) {
            // mouseleave
            $(this).not('[data-popover-open=true]')
                .attr('data-hovered', 'false')
                .removeClass('wksp-sidebar-active');
        });


    $('.wksp-sidebar .hitarea, .wksp-sidebar .btn')
        .on('focus', function(e) {
            $(this).closest('.wksp-sidebar:not(.wksp-sidebar-active)').addClass('wksp-sidebar-active');
        });
}


// ----------------------------------------------------
//   INITIALIZE E'THING
// ----------------------------------------------------
!function($) { $(function() {
    touchEnabled = Modernizr.touch || Modernizr.mstouch;

    sidebarHoverLogic();
    sidebarMinMaxControl();
    sidebarPopoverMenus();
    sidebarPanelHitareas();
});}(jQuery);
