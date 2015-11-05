/* global document, Fuse */
'use strict';

var addEvent = (function () {
  var filter = function(el, type, fn) {
    for ( var i = 0, len = el.length; i < len; i++ ) {
      addEvent(el[i], type, fn);
    }
  };
  if ( document.addEventListener ) {
    return function (el, type, fn) {
      if ( el && el.nodeName || el === window ) {
        el.addEventListener(type, fn, false);
      } else if (el && el.length) {
        filter(el, type, fn);
      }
    };
  }

  return function (el, type, fn) {
    if ( el && el.nodeName || el === window ) {
      el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
    } else if ( el && el.length ) {
      filter(el, type, fn);
    }
  };
})();

var search = (function () {
  var getItems = function () {
    return Array.prototype.slice.call(document.querySelectorAll('.sidebar__item')).map(function (item) {
      return {
        name:  item.dataset.name,
        type:  item.dataset.type,
        group: item.dataset.group,
        node:  item
      };
    });
  };

  var options = {
    keys: ['name', 'group'],
    threshold : 0.3
  };

  var items = getItems();
  var index = new Fuse(items, options);

  return index.search.bind(index);
})();


(function (search) {
  var searchForm = document.querySelector('#js-search');
  var searchInput = document.querySelector('#js-search-input');
  var searchSuggestions = document.querySelector('#js-search-suggestions');

  // focus it when page loads
  searchInput.focus();

  var selectionSet = false;
  var currentSelection = -1;
  var selected;
  var suggestions = [];
  var searchResultsVisible = false;

  var lockScroll = function() {
    // turn off default page scroll behavior for up/down arrow keys
    // so that it only helps to navigate the dropdown results
    $(document).on('keyup.ws-sassdoc', function(event) {
      if (event.keyCode === 40 || event.keyCode === 38) {
        event.preventDefault();
      }
    });

    searchResultsVisible = true;
  };

  var unlockScroll = function() {
    // re-enable page scroll
    $(document).off('keyup.ws-sassdoc');

    searchResultsVisible = false;
  };

  var fillSuggestions = function(items) {
    searchSuggestions.innerHTML = '';
    suggestions = items.slice(0, 15).map(function (item) {
      var li = document.createElement('li');

      li.dataset.type = item.type;
      li.dataset.name = item.name;
      li.innerHTML = '<a class="hitarea" href="#' + item.type + '-' + item.name + '"><code>' + item.type.slice(0, 3) + '</code> ' + item.name + '</a>';

      searchSuggestions.appendChild(li);
      return li;
    });

    if (items.length > 0) {
      lockScroll();

      // if no suggestion is already suggested, select the first one
      // so that if the user presses the enter key while focusing
      // the search input, something happens.
      if (!selectionSet) {
        selectionSet = true;
        currentSelection = 0;
        selectSuggestion();
      }
    } else {
      unlockScroll();
    }

  };

  var emptySuggestions = function() {
    fillSuggestions([]);
  };

  var selectSuggestion = function() {
    // de-select previously selected node
    if (selected) {
      selected.childNodes[0].classList.remove('js-focus');
    }

    // set new selection
    selected = suggestions[currentSelection];

    // focus selected node
    selected.childNodes[0].classList.add('js-focus');
  };

  var clickSuggestion = function(e) {
    if (selected) {
      selectionSet = false;
      emptySuggestions();
      searchInput.value = selected.dataset.name;
      window.location = selected.childNodes[0].href;
    }
  };

  var performSearch = function(term) {
    var result = search(term);
    fillSuggestions(result);
  };


  // ----------------------------------------------------
  //   EVENT REGISTRATIONS
  // ----------------------------------------------------

  // search options mutex
  $(document)
    .on('click', function(event) {
      if ($(event.target).closest('#js-search-suggestions').length < 1) {
        // click occurred outside the search suggestions dropdown
        $(searchForm).trigger('close.ws.search');
      }
    });

  $(searchSuggestions)
    .on('keyup', function (event) {
      if (event.keyCode === 13) {
        event.stopPropagation();
      }
    })
    .on('click', function (event) {
      if (event.target.nodeName === 'A') {
        // If the navbar is collapsed, and the navbar-collapse elem is open,
        // don't click the item below the search suggestion when suggestion is clicked
        event.stopImmediatePropagation();

        searchInput.value = event.target.parentNode.dataset.name;
        emptySuggestions();
      }
    });

  $(searchForm)
    .on('close.ws.search', function(event) {
      emptySuggestions();
    })
    .on('keyup', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      // Enter
      if (event.keyCode === 13) {
        clickSuggestion(event);
      }

      // KeyDown
      if (event.keyCode === 40) {
        currentSelection = (currentSelection + 1) % suggestions.length;
      }

      // KeyUp
      if (event.keyCode === 38) {
        currentSelection = currentSelection - 1;
        if (currentSelection < 0) {
          currentSelection =  suggestions.length - 1;
        }
      }

      if (suggestions[currentSelection]) {
        selectSuggestion();
      }

    });

  $(searchInput)
    .on('keyup', function (event) {
      // Enter key
      if (event.keyCode === 13) {
        clickSuggestion(e);

        // prevent enter key from submiting the form
        event.stopImmediatePropagation();
        event.preventDefault();
      }

      if (event.keyCode !== 40 && event.keyCode !== 38 && event.keyCode !== 13) {
        selectionSet = false;
        currentSelection = -1;
        performSearch(searchInput.value);
      } else {
        // prevent enter key from doing anything
        event.preventDefault();
      }
    })
    .on('click', function (event) {
      // if the user clicks the search input and there is a pre-existing query in it
      if (!searchResultsVisible && searchInput.value != '') {
        $(searchInput).trigger('search');
      }
    })
    .on('search', function () {
      performSearch(searchInput.value);
    });

})(search);


