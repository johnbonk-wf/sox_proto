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
