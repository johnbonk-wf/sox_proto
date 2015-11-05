!function($) { $(function() {

    // CLEAR SEARCH DEMOS
    // --------------------
        var $clearSearch = $('.input-group-search-btn-clear > .btn', '#main-content');
        if ($clearSearch.length > 0) {
            $clearSearch.button('clearSearch');
        }


    // ICON SEARCH / FILTER
    // --------------------

    jQuery.expr[':'].Contains = function(a,i,m) { return (a.textContent || a.innerText || '').toUpperCase().indexOf(m[3].toUpperCase()) >= 0; };

    //
    // FILTER CONFIG VAR
    //
    var $filterWrapper       = $('#icon-glyph-search');
    var itemSelector         = '.glyph';

    //
    // GLOBAL VARS (do not modify for each instance)
    //
    //
    var historyStateVar      = $filterWrapper.data('history-state-var');
    var historyStateDefault  = $filterWrapper.data('history-state-default'); // which groups are selected by defult?
    var target               = $filterWrapper.attr('data-target');

    var $searchContainer     = $('.search-criteria-container', $filterWrapper);
    var $searchResults       = $('.search-results-container', $filterWrapper);
    var $noResultsElem       = $('.panel-empty-results', $filterWrapper);

    var $filterByKeyword     = $('.search-filter', $filterWrapper);
    var $searchInput         = $('.form-control', $filterByKeyword);
    var $filterByGroup       = $('.group-filters', $filterWrapper);
    var $groupFilters        = $('[data-filter]', $filterByGroup);
    var $activeGroupFilters  = $('[aria-checked=true] > [data-filter]', $filterByGroup);

    var $filterIndicator     = $('.filter-indicator', $filterWrapper);
    var $filterIndicatorBtn  = $('> .hitarea', $filterIndicator);
    var $unfilteredIcon      = $('.indicate-unfiltered', $filterIndicator);
    var $filteredIcon        = $('.indicate-filtered', $filterIndicator);

    var $filterCountElem     = $('.filter-count-container', $filterWrapper);
    var $filterCountFiltered = $('.filtered-result-count', $filterCountElem);
    var $filterCountTotal    = $('.total-result-count', $filterCountElem);

    // global obj where visible items will be stored so we can wire up event listeners for hover/focus/blur
    var $filteredItems = [];


    function toggleIconColorOptions(data) {
        var $popover = data.$tip;
        var $colorToggleButtons = $('[data-toggle=buttons]', $popover);

        if ($colorToggleButtons.length > 0) {
            var $iconGlyph = $('.icon[data-color-class]', $popover);
            var iconColorClass = $iconGlyph.data('color-class');

            $('.btn', $colorToggleButtons).on('click', function(event) {
                var $input = $(':input', $(this));
                if ($input.val() === 'off') {
                    $iconGlyph.removeClass(iconColorClass);
                } else {
                    $iconGlyph.addClass(iconColorClass);
                }
            });
        }
    }

    function itemFocus(event) {
        var $item = $(event.currentTarget);

        // make buttons within the item focusable / clickable
        $item
            .find('[href], [type=button], [role=button]')
                .attr({
                    'aria-disabled': 'false',
                    'tabindex': '0'
                });
    }

    function itemBlur(event) {
        var $item = $(event.currentTarget);

        // make buttons within the item focusable / clickable
        $item.find('[href], [type=button], [role=button]')
            .attr({
                'aria-disabled': 'true',
                'tabindex': '-1'
            });
    }

    //
    // programatically trigger the filtering of the a group shown by set
    //
    $.selectFilterableGroup = function(groupName) {
        var $setToggleButtons = $searchContainer.find('[data-filter]');
        var groupNames = groupName.split(',');

        var $selectedToggleButtons = $setToggleButtons.filter('[data-filter="#' + historyStateVar + '-' + groupNames[0] + '"]');

        if (groupNames.length > 1) {
            for (var i = 1; i < groupNames.length; i++) {
                var $thisToggleButton = $setToggleButtons.filter('[data-filter="#' + historyStateVar + '-' + groupNames[i] + '"]');
                $selectedToggleButtons = $selectedToggleButtons.add($thisToggleButton);
            }
        }

        $.each($setToggleButtons, function() {
            var $toggleButton = $(this);
            var $toggleButtonParent = $toggleButton.parent('[aria-checked]');
            var isSelectedToggleButton = false;

            if ($selectedToggleButtons.length > 1) {
                $.each($selectedToggleButtons, function() {
                    isSelectedToggleButton = $toggleButton.data('filter') === $(this).data('filter');

                    if (isSelectedToggleButton) { return false; }
                });
            } else {
                isSelectedToggleButton = $toggleButton.data('filter') === $selectedToggleButtons.data('filter');
            }

            if ($toggleButtonParent.hasClass('active')) {
                if (!isSelectedToggleButton) {
                    updateGroupToggleFilterButtons($toggleButtonParent, false);
                } else {
                    // was already de-selected... nothing to do.
                }
            } else {
                if (isSelectedToggleButton) {
                    updateGroupToggleFilterButtons($toggleButtonParent, true);
                } else {
                    // was already selected... nothing to do.
                }
            }
        });


        var $items = filterResults(itemSelector);
        return $selectedToggleButtons;
    };
    //
    //
    //


    if ($(target).length > 0) {
        var $items;

        $searchInput
            .on('change', function(event) {
                $items = filterResults(itemSelector);
            })
            .on('keyup', function(event) {
                $searchInput.change();
            });

        $($groupFilters).on('click', function(event) {
            var $filterCheckbox = $(this).parent('[aria-checked]');
            var isActive = $filterCheckbox.hasClass('active');


            updateGroupToggleFilterButtons($filterCheckbox, !isActive);
            $items = filterResults(itemSelector);
        });

        // wire up the "filter indicator" hitarea so that it clears the search field when clicked if a filter is active
        $($filterIndicatorBtn).on('click', function(event) {
            if ($(this).not(':disabled')) {
                $filterByKeyword.find('.clear-search').click();
            }
        });

        setTimeout(function() {
            if (history.pushState) {
                if (history.state) {
                    var savedState = history.state[historyStateVar];
                    if (savedState && savedState !== historyStateDefault) {
                        $.selectFilterableGroup(savedState);
                    } else {
                        $items = filterResults(itemSelector, true);
                    }
                } else {
                    $items = filterResults(itemSelector);
                }
            } else {
                $items = filterResults(itemSelector);
            }
        }, 100);

        //
        // ON FILTERED EVENT STUFF
        //
        $filterWrapper
            .on('filtered.wdesk.' + historyStateVar + '.search-api', function(event) {
                //
                // HOVER/FOCUS/CLICK WIRING FOR EACH ITEM
                //
                var $oldFilteredItems = $filteredItems; // keep a reference to the old set of items for comparison
                $filteredItems = event.filteredItems; // update global filteredItems variable

                if ($filteredItems !== $oldFilteredItems || $oldFilteredItems.length === 0) {

                    if ($oldFilteredItems.length > 0) {
                        // different set of items if now visible
                        // turn off pre-existing events
                        $oldFilteredItems
                            .off('.search-api');
                    }

                    // either a different set of items is now visible... or its the first time this event has been triggered.
                    $filteredItems
                        .on('mouseenter.wdesk.search-api focusin.wdesk.search-api', function(event) {
                            itemFocus(event);
                        })
                        .on('mouseleave.wdesk.search-api focusout.wdesk.search-api', function(event) {
                            var $that = $(this);
                            if ($(document.activeElement).closest($that).length === 0) {
                                itemBlur(event);
                            }
                        })
                        .on('click.wdesk.search-api', function(event) {
                            var $eventTarget = $(event.target);
                            var $currentTarget = $(event.currentTarget);
                            if ($eventTarget.attr('href') || $eventTarget.closest('.btn').length > 0) {
                                // don't trigger the popover
                            } else {
                                // trigger the popover
                                $currentTarget
                                    .on('shown.wdesk.popover', function(event) {
                                        // wire up the color toggle buttons if they exist
                                        toggleIconColorOptions($(this).data('wdesk.popover'));
                                    })
                                    .popover({
                                        template: '<div class="popover glyph-meta-popover" role="tooltip"><div class="arrow" aria-hidden="true"></div><div class="inner"><h3 class="title"></h3><div class="content"></div></div></div>'
                                    })
                                    .popover('toggle');
                            }
                        })
                        .on('keydown.wdesk.search-api', function(event) {
                            var key = event.which || event.keyCode;

                            // spacebar or enter keys only
                            if (!/(13|32)/.test(key)) {
                                return;
                            }

                            $(this).trigger('click.wdesk.search-api');
                        });
                } else {
                    // nothing changed - no need to modify event wiring
                }
            });
    }

    function getActiveGroupFilters() {
        return $activeGroupFilters = $('[aria-checked=true] > [data-filter]', $filterByGroup);
    }

    function saveGroupFilterState() {
        if (history.pushState) {
            var activeSets = '';
            var newState = {};
            $.each(getActiveGroupFilters(), function() {
                var dataFilter = $(this).data('filter');
                var setName = dataFilter.substr(dataFilter.lastIndexOf('-') + 1, dataFilter.length);
                activeSets += setName + ',';
            });
            newState[historyStateVar] = activeSets.substring(0, activeSets.length - 1); // remove trailing comma

            if (history.state) {
                // previous state exists
                if (newState[historyStateVar] !== history.state[historyStateVar]) {
                    history.pushState(newState, null, document.location.pathname + document.location.hash);
                }
            } else {
                // no previous state
                history.pushState(newState, null, document.location.pathname + document.location.hash);
            }
        }
    }

    function hideItem($item) {
        $item
            .attr({
                'aria-hidden': 'true',
                'tabindex': '-1'
            })
            .hide()
            .find('[href], [type=button], [role=button]')
                .attr({
                    'aria-disabled': 'true',
                    'tabindex': '-1'
                });
    }

    function showItem($item) {
        $item
            .attr({
                'aria-hidden': 'false',
                'tabindex': '0'
            })
            .show();
    }

    function updateFilterIndicators(state) {
        if (state == 'unfiltered') {
            $searchContainer.attr('data-filtered', false);

            $filterIndicator
                .removeClass('active');

            $filterIndicatorBtn
                .prop('disabled', true);

            hideItem($filteredIcon);
            showItem($unfilteredIcon);
        } else {
            $searchContainer.attr('data-filtered', true);

            $filterIndicator
                .addClass('active');

            $filterIndicatorBtn
                .prop('disabled', false);

            hideItem($unfilteredIcon);
            showItem($filteredIcon);
        }
    }

    function updateGroupToggleFilterButtons($checkbox, isActive) {
        if (isActive) {
            $checkbox
                .attr({
                    'aria-checked': 'true',
                    'title': $checkbox.data('checked-title')
                });

            if (!$checkbox.hasClass('active')) {
                $checkbox.addClass('active');
            }
        } else {
            $checkbox
                .attr({
                    'aria-checked': 'false',
                    'title': $checkbox.data('title')
                });

            $checkbox.removeClass('active');
        }
    }

    //
    // Searches the contents of any `item` containing `data-filter-meta="true"` within the `target` elem
    //
    function filterResults(item, fromHistoryState) {
        fromHistoryState = fromHistoryState || false;
        $filterWrapper.trigger($.Event('filter.wdesk.' + historyStateVar + '.search-api'));

        var keywordSearchCriteria  = $searchInput.val();
        var groupSearchCriteria    = false;
        var $target                = $(target);
        var requiredItemAttr       = '[data-filter-meta="true"]';

        var filterableElemSelector = item + ':has(' + requiredItemAttr + ')';
        var $filterableElems       = $target.find(filterableElemSelector); // elems that can be shown/hidden based on criteria
        var $filterableGroupElems  = $filterableElems;
        var $filterableMetaElems,
            $matchedElems;

        if ($groupFilters.length > 0) {
            var inactiveGroupTargets = [];

            $.each($groupFilters, function() {
                var filterTarget = $(this).data('filter');
                var $filterCheckbox = $(this).parent('[aria-checked]');
                var isActive = $filterCheckbox.hasClass('active');

                if (!isActive) {
                    inactiveGroupTargets.push(filterTarget);
                }

                updateGroupToggleFilterButtons($filterCheckbox, isActive);
            });

            if (inactiveGroupTargets.length > 0) {
                groupSearchCriteria = ':not(' + inactiveGroupTargets.toString() + ')';
            }

            // save HTML5 state based on the groups selected
            !fromHistoryState && saveGroupFilterState();
        }

        if (groupSearchCriteria) {
            // group filter toggles with search
            $filterableGroupElems = $target.find(groupSearchCriteria + ' ' + filterableElemSelector);
        }

        $filterableMetaElems = $(requiredItemAttr, $filterableGroupElems);
        $matchedElems        = $filterableGroupElems; // elems that match all criteria

        if ($filterableElems.length === 0) {
            console.log('WARNING: No filterable elems found within `' + target + '`. Did you forget to add the `data-filter-meta="true"` attribute to each `' + item + '`?');

            var $inputs = $searchInput.closest($searchContainer).find(':input');
            $inputs.prop('disabled', true);

            $filterCountElem
                .attr('aria-hidden', true)
                .hide();

            $noResultsElem
                    .attr('aria-hidden', false)
                    .show();

        } else {

            $filterCountTotal.html($filterableElems.length);


            if (keywordSearchCriteria || groupSearchCriteria) {
                $matchedElems = $filterableMetaElems.filter(':Contains(' + keywordSearchCriteria + ')').closest(item);

                if ($matchedElems.length < $filterableElems.length) {
                    updateFilterIndicators('filtered');
                } else {
                    updateFilterIndicators('unfiltered');
                }
            } else {
                $matchedElems = $filterableGroupElems;
                updateFilterIndicators('unfiltered');
            }

            if ($matchedElems.length === 0) {
                $noResultsElem
                    .attr('aria-hidden', false)
                    .show();
            } else {
                $noResultsElem
                    .attr('aria-hidden', true)
                    .hide();
            }

            $matchedElems
                .attr('aria-hidden', false)
                .show();

            $filterableElems.not($matchedElems)
                .attr('aria-hidden', true)
                .hide();

            $filterCountFiltered.html($matchedElems.length);

            $filterCountElem
                .attr('aria-hidden', false)
                .show();

        } // END if ($filterableElems.length == 0)

        // reveal the result set now that we're done filtering
        $searchResults
            .attr({
                'data-ready': 'true',
                'aria-hidden': 'false'
            });

        // scroll the container to the top just in case it was scrolled down
        if ($searchResults.scrollTop() > 0) {
            $searchResults.scrollTop(0);
        }

        $filterWrapper.trigger($.Event('filtered.wdesk.' + historyStateVar + '.search-api', { filteredItems: $matchedElems }));

        return $matchedElems;
    }

});}(jQuery);