!function($) { $(function() {


  // -------------------------------------
  //   Highlight all `<code class="language-*">`
  //   that do not have data-prism-ignore attribute
  //   set to true
  // -------------------------------------
  // function prismHighlight() {
  //   var $prismHighlightElems = $('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');
  //   $.each($prismHighlightElems, function() {
  //     var $element = $(this);
  //     if (!$element.data('prism-ignore')) {
  //       Prism.highlightElement($element[0], false);
  //     }
  //   });
  // }
  // prismHighlight();

  $(document).on('click', '[data-code-collapse-control] .item__code-collapse-toggle-link', function(event) {
    $(this).parent('[data-code-collapse-control]').trigger('click');
  });

  $(document).on('click', '[data-code-collapse-control]', function(event) {
    var $this = $(this);
    var $codeParent = $this.closest('[data-code-collapse-parent]');
    var $codePreview = $('[data-code-type=preview]', $codeParent);
    var $codeFull = $('[data-code-type=full]', $codeParent);
    var $btnIcon = $('.item__code__controls-link__icon', $this);

    var currentState = $this.hasClass('active') ? 'expanded' : 'collapsed';

    function showFullCodeExample() {
      $codePreview.attr('aria-hidden', 'true');
      $codeFull.attr('aria-hidden', 'false');
      $codeParent.attr('data-showing-preview', 'false');
      $this.attr('title', 'Click to minimize this code example');
      $btnIcon
        .removeClass('icon-plus-sign')
        .addClass('icon-minus-sign')
        .attr('aria-label', 'Collapse');
    }

    function hideFullCodeExample() {
      $codePreview.attr('aria-hidden', 'false');
      $codeFull.attr('aria-hidden', 'true');
      $codeParent.attr('data-showing-preview', 'true');
      $this.attr('title', 'Click to view the rest of this code example');
      $btnIcon
        .removeClass('icon-minus-sign')
        .addClass('icon-plus-sign')
        .attr('aria-label', 'Expand');
    }

    if(currentState === 'expanded') {
      showFullCodeExample();
    } else {
      hideFullCodeExample();
    }
  });

});}(jQuery);
