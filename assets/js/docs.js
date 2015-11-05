/**
 * -------------------------------------
 * Web Skin v1.3.0 Docs / Component Demo JS
 * ---
 * Do not ever include this in a Wdesk app.
 * These scripts are only used for 
 * the Web Skin docs.
 * ---
 * Copyright 2015 Workiva <https://github.com/Workiva>
 * -------------------------------------
 */

/*
    JavaScript utility functions used for Web Skin documentation
*/

!function($) { $(function() {
    $.getQueryVariable = function(variable) {
        if (window.location.search) {
            var query = window.location.search.substring(1);
            var vars = query.split('&');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (decodeURIComponent(pair[0]) == variable) {
                    return decodeURIComponent(pair[1]);
                }
            }
        } else if (window.history.state) {
            var queries = window.history.state;
            for (var query in queries) {
                if (query == variable) {
                    return decodeURIComponent(queries[query]).toString();
                }
            }
        } else {
            return null;
        }
        // console.log('Query variable %s not found', variable);
    }

    $.fn.serializeObject = function() {

        var o = {};

        if (typeof _ != 'function') {
            throw new Error('$.fn.serializeObject requires lodash.underscore.js');
        } else {
            var a = this.serializeArray();
            $.each(a, function() {
                if (o[this.name]) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
        }

        return o;
    };
});}(jQuery);

var compareObjects = function(obj1, obj2, _Q) {
    _Q = (_Q == undefined)? new Array : _Q;

    function size(obj) {
        var size = 0;
        for (var keyName in obj) {
            if (keyName != null) {
                size++;
            }
        }
        return size;
    }

    if (size(obj1) != size(obj2)) {
        //console.log('JSON compare - size not equal > '+keyName)
    }

    var newO2 = jQuery.extend(true, {}, obj2);

    for(var keyName in obj1) {
        var value1 = obj1[keyName],
            value2 = obj2[keyName],
            equal  = null;

        delete newO2[keyName];

        if (typeof value1 != typeof value2 && value2 == undefined) {
            _Q.push(['missing', keyName, value1, value2, obj1]);
        } else if (typeof value1 != typeof value2) {
            _Q.push(['diffType', keyName, value1, value2, obj1]);
        } else {
            // For jQuery objects:
            if (value1 && value1.length && (value1[0] !== undefined && value1[0].tagName)) {
                if (!value2 || value2.length != value1.length || !value2[0].tagName || value2[0].tagName != value1[0].tagName) {
                    _Q.push(['diffJqueryObj', keyName, value1, value2, obj1]);
                }
            } else if (value1 && value1.length && (value1.tagName !== value2.tagName)) {
                _Q.push(['diffHtmlObj', keyName, value1, value2, obj1]);
            } else if (typeof value1 == 'function' || typeof value2 == 'function') {
                _Q.push(['function', keyName, value1, value2, obj1]);
            } else if (typeof value1 == 'object') {
                equal = Arcadia.Utility.CompareJson(value1, value2, _Q);
            } else if (value1 != value2) {
                _Q.push(['diffValue', keyName, value1, value2, obj1]);
            }
        };
    }

    for(var keyName in newO2) {
        _Q.push(['new', keyName, obj1[keyName], newO2[keyName], newO2]);
    }

    return _Q;
}; // END compareObjects()

// Copyright (C) 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * @fileoverview
 * some functions for browser-side pretty printing of code contained in html.
 *
 * <p>
 * For a fairly comprehensive set of languages see the
 * <a href="http://google-code-prettify.googlecode.com/svn/trunk/README.html#langs">README</a>
 * file that came with this source.  At a minimum, the lexer should work on a
 * number of languages including C and friends, Java, Python, Bash, SQL, HTML,
 * XML, CSS, Javascript, and Makefiles.  It works passably on Ruby, PHP and Awk
 * and a subset of Perl, but, because of commenting conventions, doesn't work on
 * Smalltalk, Lisp-like, or CAML-like languages without an explicit lang class.
 * <p>
 * Usage: <ol>
 * <li> include this source file in an html page via
 *   {@code <script type="text/javascript" src="/path/to/prettify.js"></script>}
 * <li> define style rules.  See the example page for examples.
 * <li> mark the {@code <pre>} and {@code <code>} tags in your source with
 *    {@code class=prettyprint.}
 *    You can also use the (html deprecated) {@code <xmp>} tag, but the pretty
 *    printer needs to do more substantial DOM manipulations to support that, so
 *    some css styles may not be preserved.
 * </ol>
 * That's it.  I wanted to keep the API as simple as possible, so there's no
 * need to specify which language the code is in, but if you wish, you can add
 * another class to the {@code <pre>} or {@code <code>} element to specify the
 * language, as in {@code <pre class="prettyprint lang-java">}.  Any class that
 * starts with "lang-" followed by a file extension, specifies the file type.
 * See the "lang-*.js" files in this directory for code that implements
 * per-language file handlers.
 * <p>
 * Change log:<br>
 * cbeust, 2006/08/22
 * <blockquote>
 *   Java annotations (start with "@") are now captured as literals ("lit")
 * </blockquote>
 * @requires console
 */

// JSLint declarations
/*global console, document, navigator, setTimeout, window, define */

/** @define {boolean} */
var IN_GLOBAL_SCOPE = true;

/**
 * Split {@code prettyPrint} into multiple timeouts so as not to interfere with
 * UI events.
 * If set to {@code false}, {@code prettyPrint()} is synchronous.
 */
window['PR_SHOULD_USE_CONTINUATION'] = true;

/**
 * Pretty print a chunk of code.
 * @param {string} sourceCodeHtml The HTML to pretty print.
 * @param {string} opt_langExtension The language name to use.
 *     Typically, a filename extension like 'cpp' or 'java'.
 * @param {number|boolean} opt_numberLines True to number lines,
 *     or the 1-indexed number of the first line in sourceCodeHtml.
 * @return {string} code as html, but prettier
 */
var prettyPrintOne;
/**
 * Find all the {@code <pre>} and {@code <code>} tags in the DOM with
 * {@code class=prettyprint} and prettify them.
 *
 * @param {Function} opt_whenDone called when prettifying is done.
 * @param {HTMLElement|HTMLDocument} opt_root an element or document
 *   containing all the elements to pretty print.
 *   Defaults to {@code document.body}.
 */
var prettyPrint;


(function() {
  var win = window;
  // Keyword lists for various languages.
  // We use things that coerce to strings to make them compact when minified
  // and to defeat aggressive optimizers that fold large string constants.
  var FLOW_CONTROL_KEYWORDS = ["break,continue,do,else,for,if,return,while"];
  var C_KEYWORDS = [FLOW_CONTROL_KEYWORDS,"auto,case,char,const,default," +
      "double,enum,extern,float,goto,inline,int,long,register,short,signed," +
      "sizeof,static,struct,switch,typedef,union,unsigned,void,volatile"];
  var COMMON_KEYWORDS = [C_KEYWORDS,"catch,class,delete,false,import," +
      "new,operator,private,protected,public,this,throw,true,try,typeof"];
  var CPP_KEYWORDS = [COMMON_KEYWORDS,"alignof,align_union,asm,axiom,bool," +
      "concept,concept_map,const_cast,constexpr,decltype,delegate," +
      "dynamic_cast,explicit,export,friend,generic,late_check," +
      "mutable,namespace,nullptr,property,reinterpret_cast,static_assert," +
      "static_cast,template,typeid,typename,using,virtual,where"];
  var JAVA_KEYWORDS = [COMMON_KEYWORDS,
      "abstract,assert,boolean,byte,extends,final,finally,implements,import," +
      "instanceof,interface,null,native,package,strictfp,super,synchronized," +
      "throws,transient"];
  var CSHARP_KEYWORDS = [JAVA_KEYWORDS,
      "as,base,by,checked,decimal,delegate,descending,dynamic,event," +
      "fixed,foreach,from,group,implicit,in,internal,into,is,let," +
      "lock,object,out,override,orderby,params,partial,readonly,ref,sbyte," +
      "sealed,stackalloc,string,select,uint,ulong,unchecked,unsafe,ushort," +
      "var,virtual,where"];
  var COFFEE_KEYWORDS = "all,and,by,catch,class,else,extends,false,finally," +
      "for,if,in,is,isnt,loop,new,no,not,null,of,off,on,or,return,super,then," +
      "throw,true,try,unless,until,when,while,yes";
  var JSCRIPT_KEYWORDS = [COMMON_KEYWORDS,
      "debugger,eval,export,function,get,null,set,undefined,var,with," +
      "Infinity,NaN"];
  var PERL_KEYWORDS = "caller,delete,die,do,dump,elsif,eval,exit,foreach,for," +
      "goto,if,import,last,local,my,next,no,our,print,package,redo,require," +
      "sub,undef,unless,until,use,wantarray,while,BEGIN,END";
  var PYTHON_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "and,as,assert,class,def,del," +
      "elif,except,exec,finally,from,global,import,in,is,lambda," +
      "nonlocal,not,or,pass,print,raise,try,with,yield," +
      "False,True,None"];
  var RUBY_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "alias,and,begin,case,class," +
      "def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,redo," +
      "rescue,retry,self,super,then,true,undef,unless,until,when,yield," +
      "BEGIN,END"];
   var RUST_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "as,assert,const,copy,drop," +
      "enum,extern,fail,false,fn,impl,let,log,loop,match,mod,move,mut,priv," +
      "pub,pure,ref,self,static,struct,true,trait,type,unsafe,use"];
  var SH_KEYWORDS = [FLOW_CONTROL_KEYWORDS, "case,done,elif,esac,eval,fi," +
      "function,in,local,set,then,until"];
  var ALL_KEYWORDS = [
      CPP_KEYWORDS, CSHARP_KEYWORDS, JSCRIPT_KEYWORDS, PERL_KEYWORDS,
      PYTHON_KEYWORDS, RUBY_KEYWORDS, SH_KEYWORDS];
  var C_TYPES = /^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)\b/;

  // token style names.  correspond to css classes
  /**
   * token style for a string literal
   * @const
   */
  var PR_STRING = 'str';
  /**
   * token style for a keyword
   * @const
   */
  var PR_KEYWORD = 'kwd';
  /**
   * token style for a comment
   * @const
   */
  var PR_COMMENT = 'com';
  /**
   * token style for a type
   * @const
   */
  var PR_TYPE = 'typ';
  /**
   * token style for a literal value.  e.g. 1, null, true.
   * @const
   */
  var PR_LITERAL = 'lit';
  /**
   * token style for a punctuation string.
   * @const
   */
  var PR_PUNCTUATION = 'pun';
  /**
   * token style for plain text.
   * @const
   */
  var PR_PLAIN = 'pln';

  /**
   * token style for an sgml tag.
   * @const
   */
  var PR_TAG = 'tag';
  /**
   * token style for a markup declaration such as a DOCTYPE.
   * @const
   */
  var PR_DECLARATION = 'dec';
  /**
   * token style for embedded source.
   * @const
   */
  var PR_SOURCE = 'src';
  /**
   * token style for an sgml attribute name.
   * @const
   */
  var PR_ATTRIB_NAME = 'atn';
  /**
   * token style for an sgml attribute value.
   * @const
   */
  var PR_ATTRIB_VALUE = 'atv';

  /**
   * A class that indicates a section of markup that is not code, e.g. to allow
   * embedding of line numbers within code listings.
   * @const
   */
  var PR_NOCODE = 'nocode';



  /**
   * A set of tokens that can precede a regular expression literal in
   * javascript
   * http://web.archive.org/web/20070717142515/http://www.mozilla.org/js/language/js20/rationale/syntax.html
   * has the full list, but I've removed ones that might be problematic when
   * seen in languages that don't support regular expression literals.
   *
   * <p>Specifically, I've removed any keywords that can't precede a regexp
   * literal in a syntactically legal javascript program, and I've removed the
   * "in" keyword since it's not a keyword in many languages, and might be used
   * as a count of inches.
   *
   * <p>The link above does not accurately describe EcmaScript rules since
   * it fails to distinguish between (a=++/b/i) and (a++/b/i) but it works
   * very well in practice.
   *
   * @private
   * @const
   */
  var REGEXP_PRECEDER_PATTERN = '(?:^^\\.?|[+-]|[!=]=?=?|\\#|%=?|&&?=?|\\(|\\*=?|[+\\-]=|->|\\/=?|::?|<<?=?|>>?>?=?|,|;|\\?|@|\\[|~|{|\\^\\^?=?|\\|\\|?=?|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\\s*';

  // CAVEAT: this does not properly handle the case where a regular
  // expression immediately follows another since a regular expression may
  // have flags for case-sensitivity and the like.  Having regexp tokens
  // adjacent is not valid in any language I'm aware of, so I'm punting.
  // TODO: maybe style special characters inside a regexp as punctuation.

  /**
   * Given a group of {@link RegExp}s, returns a {@code RegExp} that globally
   * matches the union of the sets of strings matched by the input RegExp.
   * Since it matches globally, if the input strings have a start-of-input
   * anchor (/^.../), it is ignored for the purposes of unioning.
   * @param {Array.<RegExp>} regexs non multiline, non-global regexs.
   * @return {RegExp} a global regex.
   */
  function combinePrefixPatterns(regexs) {
    var capturedGroupIndex = 0;

    var needToFoldCase = false;
    var ignoreCase = false;
    for (var i = 0, n = regexs.length; i < n; ++i) {
      var regex = regexs[i];
      if (regex.ignoreCase) {
        ignoreCase = true;
      } else if (/[a-z]/i.test(regex.source.replace(
                     /\\u[0-9a-f]{4}|\\x[0-9a-f]{2}|\\[^ux]/gi, ''))) {
        needToFoldCase = true;
        ignoreCase = false;
        break;
      }
    }

    var escapeCharToCodeUnit = {
      'b': 8,
      't': 9,
      'n': 0xa,
      'v': 0xb,
      'f': 0xc,
      'r': 0xd
    };

    function decodeEscape(charsetPart) {
      var cc0 = charsetPart.charCodeAt(0);
      if (cc0 !== 92 /* \\ */) {
        return cc0;
      }
      var c1 = charsetPart.charAt(1);
      cc0 = escapeCharToCodeUnit[c1];
      if (cc0) {
        return cc0;
      } else if ('0' <= c1 && c1 <= '7') {
        return parseInt(charsetPart.substring(1), 8);
      } else if (c1 === 'u' || c1 === 'x') {
        return parseInt(charsetPart.substring(2), 16);
      } else {
        return charsetPart.charCodeAt(1);
      }
    }

    function encodeEscape(charCode) {
      if (charCode < 0x20) {
        return (charCode < 0x10 ? '\\x0' : '\\x') + charCode.toString(16);
      }
      var ch = String.fromCharCode(charCode);
      return (ch === '\\' || ch === '-' || ch === ']' || ch === '^')
          ? "\\" + ch : ch;
    }

    function caseFoldCharset(charSet) {
      var charsetParts = charSet.substring(1, charSet.length - 1).match(
          new RegExp(
              '\\\\u[0-9A-Fa-f]{4}'
              + '|\\\\x[0-9A-Fa-f]{2}'
              + '|\\\\[0-3][0-7]{0,2}'
              + '|\\\\[0-7]{1,2}'
              + '|\\\\[\\s\\S]'
              + '|-'
              + '|[^-\\\\]',
              'g'));
      var ranges = [];
      var inverse = charsetParts[0] === '^';

      var out = ['['];
      if (inverse) { out.push('^'); }

      for (var i = inverse ? 1 : 0, n = charsetParts.length; i < n; ++i) {
        var p = charsetParts[i];
        if (/\\[bdsw]/i.test(p)) {  // Don't muck with named groups.
          out.push(p);
        } else {
          var start = decodeEscape(p);
          var end;
          if (i + 2 < n && '-' === charsetParts[i + 1]) {
            end = decodeEscape(charsetParts[i + 2]);
            i += 2;
          } else {
            end = start;
          }
          ranges.push([start, end]);
          // If the range might intersect letters, then expand it.
          // This case handling is too simplistic.
          // It does not deal with non-latin case folding.
          // It works for latin source code identifiers though.
          if (!(end < 65 || start > 122)) {
            if (!(end < 65 || start > 90)) {
              ranges.push([Math.max(65, start) | 32, Math.min(end, 90) | 32]);
            }
            if (!(end < 97 || start > 122)) {
              ranges.push([Math.max(97, start) & ~32, Math.min(end, 122) & ~32]);
            }
          }
        }
      }

      // [[1, 10], [3, 4], [8, 12], [14, 14], [16, 16], [17, 17]]
      // -> [[1, 12], [14, 14], [16, 17]]
      ranges.sort(function(a, b) { return (a[0] - b[0]) || (b[1]  - a[1]); });
      var consolidatedRanges = [];
      var lastRange = [];
      for (var i = 0; i < ranges.length; ++i) {
        var range = ranges[i];
        if (range[0] <= lastRange[1] + 1) {
          lastRange[1] = Math.max(lastRange[1], range[1]);
        } else {
          consolidatedRanges.push(lastRange = range);
        }
      }

      for (var i = 0; i < consolidatedRanges.length; ++i) {
        var range = consolidatedRanges[i];
        out.push(encodeEscape(range[0]));
        if (range[1] > range[0]) {
          if (range[1] + 1 > range[0]) { out.push('-'); }
          out.push(encodeEscape(range[1]));
        }
      }
      out.push(']');
      return out.join('');
    }

    function allowAnywhereFoldCaseAndRenumberGroups(regex) {
      // Split into character sets, escape sequences, punctuation strings
      // like ('(', '(?:', ')', '^'), and runs of characters that do not
      // include any of the above.
      var parts = regex.source.match(
          new RegExp(
              '(?:'
              + '\\[(?:[^\\x5C\\x5D]|\\\\[\\s\\S])*\\]'  // a character set
              + '|\\\\u[A-Fa-f0-9]{4}'  // a unicode escape
              + '|\\\\x[A-Fa-f0-9]{2}'  // a hex escape
              + '|\\\\[0-9]+'  // a back-reference or octal escape
              + '|\\\\[^ux0-9]'  // other escape sequence
              + '|\\(\\?[:!=]'  // start of a non-capturing group
              + '|[\\(\\)\\^]'  // start/end of a group, or line start
              + '|[^\\x5B\\x5C\\(\\)\\^]+'  // run of other characters
              + ')',
              'g'));
      var n = parts.length;

      // Maps captured group numbers to the number they will occupy in
      // the output or to -1 if that has not been determined, or to
      // undefined if they need not be capturing in the output.
      var capturedGroups = [];

      // Walk over and identify back references to build the capturedGroups
      // mapping.
      for (var i = 0, groupIndex = 0; i < n; ++i) {
        var p = parts[i];
        if (p === '(') {
          // groups are 1-indexed, so max group index is count of '('
          ++groupIndex;
        } else if ('\\' === p.charAt(0)) {
          var decimalValue = +p.substring(1);
          if (decimalValue) {
            if (decimalValue <= groupIndex) {
              capturedGroups[decimalValue] = -1;
            } else {
              // Replace with an unambiguous escape sequence so that
              // an octal escape sequence does not turn into a backreference
              // to a capturing group from an earlier regex.
              parts[i] = encodeEscape(decimalValue);
            }
          }
        }
      }

      // Renumber groups and reduce capturing groups to non-capturing groups
      // where possible.
      for (var i = 1; i < capturedGroups.length; ++i) {
        if (-1 === capturedGroups[i]) {
          capturedGroups[i] = ++capturedGroupIndex;
        }
      }
      for (var i = 0, groupIndex = 0; i < n; ++i) {
        var p = parts[i];
        if (p === '(') {
          ++groupIndex;
          if (!capturedGroups[groupIndex]) {
            parts[i] = '(?:';
          }
        } else if ('\\' === p.charAt(0)) {
          var decimalValue = +p.substring(1);
          if (decimalValue && decimalValue <= groupIndex) {
            parts[i] = '\\' + capturedGroups[decimalValue];
          }
        }
      }

      // Remove any prefix anchors so that the output will match anywhere.
      // ^^ really does mean an anchored match though.
      for (var i = 0; i < n; ++i) {
        if ('^' === parts[i] && '^' !== parts[i + 1]) { parts[i] = ''; }
      }

      // Expand letters to groups to handle mixing of case-sensitive and
      // case-insensitive patterns if necessary.
      if (regex.ignoreCase && needToFoldCase) {
        for (var i = 0; i < n; ++i) {
          var p = parts[i];
          var ch0 = p.charAt(0);
          if (p.length >= 2 && ch0 === '[') {
            parts[i] = caseFoldCharset(p);
          } else if (ch0 !== '\\') {
            // TODO: handle letters in numeric escapes.
            parts[i] = p.replace(
                /[a-zA-Z]/g,
                function(ch) {
                  var cc = ch.charCodeAt(0);
                  return '[' + String.fromCharCode(cc & ~32, cc | 32) + ']';
                });
          }
        }
      }

      return parts.join('');
    }

    var rewritten = [];
    for (var i = 0, n = regexs.length; i < n; ++i) {
      var regex = regexs[i];
      if (regex.global || regex.multiline) { throw new Error('' + regex); }
      rewritten.push(
          '(?:' + allowAnywhereFoldCaseAndRenumberGroups(regex) + ')');
    }

    return new RegExp(rewritten.join('|'), ignoreCase ? 'gi' : 'g');
  }

  /**
   * Split markup into a string of source code and an array mapping ranges in
   * that string to the text nodes in which they appear.
   *
   * <p>
   * The HTML DOM structure:</p>
   * <pre>
   * (Element   "p"
   *   (Element "b"
   *     (Text  "print "))       ; #1
   *   (Text    "'Hello '")      ; #2
   *   (Element "br")            ; #3
   *   (Text    "  + 'World';")) ; #4
   * </pre>
   * <p>
   * corresponds to the HTML
   * {@code <p><b>print </b>'Hello '<br>  + 'World';</p>}.</p>
   *
   * <p>
   * It will produce the output:</p>
   * <pre>
   * {
   *   sourceCode: "print 'Hello '\n  + 'World';",
   *   //                     1          2
   *   //           012345678901234 5678901234567
   *   spans: [0, #1, 6, #2, 14, #3, 15, #4]
   * }
   * </pre>
   * <p>
   * where #1 is a reference to the {@code "print "} text node above, and so
   * on for the other text nodes.
   * </p>
   *
   * <p>
   * The {@code} spans array is an array of pairs.  Even elements are the start
   * indices of substrings, and odd elements are the text nodes (or BR elements)
   * that contain the text for those substrings.
   * Substrings continue until the next index or the end of the source.
   * </p>
   *
   * @param {Node} node an HTML DOM subtree containing source-code.
   * @param {boolean} isPreformatted true if white-space in text nodes should
   *    be considered significant.
   * @return {Object} source code and the text nodes in which they occur.
   */
  function extractSourceSpans(node, isPreformatted) {
    var nocode = /(?:^|\s)nocode(?:\s|$)/;

    var chunks = [];
    var length = 0;
    var spans = [];
    var k = 0;

    function walk(node) {
      var type = node.nodeType;
      if (type == 1) {  // Element
        if (nocode.test(node.className)) { return; }
        for (var child = node.firstChild; child; child = child.nextSibling) {
          walk(child);
        }
        var nodeName = node.nodeName.toLowerCase();
        if ('br' === nodeName || 'li' === nodeName) {
          chunks[k] = '\n';
          spans[k << 1] = length++;
          spans[(k++ << 1) | 1] = node;
        }
      } else if (type == 3 || type == 4) {  // Text
        var text = node.nodeValue;
        if (text.length) {
          if (!isPreformatted) {
            text = text.replace(/[ \t\r\n]+/g, ' ');
          } else {
            text = text.replace(/\r\n?/g, '\n');  // Normalize newlines.
          }
          // TODO: handle tabs here?
          chunks[k] = text;
          spans[k << 1] = length;
          length += text.length;
          spans[(k++ << 1) | 1] = node;
        }
      }
    }

    walk(node);

    return {
      sourceCode: chunks.join('').replace(/\n$/, ''),
      spans: spans
    };
  }

  /**
   * Apply the given language handler to sourceCode and add the resulting
   * decorations to out.
   * @param {number} basePos the index of sourceCode within the chunk of source
   *    whose decorations are already present on out.
   */
  function appendDecorations(basePos, sourceCode, langHandler, out) {
    if (!sourceCode) { return; }
    var job = {
      sourceCode: sourceCode,
      basePos: basePos
    };
    langHandler(job);
    out.push.apply(out, job.decorations);
  }

  var notWs = /\S/;

  /**
   * Given an element, if it contains only one child element and any text nodes
   * it contains contain only space characters, return the sole child element.
   * Otherwise returns undefined.
   * <p>
   * This is meant to return the CODE element in {@code <pre><code ...>} when
   * there is a single child element that contains all the non-space textual
   * content, but not to return anything where there are multiple child elements
   * as in {@code <pre><code>...</code><code>...</code></pre>} or when there
   * is textual content.
   */
  function childContentWrapper(element) {
    var wrapper = undefined;
    for (var c = element.firstChild; c; c = c.nextSibling) {
      var type = c.nodeType;
      wrapper = (type === 1)  // Element Node
          ? (wrapper ? element : c)
          : (type === 3)  // Text Node
          ? (notWs.test(c.nodeValue) ? element : wrapper)
          : wrapper;
    }
    return wrapper === element ? undefined : wrapper;
  }

  /** Given triples of [style, pattern, context] returns a lexing function,
    * The lexing function interprets the patterns to find token boundaries and
    * returns a decoration list of the form
    * [index_0, style_0, index_1, style_1, ..., index_n, style_n]
    * where index_n is an index into the sourceCode, and style_n is a style
    * constant like PR_PLAIN.  index_n-1 <= index_n, and style_n-1 applies to
    * all characters in sourceCode[index_n-1:index_n].
    *
    * The stylePatterns is a list whose elements have the form
    * [style : string, pattern : RegExp, DEPRECATED, shortcut : string].
    *
    * Style is a style constant like PR_PLAIN, or can be a string of the
    * form 'lang-FOO', where FOO is a language extension describing the
    * language of the portion of the token in $1 after pattern executes.
    * E.g., if style is 'lang-lisp', and group 1 contains the text
    * '(hello (world))', then that portion of the token will be passed to the
    * registered lisp handler for formatting.
    * The text before and after group 1 will be restyled using this decorator
    * so decorators should take care that this doesn't result in infinite
    * recursion.  For example, the HTML lexer rule for SCRIPT elements looks
    * something like ['lang-js', /<[s]cript>(.+?)<\/script>/].  This may match
    * '<script>foo()<\/script>', which would cause the current decorator to
    * be called with '<script>' which would not match the same rule since
    * group 1 must not be empty, so it would be instead styled as PR_TAG by
    * the generic tag rule.  The handler registered for the 'js' extension would
    * then be called with 'foo()', and finally, the current decorator would
    * be called with '<\/script>' which would not match the original rule and
    * so the generic tag rule would identify it as a tag.
    *
    * Pattern must only match prefixes, and if it matches a prefix, then that
    * match is considered a token with the same style.
    *
    * Context is applied to the last non-whitespace, non-comment token
    * recognized.
    *
    * Shortcut is an optional string of characters, any of which, if the first
    * character, gurantee that this pattern and only this pattern matches.
    *
    * @param {Array} shortcutStylePatterns patterns that always start with
    *   a known character.  Must have a shortcut string.
    * @param {Array} fallthroughStylePatterns patterns that will be tried in
    *   order if the shortcut ones fail.  May have shortcuts.
    *
    * @return {function(Object)} a
    *   function that takes source code and returns a list of decorations.
    */
  function createSimpleLexer(shortcutStylePatterns, fallthroughStylePatterns) {
    var shortcuts = {};
    var tokenizer;
    (function() {
      var allPatterns = shortcutStylePatterns.concat(fallthroughStylePatterns);
      var allRegexs = [];
      var regexKeys = {};
      for (var i = 0, n = allPatterns.length; i < n; ++i) {
        var patternParts = allPatterns[i];
        var shortcutChars = patternParts[3];
        if (shortcutChars) {
          for (var c = shortcutChars.length; --c >= 0;) {
            shortcuts[shortcutChars.charAt(c)] = patternParts;
          }
        }
        var regex = patternParts[1];
        var k = '' + regex;
        if (!regexKeys.hasOwnProperty(k)) {
          allRegexs.push(regex);
          regexKeys[k] = null;
        }
      }
      allRegexs.push(/[\0-\uffff]/);
      tokenizer = combinePrefixPatterns(allRegexs);
    })();

    var nPatterns = fallthroughStylePatterns.length;

    /**
     * Lexes job.sourceCode and produces an output array job.decorations of
     * style classes preceded by the position at which they start in
     * job.sourceCode in order.
     *
     * @param {Object} job an object like <pre>{
     *    sourceCode: {string} sourceText plain text,
     *    basePos: {int} position of job.sourceCode in the larger chunk of
     *        sourceCode.
     * }</pre>
     */
    var decorate = function(job) {
      var sourceCode = job.sourceCode, basePos = job.basePos;
      /** Even entries are positions in source in ascending order.  Odd enties
        * are style markers (e.g., PR_COMMENT) that run from that position until
        * the end.
        * @type {Array.<number|string>}
        */
      var decorations = [basePos, PR_PLAIN];
      var pos = 0;  // index into sourceCode
      var tokens = sourceCode.match(tokenizer) || [];
      var styleCache = {};

      for (var ti = 0, nTokens = tokens.length; ti < nTokens; ++ti) {
        var token = tokens[ti];
        var style = styleCache[token];
        var match = void 0;

        var isEmbedded;
        if (typeof style === 'string') {
          isEmbedded = false;
        } else {
          var patternParts = shortcuts[token.charAt(0)];
          if (patternParts) {
            match = token.match(patternParts[1]);
            style = patternParts[0];
          } else {
            for (var i = 0; i < nPatterns; ++i) {
              patternParts = fallthroughStylePatterns[i];
              match = token.match(patternParts[1]);
              if (match) {
                style = patternParts[0];
                break;
              }
            }

            if (!match) {  // make sure that we make progress
              style = PR_PLAIN;
            }
          }

          isEmbedded = style.length >= 5 && 'lang-' === style.substring(0, 5);
          if (isEmbedded && !(match && typeof match[1] === 'string')) {
            isEmbedded = false;
            style = PR_SOURCE;
          }

          if (!isEmbedded) { styleCache[token] = style; }
        }

        var tokenStart = pos;
        pos += token.length;

        if (!isEmbedded) {
          decorations.push(basePos + tokenStart, style);
        } else {  // Treat group 1 as an embedded block of source code.
          var embeddedSource = match[1];
          var embeddedSourceStart = token.indexOf(embeddedSource);
          var embeddedSourceEnd = embeddedSourceStart + embeddedSource.length;
          if (match[2]) {
            // If embeddedSource can be blank, then it would match at the
            // beginning which would cause us to infinitely recurse on the
            // entire token, so we catch the right context in match[2].
            embeddedSourceEnd = token.length - match[2].length;
            embeddedSourceStart = embeddedSourceEnd - embeddedSource.length;
          }
          var lang = style.substring(5);
          // Decorate the left of the embedded source
          appendDecorations(
              basePos + tokenStart,
              token.substring(0, embeddedSourceStart),
              decorate, decorations);
          // Decorate the embedded source
          appendDecorations(
              basePos + tokenStart + embeddedSourceStart,
              embeddedSource,
              langHandlerForExtension(lang, embeddedSource),
              decorations);
          // Decorate the right of the embedded section
          appendDecorations(
              basePos + tokenStart + embeddedSourceEnd,
              token.substring(embeddedSourceEnd),
              decorate, decorations);
        }
      }
      job.decorations = decorations;
    };
    return decorate;
  }

  /** returns a function that produces a list of decorations from source text.
    *
    * This code treats ", ', and ` as string delimiters, and \ as a string
    * escape.  It does not recognize perl's qq() style strings.
    * It has no special handling for double delimiter escapes as in basic, or
    * the tripled delimiters used in python, but should work on those regardless
    * although in those cases a single string literal may be broken up into
    * multiple adjacent string literals.
    *
    * It recognizes C, C++, and shell style comments.
    *
    * @param {Object} options a set of optional parameters.
    * @return {function(Object)} a function that examines the source code
    *     in the input job and builds the decoration list.
    */
  function sourceDecorator(options) {
    var shortcutStylePatterns = [], fallthroughStylePatterns = [];
    if (options['tripleQuotedStrings']) {
      // '''multi-line-string''', 'single-line-string', and double-quoted
      shortcutStylePatterns.push(
          [PR_STRING,  /^(?:\'\'\'(?:[^\'\\]|\\[\s\S]|\'{1,2}(?=[^\']))*(?:\'\'\'|$)|\"\"\"(?:[^\"\\]|\\[\s\S]|\"{1,2}(?=[^\"]))*(?:\"\"\"|$)|\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$))/,
           null, '\'"']);
    } else if (options['multiLineStrings']) {
      // 'multi-line-string', "multi-line-string"
      shortcutStylePatterns.push(
          [PR_STRING,  /^(?:\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$)|\`(?:[^\\\`]|\\[\s\S])*(?:\`|$))/,
           null, '\'"`']);
    } else {
      // 'single-line-string', "single-line-string"
      shortcutStylePatterns.push(
          [PR_STRING,
           /^(?:\'(?:[^\\\'\r\n]|\\.)*(?:\'|$)|\"(?:[^\\\"\r\n]|\\.)*(?:\"|$))/,
           null, '"\'']);
    }
    if (options['verbatimStrings']) {
      // verbatim-string-literal production from the C# grammar.  See issue 93.
      fallthroughStylePatterns.push(
          [PR_STRING, /^@\"(?:[^\"]|\"\")*(?:\"|$)/, null]);
    }
    var hc = options['hashComments'];
    if (hc) {
      if (options['cStyleComments']) {
        if (hc > 1) {  // multiline hash comments
          shortcutStylePatterns.push(
              [PR_COMMENT, /^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/, null, '#']);
        } else {
          // Stop C preprocessor declarations at an unclosed open comment
          shortcutStylePatterns.push(
              [PR_COMMENT, /^#(?:(?:define|e(?:l|nd)if|else|error|ifn?def|include|line|pragma|undef|warning)\b|[^\r\n]*)/,
               null, '#']);
        }
        // #include <stdio.h>
        fallthroughStylePatterns.push(
            [PR_STRING,
             /^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h(?:h|pp|\+\+)?|[a-z]\w*)>/,
             null]);
      } else {
        shortcutStylePatterns.push([PR_COMMENT, /^#[^\r\n]*/, null, '#']);
      }
    }
    if (options['cStyleComments']) {
      fallthroughStylePatterns.push([PR_COMMENT, /^\/\/[^\r\n]*/, null]);
      fallthroughStylePatterns.push(
          [PR_COMMENT, /^\/\*[\s\S]*?(?:\*\/|$)/, null]);
    }
    if (options['regexLiterals']) {
      /**
       * @const
       */
      var REGEX_LITERAL = (
          // A regular expression literal starts with a slash that is
          // not followed by * or / so that it is not confused with
          // comments.
          '/(?=[^/*])'
          // and then contains any number of raw characters,
          + '(?:[^/\\x5B\\x5C]'
          // escape sequences (\x5C),
          +    '|\\x5C[\\s\\S]'
          // or non-nesting character sets (\x5B\x5D);
          +    '|\\x5B(?:[^\\x5C\\x5D]|\\x5C[\\s\\S])*(?:\\x5D|$))+'
          // finally closed by a /.
          + '/');
      fallthroughStylePatterns.push(
          ['lang-regex',
           new RegExp('^' + REGEXP_PRECEDER_PATTERN + '(' + REGEX_LITERAL + ')')
           ]);
    }

    var types = options['types'];
    if (types) {
      fallthroughStylePatterns.push([PR_TYPE, types]);
    }

    var keywords = ("" + options['keywords']).replace(/^ | $/g, '');
    if (keywords.length) {
      fallthroughStylePatterns.push(
          [PR_KEYWORD,
           new RegExp('^(?:' + keywords.replace(/[\s,]+/g, '|') + ')\\b'),
           null]);
    }

    shortcutStylePatterns.push([PR_PLAIN,       /^\s+/, null, ' \r\n\t\xA0']);

    var punctuation =
      // The Bash man page says

      // A word is a sequence of characters considered as a single
      // unit by GRUB. Words are separated by metacharacters,
      // which are the following plus space, tab, and newline: { }
      // | & $ ; < >
      // ...

      // A word beginning with # causes that word and all remaining
      // characters on that line to be ignored.

      // which means that only a '#' after /(?:^|[{}|&$;<>\s])/ starts a
      // comment but empirically
      // $ echo {#}
      // {#}
      // $ echo \$#
      // $#
      // $ echo }#
      // }#

      // so /(?:^|[|&;<>\s])/ is more appropriate.

      // http://gcc.gnu.org/onlinedocs/gcc-2.95.3/cpp_1.html#SEC3
      // suggests that this definition is compatible with a
      // default mode that tries to use a single token definition
      // to recognize both bash/python style comments and C
      // preprocessor directives.

      // This definition of punctuation does not include # in the list of
      // follow-on exclusions, so # will not be broken before if preceeded
      // by a punctuation character.  We could try to exclude # after
      // [|&;<>] but that doesn't seem to cause many major problems.
      // If that does turn out to be a problem, we should change the below
      // when hc is truthy to include # in the run of punctuation characters
      // only when not followint [|&;<>].
      /^.[^\s\w\.$@\'\"\`\/\\]*/;

    fallthroughStylePatterns.push(
        // TODO(mikesamuel): recognize non-latin letters and numerals in idents
        [PR_LITERAL,     /^@[a-z_$][a-z_$@0-9]*/i, null],
        [PR_TYPE,        /^(?:[@_]?[A-Z]+[a-z][A-Za-z_$@0-9]*|\w+_t\b)/, null],
        [PR_PLAIN,       /^[a-z_$][a-z_$@0-9]*/i, null],
        [PR_LITERAL,
         new RegExp(
             '^(?:'
             // A hex number
             + '0x[a-f0-9]+'
             // or an octal or decimal number,
             + '|(?:\\d(?:_\\d+)*\\d*(?:\\.\\d*)?|\\.\\d\\+)'
             // possibly in scientific notation
             + '(?:e[+\\-]?\\d+)?'
             + ')'
             // with an optional modifier like UL for unsigned long
             + '[a-z]*', 'i'),
         null, '0123456789'],
        // Don't treat escaped quotes in bash as starting strings.  See issue 144.
        [PR_PLAIN,       /^\\[\s\S]?/, null],
        [PR_PUNCTUATION, punctuation, null]);

    return createSimpleLexer(shortcutStylePatterns, fallthroughStylePatterns);
  }

  var decorateSource = sourceDecorator({
        'keywords': ALL_KEYWORDS,
        'hashComments': true,
        'cStyleComments': true,
        'multiLineStrings': true,
        'regexLiterals': true
      });

  /**
   * Given a DOM subtree, wraps it in a list, and puts each line into its own
   * list item.
   *
   * @param {Node} node modified in place.  Its content is pulled into an
   *     HTMLOListElement, and each line is moved into a separate list item.
   *     This requires cloning elements, so the input might not have unique
   *     IDs after numbering.
   * @param {boolean} isPreformatted true iff white-space in text nodes should
   *     be treated as significant.
   */
  function numberLines(node, opt_startLineNum, isPreformatted) {
    var nocode = /(?:^|\s)nocode(?:\s|$)/;
    var lineBreak = /\r\n?|\n/;

    var document = node.ownerDocument;

    var li = document.createElement('li');
    while (node.firstChild) {
      li.appendChild(node.firstChild);
    }
    // An array of lines.  We split below, so this is initialized to one
    // un-split line.
    var listItems = [li];

    function walk(node) {
      var type = node.nodeType;
      if (type == 1 && !nocode.test(node.className)) {  // Element
        if ('br' === node.nodeName) {
          breakAfter(node);
          // Discard the <BR> since it is now flush against a </LI>.
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        } else {
          for (var child = node.firstChild; child; child = child.nextSibling) {
            walk(child);
          }
        }
      } else if ((type == 3 || type == 4) && isPreformatted) {  // Text
        var text = node.nodeValue;
        var match = text.match(lineBreak);
        if (match) {
          var firstLine = text.substring(0, match.index);
          node.nodeValue = firstLine;
          var tail = text.substring(match.index + match[0].length);
          if (tail) {
            var parent = node.parentNode;
            parent.insertBefore(
              document.createTextNode(tail), node.nextSibling);
          }
          breakAfter(node);
          if (!firstLine) {
            // Don't leave blank text nodes in the DOM.
            node.parentNode.removeChild(node);
          }
        }
      }
    }

    // Split a line after the given node.
    function breakAfter(lineEndNode) {
      // If there's nothing to the right, then we can skip ending the line
      // here, and move root-wards since splitting just before an end-tag
      // would require us to create a bunch of empty copies.
      while (!lineEndNode.nextSibling) {
        lineEndNode = lineEndNode.parentNode;
        if (!lineEndNode) { return; }
      }

      function breakLeftOf(limit, copy) {
        // Clone shallowly if this node needs to be on both sides of the break.
        var rightSide = copy ? limit.cloneNode(false) : limit;
        var parent = limit.parentNode;
        if (parent) {
          // We clone the parent chain.
          // This helps us resurrect important styling elements that cross lines.
          // E.g. in <i>Foo<br>Bar</i>
          // should be rewritten to <li><i>Foo</i></li><li><i>Bar</i></li>.
          var parentClone = breakLeftOf(parent, 1);
          // Move the clone and everything to the right of the original
          // onto the cloned parent.
          var next = limit.nextSibling;
          parentClone.appendChild(rightSide);
          for (var sibling = next; sibling; sibling = next) {
            next = sibling.nextSibling;
            parentClone.appendChild(sibling);
          }
        }
        return rightSide;
      }

      var copiedListItem = breakLeftOf(lineEndNode.nextSibling, 0);

      // Walk the parent chain until we reach an unattached LI.
      for (var parent;
           // Check nodeType since IE invents document fragments.
           (parent = copiedListItem.parentNode) && parent.nodeType === 1;) {
        copiedListItem = parent;
      }
      // Put it on the list of lines for later processing.
      listItems.push(copiedListItem);
    }

    // Split lines while there are lines left to split.
    for (var i = 0;  // Number of lines that have been split so far.
         i < listItems.length;  // length updated by breakAfter calls.
         ++i) {
      walk(listItems[i]);
    }

    // Make sure numeric indices show correctly.
    if (opt_startLineNum === (opt_startLineNum|0)) {
      listItems[0].setAttribute('value', opt_startLineNum);
    }

    var ol = document.createElement('ol');
    ol.className = 'linenums';
    var offset = Math.max(0, ((opt_startLineNum - 1 /* zero index */)) | 0) || 0;
    for (var i = 0, n = listItems.length; i < n; ++i) {
      li = listItems[i];
      // Stick a class on the LIs so that stylesheets can
      // color odd/even rows, or any other row pattern that
      // is co-prime with 10.
      li.className = 'L' + ((i + offset) % 10);
      if (!li.firstChild) {
        li.appendChild(document.createTextNode('\xA0'));
      }
      ol.appendChild(li);
    }

    node.appendChild(ol);
  }
  /**
   * Breaks {@code job.sourceCode} around style boundaries in
   * {@code job.decorations} and modifies {@code job.sourceNode} in place.
   * @param {Object} job like <pre>{
   *    sourceCode: {string} source as plain text,
   *    spans: {Array.<number|Node>} alternating span start indices into source
   *       and the text node or element (e.g. {@code <BR>}) corresponding to that
   *       span.
   *    decorations: {Array.<number|string} an array of style classes preceded
   *       by the position at which they start in job.sourceCode in order
   * }</pre>
   * @private
   */
  function recombineTagsAndDecorations(job) {
    var isIE8OrEarlier = /\bMSIE\s(\d+)/.exec(navigator.userAgent);
    isIE8OrEarlier = isIE8OrEarlier && +isIE8OrEarlier[1] <= 8;
    var newlineRe = /\n/g;

    var source = job.sourceCode;
    var sourceLength = source.length;
    // Index into source after the last code-unit recombined.
    var sourceIndex = 0;

    var spans = job.spans;
    var nSpans = spans.length;
    // Index into spans after the last span which ends at or before sourceIndex.
    var spanIndex = 0;

    var decorations = job.decorations;
    var nDecorations = decorations.length;
    // Index into decorations after the last decoration which ends at or before
    // sourceIndex.
    var decorationIndex = 0;

    // Remove all zero-length decorations.
    decorations[nDecorations] = sourceLength;
    var decPos, i;
    for (i = decPos = 0; i < nDecorations;) {
      if (decorations[i] !== decorations[i + 2]) {
        decorations[decPos++] = decorations[i++];
        decorations[decPos++] = decorations[i++];
      } else {
        i += 2;
      }
    }
    nDecorations = decPos;

    // Simplify decorations.
    for (i = decPos = 0; i < nDecorations;) {
      var startPos = decorations[i];
      // Conflate all adjacent decorations that use the same style.
      var startDec = decorations[i + 1];
      var end = i + 2;
      while (end + 2 <= nDecorations && decorations[end + 1] === startDec) {
        end += 2;
      }
      decorations[decPos++] = startPos;
      decorations[decPos++] = startDec;
      i = end;
    }

    nDecorations = decorations.length = decPos;

    var sourceNode = job.sourceNode;
    var oldDisplay;
    if (sourceNode) {
      oldDisplay = sourceNode.style.display;
      sourceNode.style.display = 'none';
    }
    try {
      var decoration = null;
      while (spanIndex < nSpans) {
        var spanStart = spans[spanIndex];
        var spanEnd = spans[spanIndex + 2] || sourceLength;

        var decEnd = decorations[decorationIndex + 2] || sourceLength;

        var end = Math.min(spanEnd, decEnd);

        var textNode = spans[spanIndex + 1];
        var styledText;
        if (textNode.nodeType !== 1  // Don't muck with <BR>s or <LI>s
            // Don't introduce spans around empty text nodes.
            && (styledText = source.substring(sourceIndex, end))) {
          // This may seem bizarre, and it is.  Emitting LF on IE causes the
          // code to display with spaces instead of line breaks.
          // Emitting Windows standard issue linebreaks (CRLF) causes a blank
          // space to appear at the beginning of every line but the first.
          // Emitting an old Mac OS 9 line separator makes everything spiffy.
          if (isIE8OrEarlier) {
            styledText = styledText.replace(newlineRe, '\r');
          }
          textNode.nodeValue = styledText;
          var document = textNode.ownerDocument;
          var span = document.createElement('span');
          span.className = decorations[decorationIndex + 1];
          var parentNode = textNode.parentNode;
          parentNode.replaceChild(span, textNode);
          span.appendChild(textNode);
          if (sourceIndex < spanEnd) {  // Split off a text node.
            spans[spanIndex + 1] = textNode
                // TODO: Possibly optimize by using '' if there's no flicker.
                = document.createTextNode(source.substring(end, spanEnd));
            parentNode.insertBefore(textNode, span.nextSibling);
          }
        }

        sourceIndex = end;

        if (sourceIndex >= spanEnd) {
          spanIndex += 2;
        }
        if (sourceIndex >= decEnd) {
          decorationIndex += 2;
        }
      }
    } finally {
      if (sourceNode) {
        sourceNode.style.display = oldDisplay;
      }
    }
  }

  /** Maps language-specific file extensions to handlers. */
  var langHandlerRegistry = {};
  /** Register a language handler for the given file extensions.
    * @param {function(Object)} handler a function from source code to a list
    *      of decorations.  Takes a single argument job which describes the
    *      state of the computation.   The single parameter has the form
    *      {@code {
    *        sourceCode: {string} as plain text.
    *        decorations: {Array.<number|string>} an array of style classes
    *                     preceded by the position at which they start in
    *                     job.sourceCode in order.
    *                     The language handler should assigned this field.
    *        basePos: {int} the position of source in the larger source chunk.
    *                 All positions in the output decorations array are relative
    *                 to the larger source chunk.
    *      } }
    * @param {Array.<string>} fileExtensions
    */
  function registerLangHandler(handler, fileExtensions) {
    for (var i = fileExtensions.length; --i >= 0;) {
      var ext = fileExtensions[i];
      if (!langHandlerRegistry.hasOwnProperty(ext)) {
        langHandlerRegistry[ext] = handler;
      } else if (win['console']) {
        console['warn']('cannot override language handler %s', ext);
      }
    }
  }
  function langHandlerForExtension(extension, source) {
    if (!(extension && langHandlerRegistry.hasOwnProperty(extension))) {
      // Treat it as markup if the first non whitespace character is a < and
      // the last non-whitespace character is a >.
      extension = /^\s*</.test(source)
          ? 'default-markup'
          : 'default-code';
    }
    return langHandlerRegistry[extension];
  }
  registerLangHandler(decorateSource, ['default-code']);
  registerLangHandler(
      createSimpleLexer(
          [],
          [
           [PR_PLAIN,       /^[^<?]+/],
           [PR_DECLARATION, /^<!\w[^>]*(?:>|$)/],
           [PR_COMMENT,     /^<\!--[\s\S]*?(?:-\->|$)/],
           // Unescaped content in an unknown language
           ['lang-',        /^<\?([\s\S]+?)(?:\?>|$)/],
           ['lang-',        /^<%([\s\S]+?)(?:%>|$)/],
           [PR_PUNCTUATION, /^(?:<[%?]|[%?]>)/],
           ['lang-',        /^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i],
           // Unescaped content in javascript.  (Or possibly vbscript).
           ['lang-js',      /^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],
           // Contains unescaped stylesheet content
           ['lang-css',     /^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i],
           ['lang-in.tag',  /^(<\/?[a-z][^<>]*>)/i]
          ]),
      ['default-markup', 'htm', 'html', 'mxml', 'xhtml', 'xml', 'xsl']);
  registerLangHandler(
      createSimpleLexer(
          [
           [PR_PLAIN,        /^[\s]+/, null, ' \t\r\n'],
           [PR_ATTRIB_VALUE, /^(?:\"[^\"]*\"?|\'[^\']*\'?)/, null, '\"\'']
           ],
          [
           [PR_TAG,          /^^<\/?[a-z](?:[\w.:-]*\w)?|\/?>$/i],
           [PR_ATTRIB_NAME,  /^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i],
           ['lang-uq.val',   /^=\s*([^>\'\"\s]*(?:[^>\'\"\s\/]|\/(?=\s)))/],
           [PR_PUNCTUATION,  /^[=<>\/]+/],
           ['lang-js',       /^on\w+\s*=\s*\"([^\"]+)\"/i],
           ['lang-js',       /^on\w+\s*=\s*\'([^\']+)\'/i],
           ['lang-js',       /^on\w+\s*=\s*([^\"\'>\s]+)/i],
           ['lang-css',      /^style\s*=\s*\"([^\"]+)\"/i],
           ['lang-css',      /^style\s*=\s*\'([^\']+)\'/i],
           ['lang-css',      /^style\s*=\s*([^\"\'>\s]+)/i]
           ]),
      ['in.tag']);
  registerLangHandler(
      createSimpleLexer([], [[PR_ATTRIB_VALUE, /^[\s\S]+/]]), ['uq.val']);
  registerLangHandler(sourceDecorator({
          'keywords': CPP_KEYWORDS,
          'hashComments': true,
          'cStyleComments': true,
          'types': C_TYPES
        }), ['c', 'cc', 'cpp', 'cxx', 'cyc', 'm']);
  registerLangHandler(sourceDecorator({
          'keywords': 'null,true,false'
        }), ['json']);
  registerLangHandler(sourceDecorator({
          'keywords': CSHARP_KEYWORDS,
          'hashComments': true,
          'cStyleComments': true,
          'verbatimStrings': true,
          'types': C_TYPES
        }), ['cs']);
  registerLangHandler(sourceDecorator({
          'keywords': JAVA_KEYWORDS,
          'cStyleComments': true
        }), ['java']);
  registerLangHandler(sourceDecorator({
          'keywords': SH_KEYWORDS,
          'hashComments': true,
          'multiLineStrings': true
        }), ['bash', 'bsh', 'csh', 'sh']);
  registerLangHandler(sourceDecorator({
          'keywords': PYTHON_KEYWORDS,
          'hashComments': true,
          'multiLineStrings': true,
          'tripleQuotedStrings': true
        }), ['cv', 'py', 'python']);
  registerLangHandler(sourceDecorator({
          'keywords': PERL_KEYWORDS,
          'hashComments': true,
          'multiLineStrings': true,
          'regexLiterals': true
        }), ['perl', 'pl', 'pm']);
  registerLangHandler(sourceDecorator({
          'keywords': RUBY_KEYWORDS,
          'hashComments': true,
          'multiLineStrings': true,
          'regexLiterals': true
        }), ['rb', 'ruby']);
  registerLangHandler(sourceDecorator({
          'keywords': JSCRIPT_KEYWORDS,
          'cStyleComments': true,
          'regexLiterals': true
        }), ['javascript', 'js']);
  registerLangHandler(sourceDecorator({
          'keywords': COFFEE_KEYWORDS,
          'hashComments': 3,  // ### style block comments
          'cStyleComments': true,
          'multilineStrings': true,
          'tripleQuotedStrings': true,
          'regexLiterals': true
        }), ['coffee']);
  registerLangHandler(sourceDecorator({
          'keywords': RUST_KEYWORDS,
          'cStyleComments': true,
          'multilineStrings': true
        }), ['rc', 'rs', 'rust']);
  registerLangHandler(
      createSimpleLexer([], [[PR_STRING, /^[\s\S]+/]]), ['regex']);

  function applyDecorator(job) {
    var opt_langExtension = job.langExtension;

    try {
      // Extract tags, and convert the source code to plain text.
      var sourceAndSpans = extractSourceSpans(job.sourceNode, job.pre);
      /** Plain text. @type {string} */
      var source = sourceAndSpans.sourceCode;
      job.sourceCode = source;
      job.spans = sourceAndSpans.spans;
      job.basePos = 0;

      // Apply the appropriate language handler
      langHandlerForExtension(opt_langExtension, source)(job);

      // Integrate the decorations and tags back into the source code,
      // modifying the sourceNode in place.
      recombineTagsAndDecorations(job);
    } catch (e) {
      if (win['console']) {
        console['log'](e && e['stack'] ? e['stack'] : e);
      }
    }
  }

  /**
   * Pretty print a chunk of code.
   * @param sourceCodeHtml {string} The HTML to pretty print.
   * @param opt_langExtension {string} The language name to use.
   *     Typically, a filename extension like 'cpp' or 'java'.
   * @param opt_numberLines {number|boolean} True to number lines,
   *     or the 1-indexed number of the first line in sourceCodeHtml.
   */
  function $prettyPrintOne(sourceCodeHtml, opt_langExtension, opt_numberLines) {
    var container = document.createElement('div');
    // This could cause images to load and onload listeners to fire.
    // E.g. <img onerror="alert(1337)" src="nosuchimage.png">.
    // We assume that the inner HTML is from a trusted source.
    // The pre-tag is required for IE8 which strips newlines from innerHTML
    // when it is injected into a <pre> tag.
    // http://stackoverflow.com/questions/451486/pre-tag-loses-line-breaks-when-setting-innerhtml-in-ie
    // http://stackoverflow.com/questions/195363/inserting-a-newline-into-a-pre-tag-ie-javascript
    container.innerHTML = '<pre>' + sourceCodeHtml + '</pre>';
    container = container.firstChild;
    if (opt_numberLines) {
      numberLines(container, opt_numberLines, true);
    }

    var job = {
      langExtension: opt_langExtension,
      numberLines: opt_numberLines,
      sourceNode: container,
      pre: 1
    };
    applyDecorator(job);
    return container.innerHTML;
  }

   /**
    * Find all the {@code <pre>} and {@code <code>} tags in the DOM with
    * {@code class=prettyprint} and prettify them.
    *
    * @param {Function} opt_whenDone called when prettifying is done.
    * @param {HTMLElement|HTMLDocument} opt_root an element or document
    *   containing all the elements to pretty print.
    *   Defaults to {@code document.body}.
    */
  function $prettyPrint(opt_whenDone, opt_root) {
    var root = opt_root || document.body;
    var doc = root.ownerDocument || document;
    function byTagName(tn) { return root.getElementsByTagName(tn); }
    // fetch a list of nodes to rewrite
    var codeSegments = [byTagName('pre'), byTagName('code'), byTagName('xmp')];
    var elements = [];
    for (var i = 0; i < codeSegments.length; ++i) {
      for (var j = 0, n = codeSegments[i].length; j < n; ++j) {
        elements.push(codeSegments[i][j]);
      }
    }
    codeSegments = null;

    var clock = Date;
    if (!clock['now']) {
      clock = { 'now': function() { return +(new Date); } };
    }

    // The loop is broken into a series of continuations to make sure that we
    // don't make the browser unresponsive when rewriting a large page.
    var k = 0;
    var prettyPrintingJob;

    var langExtensionRe = /\blang(?:uage)?-([\w.]+)(?!\S)/;
    var prettyPrintRe = /\bprettyprint\b/;
    var prettyPrintedRe = /\bprettyprinted\b/;
    var preformattedTagNameRe = /pre|xmp/i;
    var codeRe = /^code$/i;
    var preCodeXmpRe = /^(?:pre|code|xmp)$/i;

    function doWork() {
      var endTime = (win['PR_SHOULD_USE_CONTINUATION'] ?
                     clock['now']() + 250 /* ms */ :
                     Infinity);
      for (; k < elements.length && clock['now']() < endTime; k++) {
        var cs = elements[k];
        var className = cs.className;
        if (prettyPrintRe.test(className)
            // Don't redo this if we've already done it.
            // This allows recalling pretty print to just prettyprint elements
            // that have been added to the page since last call.
            && !prettyPrintedRe.test(className)) {

          // make sure this is not nested in an already prettified element
          var nested = false;
          for (var p = cs.parentNode; p; p = p.parentNode) {
            var tn = p.tagName;
            if (preCodeXmpRe.test(tn)
                && p.className && prettyPrintRe.test(p.className)) {
              nested = true;
              break;
            }
          }
          if (!nested) {
            // Mark done.  If we fail to prettyprint for whatever reason,
            // we shouldn't try again.
            cs.className += ' prettyprinted';

            // If the classes includes a language extensions, use it.
            // Language extensions can be specified like
            //     <pre class="prettyprint lang-cpp">
            // the language extension "cpp" is used to find a language handler
            // as passed to PR.registerLangHandler.
            // HTML5 recommends that a language be specified using "language-"
            // as the prefix instead.  Google Code Prettify supports both.
            // http://dev.w3.org/html5/spec-author-view/the-code-element.html
            var langExtension = className.match(langExtensionRe);
            // Support <pre class="prettyprint"><code class="language-c">
            var wrapper;
            if (!langExtension && (wrapper = childContentWrapper(cs))
                && codeRe.test(wrapper.tagName)) {
              langExtension = wrapper.className.match(langExtensionRe);
            }

            if (langExtension) { langExtension = langExtension[1]; }

            var preformatted;
            if (preformattedTagNameRe.test(cs.tagName)) {
              preformatted = 1;
            } else {
              var currentStyle = cs['currentStyle'];
              var defaultView = doc.defaultView;
              var whitespace = (
                  currentStyle
                  ? currentStyle['whiteSpace']
                  : (defaultView
                     && defaultView.getComputedStyle)
                  ? defaultView.getComputedStyle(cs, null)
                  .getPropertyValue('white-space')
                  : 0);
              preformatted = whitespace
                  && 'pre' === whitespace.substring(0, 3);
            }

            // Look for a class like linenums or linenums:<n> where <n> is the
            // 1-indexed number of the first line.
            var lineNums = cs.className.match(/\blinenums\b(?::(\d+))?/);
            lineNums = lineNums
                ? lineNums[1] && lineNums[1].length ? +lineNums[1] : true
                : false;
            if (lineNums) { numberLines(cs, lineNums, preformatted); }

            // do the pretty printing
            prettyPrintingJob = {
              langExtension: langExtension,
              sourceNode: cs,
              numberLines: lineNums,
              pre: preformatted
            };
            applyDecorator(prettyPrintingJob);
          }
        }
      }
      if (k < elements.length) {
        // finish up in a continuation
        setTimeout(doWork, 250);
      } else if ('function' === typeof opt_whenDone) {
        opt_whenDone();
      }
    }

    doWork();
  }

  /**
   * Contains functions for creating and registering new language handlers.
   * @type {Object}
   */
  var PR = win['PR'] = {
        'createSimpleLexer': createSimpleLexer,
        'registerLangHandler': registerLangHandler,
        'sourceDecorator': sourceDecorator,
        'PR_ATTRIB_NAME': PR_ATTRIB_NAME,
        'PR_ATTRIB_VALUE': PR_ATTRIB_VALUE,
        'PR_COMMENT': PR_COMMENT,
        'PR_DECLARATION': PR_DECLARATION,
        'PR_KEYWORD': PR_KEYWORD,
        'PR_LITERAL': PR_LITERAL,
        'PR_NOCODE': PR_NOCODE,
        'PR_PLAIN': PR_PLAIN,
        'PR_PUNCTUATION': PR_PUNCTUATION,
        'PR_SOURCE': PR_SOURCE,
        'PR_STRING': PR_STRING,
        'PR_TAG': PR_TAG,
        'PR_TYPE': PR_TYPE,
        'prettyPrintOne':
           IN_GLOBAL_SCOPE
             ? (win['prettyPrintOne'] = $prettyPrintOne)
             : (prettyPrintOne = $prettyPrintOne),
        'prettyPrint': prettyPrint =
           IN_GLOBAL_SCOPE
             ? (win['prettyPrint'] = $prettyPrint)
             : (prettyPrint = $prettyPrint)
      };

  // Make PR available via the Asynchronous Module Definition (AMD) API.
  // Per https://github.com/amdjs/amdjs-api/wiki/AMD:
  // The Asynchronous Module Definition (AMD) API specifies a
  // mechanism for defining modules such that the module and its
  // dependencies can be asynchronously loaded.
  // ...
  // To allow a clear indicator that a global define function(as
  // needed for script src browser loading) conforms to the AMD API,
  // any global define function SHOULD have a property called "amd"
  // whose value is an object. This helps avoid conflict with any
  // other existing JavaScript code that could have defined a define()
  // function that does not conform to the AMD API.
  if (typeof define === "function" && define['amd']) {
    define("google-code-prettify", [], function() {
      return PR;
    });
  }
})();

/**
 * jQuery flexText: Auto-height textareas
 * --------------------------------------
 * Requires: jQuery 1.7+
 * Usage example: $('textarea').flexText()
 * Info: https://github.com/alexdunphy/flexText
 */
;(function ($) {

    // Constructor
    function FT(elem) {
        this.$textarea = $(elem);

        this._init();
    }

    FT.prototype = {
        _init: function () {
            var _this = this;

            // Insert wrapper elem & pre/span for textarea mirroring
            this.$textarea.wrap('<div class="flex-text-wrap" />').before('<pre><span /><br /></pre>');

            this.$span = this.$textarea.prev().find('span');

            // Add input event listeners
            // * input for modern browsers
            // * propertychange for IE 7 & 8
            // * keyup for IE >= 9: catches keyboard-triggered undos/cuts/deletes
            // * change for IE >= 9: catches mouse-triggered undos/cuts/deletions (when textarea loses focus)
            this.$textarea.on('input propertychange keyup change', function () {
                _this._mirror();
            });

            // jQuery val() strips carriage return chars by default (see http://api.jquery.com/val/)
            // This causes issues in IE7, but a valHook can be used to preserve these chars
            $.valHooks.textarea = {
                get: function (elem) {
                    return elem.value.replace(/\r?\n/g, "\r\n");
                }
            };

            // Mirror contents once on init
            this._mirror();
        }

        // Mirror pre/span & textarea contents
        ,_mirror: function () {
            this.$span.text(this.$textarea.val());
        }
    };

    // jQuery plugin wrapper
    $.fn.flexText = function () {
        return this.each(function () {
            // Check if already instantiated on this elem
            if (!$.data(this, 'flexText')) {
                // Instantiate & store elem + string
                $.data(this, 'flexText', new FT(this));
            }
        });
    };

})(jQuery);
(function($,sr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function(func, threshold, execAsap) {
      var timeout;

      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          };

          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
      };
  }
  // smartresize
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');


(function($,sscr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function(func, threshold, execAsap) {
      var timeout;

      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          };

          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
      };
  }
  // smartscroll
  jQuery.fn[sscr] = function(fn){  return fn ? this.bind('scroll', debounce(fn)) : this.trigger(sscr); };

})(jQuery,'smartscroll');
/*!
* jQuery Plugin to use Local Storage or Session Storage without worrying
* about HTML5 support. It uses Cookies for backward compatibility.
*
* https://github.com/artberri/jquery-html5storage
*
* @author Alberto Varela Sánchez (http://www.berriart.com)
* @version 1.0 (17th January 2013)
*
* Released under the MIT License (http://opensource.org/licenses/MIT)
*
* Copyright (c) 2013 Alberto Varela Sánchez (alberto@berriart.com)
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

;(function(window, $ ) {
    "use strict";

    var types = ['localStorage','sessionStorage'],
        support = [];

    $.each(types, function( i, type ) {
        try {
            support[type] = type in window && window[type] !== null;
        } catch (e) {
            support[type] = false;
        }

        $[type] = {
            settings : {
                cookiePrefix : 'html5fallback:' + type + ':',
                cookieOptions : {
                    path : '/',
                    domain : document.domain,
                    expires : ('localStorage' === type) ? { expires: 365 } : undefined
                }
            },

            getItem : function( key ) {
                var response = null;
                if (support[type]) {
                    response = window[type].getItem(key);
                }
                else {
                    try {
                        response = $.cookie(this.settings.cookiePrefix + key);
                    } catch(e) {
                        // cookies not supported / enabled
                    }
                }

                return response;
            },

            setItem : function( key, value ) {
                var response = null;
                if (support[type]) {
                    response = window[type].setItem(key, value);
                }
                else {
                    try {
                        response = $.cookie(this.settings.cookiePrefix + key, value, this.settings.cookieOptions);
                    } catch(e) {
                        // cookies not supported / enabled
                    }
                }

                return response;
            },

            removeItem : function( key ) {
                if (support[type]) {
                    return window[type].removeItem(key);
                }
                else {
                    var options = $.extend(this.settings.cookieOptions, {
                        expires: -1
                    });
                    var response = null;
                    try {
                        response = $.cookie(this.settings.cookiePrefix + key, null, options);
                    } catch(e) {
                        // cookies not supported / enabled
                    }
                    return response;
                }
            },

            clear : function() {
                if (support[type]) {
                    return window[type].clear();
                }
                else {
                    var reg = new RegExp('^' + this.settings.cookiePrefix, ''),
                        options = $.extend(this.settings.cookieOptions, {
                            expires: -1
                        });

                    try {
                        if (document.cookie && document.cookie !== ''){
                            $.each(document.cookie.split(';'), function( i, cookie ){
                                if (reg.test(cookie = $.trim(cookie))) {
                                     $.cookie( cookie.substr(0,cookie.indexOf('=')), null, options);
                                }
                            });
                        }
                    } catch(e) {
                        // cookies not supported / enabled
                    }
                }
            }
        };
    });

})(window, jQuery);
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

// NOTICE!! DO NOT USE ANY OF THIS JAVASCRIPT
// IT'S ALL JUST JUNK FOR OUR DOCS!
// ++++++++++++++++++++++++++++++++++++++++++

var scrollspyOffset  = 0;
var scrollHereOffset = 0;

!function($) { $(function() {

    var $window = $(window);
    var $document = $(document);
    var $body   = $(document.body);
    var $html   = $body.find('html');

    var currentHash = document.location.hash;

    var _client = $.client;
    var isIE    = _client.browser == 'IE';
    var browserVersion = parseInt(_client.version);
    var gtIE8  = !isIE || (isIE && browserVersion > 8);

    var viewportHeight;
    var viewportWidth;

    var scrollSpyInitialized = false;
    var scrollSpyElemClass  = '.ws-sidebar';
    var $scrollSpyContentElem = $('#ws-body-block');
    var scrollOffsetMethod  = 'offset';
    var $sidenavWrapper     = $(scrollSpyElemClass);
    var $sidenav            = $('.ws-sidenav');
    var $sidenavFirstElem   = $sidenav.find('li:not(.parent-item):not(.divider):first');
    var $navbar             = $('.ws-navbar');
    var $footer             = $('.ws-footer');
    var headingMargin       = -40;

    var navHeight           = false;
    var sideBarMargin       = false;

    // for testing
    var testingNavRibbon    = false;
    var navRibbonHeight     = testingNavRibbon ? 60 : 0;

    // which elems do we need to start animations on when they come into view?
    var $animatedElems = $('.progress-spinner, .progress-bar');
    var $overviewSection = $('#overview-section');
    var $lblsBadgeSection = $('#labels-badges-section');
    var $navSection = $('#nav-section');
    var $formSection = $('#forms-section');
    var $tableSection = $('#tables-section');
    var $gridSection = $('#grid-section');
    var $iconSection = $('#icons-section');
    var $spinnerSection = $('#progress-section');
    var $jsButtonSection = $('#buttons-section.js-buttons');
    var $jsCollapseSection = $('#collapse-section');
    var $popoverSection = $('#popovers-section');
    var $panelSection = $('#panels-section');
    var $datepickerSection = $('#datepicker-section');
    var $helpersSection = $('#helper-classes-section');
    var $colorPaletteSection = $('#color-palette-section');
    var $extendingSassSection = $('#extending-with-sass-section');
    var $inputmaskSection = $('#inputmask-section');
    var $clickToEditSection = $('#click-to-edit-section');

    // PERIPHERALS
    var $commentsSection = $('#comments-section');
    var $navListTreeSection = $('#list-group-tree-section');

    var queryStringAdded = false;

    //----------------------------------------------
    //+ GLOBAL DOCS HELPER METHODS
    //  (READY AND WILLING)
    //----------------------------------------------
        function getViewportHeight() {
            return Math.max(document.documentElement.clientHeight || window.innerHeight || 0);
        }

        function getViewportWidth() {
            return Math.max(document.documentElement.clientWidth || window.innerWidth || 0);
        }

        function filterIconsBySet() {
            var iconSetName = $.getQueryVariable('iconset');
            if (iconSetName) {
                $.selectFilterableGroup(iconSetName);
            }
        }

        function checkQueryString() {
            filterIconsBySet();
        }

        // there is a query string...
        // if you need to do something with it... now's the time.
        if (window.location.search) {
            checkQueryString();
        }

        function addQueryString(qs) {
            queryStringAdded = true;
            var queries = qs.split(';');
            var stateObjects = {};

            for (var i = 0; i < queries.length; i++) {
                var query = queries[i];
                var queryPair = query.split(':');
                var qsVar = queryPair[0];
                var qsVarValue = queryPair[1];
                var stateObject = {};
                stateObject[qsVar] = qsVarValue;
                stateObjects = $.extend(stateObjects, stateObject);
            }

            replaceState(null, stateObjects);
        }

        //
        //
        //

        function getActiveViewingSection() {
            var $activeSidenavElem = $sidenav.find('.active');
            var $activeChildren = $activeSidenavElem.find('.nav').children('.active');
            var numActiveChildren = $activeChildren && $activeChildren.length;
            var $innerMostActiveChild = numActiveChildren > 0 ? $($activeChildren[numActiveChildren - 1]) : $activeSidenavElem;
            return $innerMostActiveChild.find(' > [href]').attr('href');
        }

        function pushState(newHash, query) {
            query = query || history.state;

            if (newHash) {
                newHash = newHash.lastIndexOf('#') > -1 ? newHash : '#' + newHash;
                // console.log('pushing history state: ' + newHash);
                history.pushState && history.pushState(query, null, document.location.pathname + newHash);
            } else {
                history.pushState && history.pushState(query, null, document.location.pathname);
            }

            if (query) {
                checkQueryString();
            }
        }

        function replaceState(newHash, query) {
            query = query || history.state;
            var stateHash = newHash ? '#' + newHash : document.location.hash;

            if (!newHash && !query) {
                // its a scrollspy refresh, update scroll position to current active sidenav loc
                var activeHref = getActiveViewingSection();
                scrollHere(activeHref);
            } else {
                pushState(stateHash, query);
            }
        }

        function getAffixOffset() {
            // measurement helpers
            sideBarMargin        = sideBarMargin || parseInt($sidenav.css('margin-top'), 10);
            navHeight            = navHeight || $navbar.outerHeight(true) + navRibbonHeight;
            var parentScrollTop  = $scrollSpyContentElem[0].scrollTop;
            var sideBarOffsetTop = $sidenav.offset().top;

            //
            // If the user is actively scrolling downward as the affix plugin initializes,
            // and they have scrolled beyond the offset where we want to affix the sidenav
            // we have to subtract the amount of the scroll so that the affix plugin will
            // still "pin" the nav when the user scrolls back to the top.
            //
            if (parentScrollTop > Math.abs(sideBarOffsetTop)) {
                sideBarOffsetTop = parentScrollTop - Math.abs(sideBarOffsetTop);
            }

            return sideBarOffsetTop - navHeight - sideBarMargin;
        }

        function getScrollspyOffset() {
            sideBarMargin        = sideBarMargin || parseInt($sidenav.css('margin-top'), 10);
            navHeight            = navHeight || $navbar.outerHeight(true) + navRibbonHeight;
            scrollspyOffset      = scrollspyOffset !== 0 ? scrollspyOffset : navHeight + sideBarMargin + headingMargin;
            scrollHereOffset     = sideBarMargin > 0 ? (scrollspyOffset - sideBarMargin) : scrollspyOffset;
            return scrollspyOffset;
        }

        function stripHash() {
            return location.pathname + location.search;
        }

        function toTitleCase(str) {
            return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        }

        function scrollHere(href, offset, ev) {
            if (!href) {
                return;
            }

            var userTriggeredScroll = offset ? true : false;
            offset = offset || scrollHereOffset;

            var target          = href,
                $target         = $(target),
                targetExists    = $target.length,
                cleanLoc        = stripHash(),
                hash            = target.replace('#', ''),
                hashTitle       = hash.replace(/-/g, ' '),
                gaPage          = cleanLoc.replace('/index.html', '/') + hash,
                fullLocation    = window.location.protocol + '//' + window.location.hostname + gaPage;

            // if the browser supports HTML5 history... permalink their location
            if (history.pushState) {
                ev && ev.preventDefault(); // prevent browser scroll if history.replaceState works
            }

            if (targetExists) {
                var newScrollPosition = $target[scrollOffsetMethod]().top + offset + $scrollSpyContentElem[0].scrollTop;
                $scrollSpyContentElem.scrollTop(newScrollPosition);

                if (userTriggeredScroll) {
                    pushState('#' + hash);
                    try {
                        // track this as a pageview
                        ga('set', 'title', toTitleCase(hashTitle) + ' · ' + document.title);
                        ga('set', 'location', fullLocation);
                        ga('send', 'pageview');
                    } catch(e) {
                        // something went wrong with ga
                    }
                }
            } else {
                // there is no elem with this ID on the page.
                console.log('ERROR: function scrollHere(' + href + ', ' + offset + '): No elem with id = ' + target + ' found.');
            }
        }

        function selectAllNodeText($elems) {
            return $elems.each(function() {
                $(this).on('click', function(event) {
                    var range,
                        sel,
                        node = event.target;

                    range = document.createRange();
                    range.selectNodeContents(node);

                    sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                });
            });
        }

        // data-api for selectAllNodeText
        $(document).on('click.wdesk.selectAllNodeText', '[data-select-node-text-on-click]', function(event) {
            selectAllNodeText($(event.target));
        });
    // -------------------------

    //----------------------------------------------
    //+ CORE INITIALIZATIONS
    //  (FIRST BEFORE ANY DEMO JS)
    //----------------------------------------------

        // Make sure top navigation links don't take the user out of
        // a full screen app experience if thats what they are in
        if (('standalone' in window.navigator) && window.navigator.standalone) {
            $document.on('click', 'a', function(e) {
                var $this = $(this);
                e.preventDefault();
                var newLocation = $this.attr('href');
                if (newLocation !== undefined && newLocation.substr(0, 1) != '#' && $this.attr('data-method') === undefined) {
                    window.location = newLocation;
                }
            });
        }


        // DOCUMENTATION OPTIONS CONFIGURATION
        // -------------------------
        function initializeDocsJsOptions() {

            typeof console !== 'undefined' && debugMethodOrder && console.log('initializeDocsJsOptions(begin)');

            // boolean localStorage var we'll use to keep track of
            // whether or not we have stored any option data for them
            var optsStored = 'docs-opts-stored';

            // button that triggers the options menu
            var $optMenuBtn = $('.ws-navbar [data-toggle=options]');

            // form where we control these options
            var $optionsForm = $('#docs-options form');
            var $listOptions = $optionsForm.find('select[data-option-key]');
            var $boolOptions = $optionsForm.find('input[type=checkbox][data-option-key]');
            // CSS class prefix we use to modify DOM element visibility
            // .{optionClassPrefix}{optionsKeys[key]}-on|off
            var optionClassPrefix = 'docs-opts-';
            // currently, no class is added to $body if option is turned ON, so we only need to store the suffix used if OFF
            var optionClassSuffix = '-off';

            // named vars showing equivalence between state of DOM
            // and how we save the option to localStorage
            var checked = 'true';
            var unchecked = 'false';
            var noselection = '';


            // HELPER METHODS
            // -------------------------

            var _getStoredOptionName = function(key) {
                return optionClassPrefix + key;
            };

            var _getDomOptionClassName = function(key) {
                return _getStoredOptionName(key) + optionClassSuffix;
            };

            var _getStoredItem = function(key) {
                return $.localStorage.getItem(key);
            };

            var _setStoredItem = function(key, value) {
                var gaScriptAsyncDelay = 1000;
                var gaScriptAsyncDelayMsg = 'Google Analytics async still has not completed after a ' + gaScriptAsyncDelay + 'ms delay... no docs options tracked.';

                // Update GA custom dimensions/metrics
                if (key !== optsStored) {
                    // try to fix async timing issues on pages
                    // that don't take long to load content (like landing page)
                    if (typeof ga !== 'undefined') {
                        _trackStoredOption(key, value);
                    } else {
                        setTimeout(function() {
                            if (typeof ga !== 'undefined') {
                                _trackStoredOption(key, value);
                            } else {
                                console.log(gaScriptAsyncDelayMsg);
                            }
                        }, gaScriptAsyncDelay);
                    }
                }

                // Send GA event ONLY if something has changed
                if (value !== _getStoredItem(key)) {
                    if (typeof ga !== 'undefined') {
                        _trackStoredOptionEvent(key, value);
                    } else {
                        setTimeout(function() {
                            if (typeof ga !== 'undefined') {
                                _trackStoredOptionEvent(key, value);
                            } else {
                                console.log(gaScriptAsyncDelayMsg);
                            }
                        }, gaScriptAsyncDelay);
                    }
                }

                $.localStorage.setItem(key, value);
            };

            var _trackStoredOptionEvent = function(key, value) {
                ga('send', 'event', 'Set Option(s)', key, value);
            };

            var _trackStoredOption = function(key, value) {
                // Associate Options with GA custom dimensions
                // http://bit.ly/18iD0l6
                //
                // NOTE: If you add an option to navbar-docs-options.html
                // you MUST add it to the docsOptions array below in the INDEX that
                // matches the INDEX within the Analytics Property.
                // -------------------------
                var optPrefix = optionClassPrefix;
                var docsOptions = [
                    optPrefix + 'user-type'      // ga dimension1
                  , optPrefix + 'code'           // ga dimension2
                  , optPrefix + 'code-snippets'  // ga dimension3
                  , optPrefix + 'design-assets'  // ga dimension4
                  , optPrefix + 'code-angularjs' // ga dimension5
                  , optPrefix + 'device-type'    // ga dimension6
                  , optPrefix + 'device-touch'   // ga dimension7
                  , optPrefix + 'device-mouse'   // ga dimension8
                  , optPrefix + 'design-notes'   // ga dimension9
                  , optPrefix + 'dev-notes',     // ga dimension10
                  , optPrefix + 'dart'           // no custom dimension, but no warning should be logged.
                ];

                if (value !== '' && typeof value !== 'undefined') {
                    var gaDimIndex = docsOptions.indexOf(key);
                    var gaDimKey;

                    // Set dimension IF its defined in our array
                    if (gaDimIndex > -1) {
                        gaDimKey = 'dimension' + (gaDimIndex + 1);
                        ga('set', gaDimKey, value);
                    } else {
                        console.warn('Key "' + key + '" not found in docsOptions array. No custom GA dimension set.');
                    }
                }
            };

            var _syncBoolOptionLabelClass = function($option, optionChecked) {
                var $boolOptionsLbl = $option.closest('.doc-option-cbox-label');
                $boolOptionsLbl[optionChecked ? 'addClass' : 'removeClass']('active');
            };

            var _showOptionCalloutTitle = function() {
                return '<span class="label label-alt">NEW</span>&nbsp;&nbsp;&nbsp;Viewing Options';
            };

            var _showOptionCalloutContent = function() {
                return '<p class="text-center"><strong>Click this button to customize your <br>Web Skin viewing experience.</strong></p><p class="text-sm text-center"><em>We&rsquo;ll remember your choices next time you pay us a visit!</em></p>';
            };

            var _showOptionCallout = function() {
                var $parent = $optMenuBtn.parent('li');
                $parent
                    .popover({
                        container: 'body',
                        delay: 500,
                        trigger: 'manual',
                        template: '<div class="popover popover-options-navbar popover-fixed"><div class="arrow"></div><div class="inner"><h3 class="title"></h3><div class="content"></div></div></div>',
                        placement: 'auto bottom',
                        modal: true,
                        title: _showOptionCalloutTitle,
                        content: _showOptionCalloutContent
                    });

                setTimeout(function() {
                    if (! $('#docs-options').hasClass('in')) {
                        // don't show them the popover if they've already clicked on the options button
                        $parent.popover('show');

                        ga('send', 'event', 'Option Menu', 'callout');
                    }
                }, 3000);
            };


            // CORE METHODS
            // -------------------------

            var initializeDocBoolOptions = function($option, key) {
                // check the existing css classes on the $body elem
                var initialBodyClasses = $body.attr('class');
                var optionClassName = _getDomOptionClassName(key);
                var optionChecked = $option.prop('checked');
                var optionClassPresentOnBody = initialBodyClasses && initialBodyClasses.indexOf(optionClassName) > -1;

                var domClassUpdateNeeded = false;
                // in this case, we need to add the class to the body to make sure the docs
                // are displaying according to the options set by the user or by defaults.
                if (!optionChecked && !optionClassPresentOnBody) {
                    domClassUpdateNeeded = true;
                }

                _syncBoolOptionLabelClass($option, optionChecked);
                syncRelatedOptionText($option, key);

                storeDocBoolOption(key, optionChecked, domClassUpdateNeeded);
            };

            var initializeDocListOptions = function($option, key) {
                // currently, our list options simply serve as a way to
                // change our boolean options in bulk and/or update some text in the options menu

                syncRelatedOptionText($option, key);
            };

            var _relatedOptionTextKeys = [];
            var $_relatedOptionTextElems = [];
            var syncRelatedOptionText = function($option, key) {
                var $_option = $option;
                var _key = key;

                var _updateText = function(keyIndex) {
                    var _keyIndex = keyIndex;
                    var currentOptionVal = $option.val();

                    if (currentOptionVal && currentOptionVal !== '') {
                        var $textElems = $_relatedOptionTextElems[_keyIndex];
                        $textElems.length &&
                        $.each($textElems, function() {
                            var $this = $(this);
                            var lblText = $this.attr('data-lbl-' + currentOptionVal);
                            if (lblText && typeof lblText !== 'undefined') {
                                $this.text(lblText);
                            }
                        });
                    }
                };

                // only run this once per option key
                var $keyRelatedTextElems;
                if (_relatedOptionTextKeys.indexOf(_key) === -1) {
                    _relatedOptionTextKeys.push(_key);

                    $keyRelatedTextElems = $optionsForm.find('[data-option-related-text-key="' + _key + '"]');

                    if (typeof $keyRelatedTextElems !== 'undefined' && $keyRelatedTextElems.length > 0) {
                        $_relatedOptionTextElems.push($keyRelatedTextElems);

                        var keyIndex = _relatedOptionTextKeys.indexOf(_key);
                        // do it once on load
                        _updateText(keyIndex);
                        // then again when the option value changes
                        $option.on('change', function(e) {
                            _updateText(keyIndex);
                        });
                    }
                }
            };

            var syncRelatedBoolOptions = function(optionRelatedKeys, type) {
                var _type = type;
                $.each(optionRelatedKeys, function(index, key) {
                    var $relatedOption = $boolOptions.filter('[data-option-key=' + key + ']');
                    var propCheckMatch = _type == 'off' ? $relatedOption.prop('checked') : ! $relatedOption.prop('checked');

                    if ($relatedOption && propCheckMatch) {
                        $relatedOption.trigger('click');
                    }
                });
            };

            var syncGroupedBoolOptions = function(optionGroupKeys, availableOptionKeys) {
                var _availableOptionKeys = availableOptionKeys;
                $.each(optionGroupKeys, function(index, key) {
                    var _groupKey = key;
                    var $allGroupOptions = $();

                    $.each(_availableOptionKeys, function(index, _key) {
                        var _availKey = _key;

                        $allGroupOptions = $allGroupOptions.add($boolOptions.filter('[data-option-group=' + _availKey + ']'));
                    });

                    var $activeGroupOptions   = $allGroupOptions.filter('[data-option-group=' + _groupKey + ']'); // turn these on
                    var $inactiveGroupOptions = $allGroupOptions.not('[data-option-group=' + _groupKey + ']'); // turn these off

                    if ($activeGroupOptions) {
                        $.each($activeGroupOptions, function(index, elem) {
                            var $activeGroupOption = $(this);
                            ! $activeGroupOption.prop('checked') && $activeGroupOption.trigger('click');
                        });
                    }

                    if ($inactiveGroupOptions) {
                        $.each($inactiveGroupOptions, function(index, elem) {
                            var $inactiveGroupOption = $(this);
                            $inactiveGroupOption.prop('checked') && $inactiveGroupOption.trigger('click');
                        });
                    }
                });
            };

            var wireUpDocBoolOptionDomChanges = function($option, key) {
                var _key = key;
                $option.on('change', function(e) {
                    var optionChecked = $(this).prop('checked');
                    storeDocBoolOption(_key, optionChecked);

                    _syncBoolOptionLabelClass($option, optionChecked);

                    // if data-option-children-off attr is defined, that means that
                    // the option should always turn off its children when it is turned off.
                    var optionRelatedOffKeys = $(this).data('optionRelatedOff');

                    if (optionRelatedOffKeys && !optionChecked) {
                        optionRelatedOffKeys = optionRelatedOffKeys.split(',');
                        syncRelatedBoolOptions(optionRelatedOffKeys, 'off');
                    }

                    // if data-option-children-on attr is defined, that means that
                    // the option should always turn on its children when it is turned on.
                    var optionRelatedOnKeys = $(this).data('optionRelatedOn');

                    if (optionRelatedOnKeys && optionChecked) {
                        optionRelatedOnKeys = optionRelatedOnKeys.split(',');
                        syncRelatedBoolOptions(optionRelatedOnKeys, 'on');
                    }
                });
            };

            var wireUpDocListOptionDomChanges = function($option, key) {
                var _key = key;
                var $availableOptions = $option.find('option[value!=""]');
                var availableOptionKeys = [];
                $availableOptions.each(function() {
                    availableOptionKeys.push($(this).attr('value'));
                });
                $option.on('change', function(e) {
                    var optionName = _getStoredOptionName(_key);
                    var newOptionValue = $(this).val();
                    _setStoredItem(optionName, newOptionValue);

                    // if data-option-group-controller attr is true, that means that
                    // the value in this select controls the on/off state of other options
                    var isGroupController = $(this).data('optionGroupController');

                    if (isGroupController && newOptionValue !== noselection) {
                        var optionGroupKeys = newOptionValue.split(',');
                        syncGroupedBoolOptions(optionGroupKeys, availableOptionKeys);
                    }
                });
            };

            var storeDocBoolOption = function(key, optionChecked, domClassUpdateNeeded) {
                domClassUpdateNeeded = typeof domClassUpdateNeeded !== 'undefined' ? domClassUpdateNeeded : true;

                var optionName = _getStoredOptionName(key);
                var newOptionValue = optionChecked ? checked : unchecked;
                _setStoredItem(optionName, newOptionValue);

                if (domClassUpdateNeeded) {
                    updateDomOptionClass(key);
                }
            };

            var updateDomOptionClass = function(key) {
                $body.toggleClass(_getDomOptionClassName(key));
                if (scrollSpyInitialized) {
                    // only update the scrollspy if it has already been initialized with the correct options
                    setTimeout(function() {
                        if (gtIE8) {
                            // update the sidenav scrollspy
                            // once the DOM visibility changes
                            // have been made
                            $scrollSpyContentElem.scrollspy('refresh');
                        }
                        replaceState();
                    }, 10);
                }
            };

            var checkPersistedOptions = function() {

                var hasPersistedOptions = _getStoredItem(optsStored);

                if (!hasPersistedOptions) {
                    _showOptionCallout(); // first time visitor... show 'em what we can do
                    _setStoredItem(optsStored, 'true');
                }

                // check all the list options (selects)
                $.each($listOptions, function(index, elem) {
                    var $this = $(this);
                    var key = $this.data('optionKey');

                    // what option did they have last time they were here?
                    var optionStored = _getStoredItem(_getStoredOptionName(key));

                    if (optionStored !== noselection) {
                        // something other than the default option was selected in a previous session
                        $this.val(optionStored);
                    }

                    parseListOptionsDOM($this, key);
                });

                // check all the boolean options (checkboxes)
                $.each($boolOptions, function(index, elem) {
                    var $this = $(this);
                    var key = $this.data('optionKey');

                    // is the DOM element defaulted to being checked when the page loads?
                    var optionElemOnByDefault = $this.prop('checked');
                    // what option did they have last time they were here?
                    var optionStored = _getStoredItem(_getStoredOptionName(key));

                    if (optionStored === checked && !optionElemOnByDefault) {
                        // if option was activated in a previous visit by this user,
                        // and the default state of $this is deactivated, activate it
                        $this.prop('checked', true);
                    } else if (optionStored === unchecked && optionElemOnByDefault) {
                        // if option was de-activated on a previous visit by this user,
                        // and the default state of $this is activated, de-activate it
                        $this.prop('checked', false);
                    }

                    // once we're done checking for the existence of persisted options,
                    // we'll wire up the options DOM elements for
                    // 1) intial visibility of documentation stuff based on persisted options, and
                    // 2) wire up doc options form elements for potential further modification according to user requests
                    parseBoolOptionsDOM($this, key);
                });
            };

            var parseBoolOptionsDOM = function($option, key) {
                // initialize boolean options on load
                initializeDocBoolOptions($option, key);

                // wire up boolean options for pending changes from user
                wireUpDocBoolOptionDomChanges($option, key);
            };

            var parseListOptionsDOM = function($option, key) {
                // initialize list options on load
                initializeDocListOptions($option, key);

                // wire up list options for pending changes from user
                wireUpDocListOptionDomChanges($option, key);
            };

            // kick it off
            checkPersistedOptions();

            typeof console !== 'undefined' && debugMethodOrder && console.log('initializeDocsJsOptions(end)');

        } // END initializeDocsJsOptions()

        // DOCUMENTATION CORE JS
        // -------------------------
        function initializeDocsJsCore() {

            typeof console !== 'undefined' && debugMethodOrder && console.log('initializeDocsJsCore(begin)');


            // CORE JS METHODS
            // -------------------------
                function docsNavbarMenuMutex() {
                    if (! docsNavbarMutexRegistered) {

                        var $otherNavbarButtons = $('.ws-navbar .navbar-nav .hitarea').not($optionsMenuToggleBtn);

                        $otherNavbarButtons.on('click', function(e) {
                            if ($optionsMenu.hasClass('in')) {
                                // Ensure that any open docs search drodown menus are closed
                                $('#js-search').trigger('close.ws.search');

                                $optionsMenuToggleBtn.trigger('click');
                            } else {
                                // console.log('options menu is not open... do nothing');
                            }
                        });

                        $('#js-search .form-control')
                            .on('click', function(e) {
                                $optionsMenuToggleBtn.trigger('close.ws.navbar');
                                $docsMenuToggleBtn.trigger('close.ws.navbar');
                            });

                        $optionsMenuToggleBtn
                            .on('close.ws.navbar', function(e) {
                                if ($optionsMenu.hasClass('in')) {
                                    $optionsMenuToggleBtn.trigger('click');
                                }
                            })
                            .on('click', function(e) {
                                // Ensure that any open docs search drodown menus are closed
                                $('#js-search').trigger('close.ws.search');
                                $docsMenuToggleBtn.trigger('close.ws.navbar');
                            });

                        $docsMenuToggleBtn
                            .on('close.ws.navbar', function(e) {
                                if ($docsMenu.hasClass('in')) {
                                    $docsMenuToggleBtn.trigger('click');
                                }
                            })
                            .on('click', function(e) {
                                $('#js-search').trigger('close.ws.search');
                                $optionsMenuToggleBtn.trigger('close.ws.navbar');
                            });

                        docsNavbarMutexRegistered = true;
                    }
                }

                function toggleDocOptionsMenu(that, ev) {
                    var _this   = that;
                    var $this   = $(_this);
                    var $parent = $this.parent('li');
                    var target  = $this.data('target');
                    var $target = $(target);
                    var $overlay = $('#docs-options-backdrop');

                    var isShown = $target.hasClass('in');

                    var optionsEvent = $.Event(isShown ? 'hide' : 'show' + '.docs.options');

                    var hideOpenDropdowns = function() {
                        var $openDropdowns = $chosenDropdowns.filter('.open');
                        $openDropdowns.find('.btn').trigger('mousedown.chosen');
                    };

                    if (optsNavbarPaneOpened < 1) {
                        $target
                            .on('show.docs.options', function(e) {
                                $overlay
                                    .on('click', function(e) {
                                        $optionsMenuToggleBtn.trigger('click');
                                    })
                                    .removeClass('hide');

                                ga('send', 'event', 'Option Menu', 'show');
                            })
                            .on('hide.docs.options', function(e) {
                                $overlay.addClass('hide');

                                hideOpenDropdowns();

                                ga('send', 'event', 'Option Menu', 'hide');
                            });
                    }

                    $parent
                        .toggleClass('active')
                        .popover('hide');

                    $target
                        .trigger(optionsEvent)
                        .toggleClass('in');

                    optsNavbarPaneOpened++;
                }

                function permalinkIt(currentHash, permalinkHash, permalinkText) {
                    if (currentHash != permalinkHash) {
                        pushState(permalinkHash);

                        currentHash = permalinkHash;

                        // record GA event to signify that someon is interested in permalinking a section
                        ga('send', 'event', 'Permalink', permalinkText, 'Heading: ' + permalinkText);
                    }
                }

                function toggleCodeExample(toggleBtn, event) {
                    var codeToggleBtnVisibilityClass = 'js-open';

                    var $codeToggleBtn = $(toggleBtn);
                    var codeToggleBtnShowLabel = $codeToggleBtn.attr('data-show-label');
                    var codeToggleBtnHideLabel = $codeToggleBtn.attr('data-hide-label');

                    var $codeExampleWrapper = $codeToggleBtn.parent('.highlight-wrapper');
                    var $codeExample = $codeToggleBtn.prev('.code');
                    var $example = $codeExampleWrapper.prev('.ws-example');
                    var exampleTop = false;

                    if ($example.length > 0) {
                        exampleTop = $example[scrollOffsetMethod]().top - 60;
                    }

                    if ($codeExample.is('[aria-hidden="false"]')) {
                        $codeExampleWrapper.attr('aria-expanded', 'false');
                        $codeExample.attr('aria-hidden', 'true');

                        if (exampleTop) {
                            // scroll back to example
                            $scrollSpyContentElem.scrollTop(exampleTop + scrollHereOffset + $scrollSpyContentElem[0].scrollTop);
                        }

                        $codeToggleBtn
                            .attr('aria-expanded', 'false')
                            .removeClass(codeToggleBtnVisibilityClass)
                            .text(codeToggleBtnShowLabel);
                    } else {
                        $codeExampleWrapper.attr('aria-expanded', 'true');
                        $codeExample.attr('aria-hidden', 'false');

                        $codeToggleBtn
                            .attr('aria-expanded', 'true')
                            .addClass(codeToggleBtnVisibilityClass)
                            .text(codeToggleBtnHideLabel);
                    }

                    // update scrollspy offsets
                    if (scrollSpyInitialized && gtIE8) {
                        $scrollSpyContentElem.scrollspy('refresh');
                    }
                }
            // -------------------------


            // CORE JS VARS
            // -------------------------
                // Collapsing docs options menu vars
                var optsNavbarPaneOpened = 0;
                var docsNavbarMutexRegistered = false;

                var docsMenuRef = '.docs-navbar-collapse';
                var $docsMenu = $(docsMenuRef);
                var $docsMenuToggleBtn = $('.ws-navbar [data-target="' + docsMenuRef + '"]');
                var $optionsMenu = $('#docs-options');
                var $optionsMenuToggleBtn = $('.ws-navbar [data-toggle="options"]');
                var $chosenDropdowns = $('#docs-options .chosen-container');
                //
                // Sidenav menu vars
                // measurement helpers
                sideBarMargin   = parseInt($sidenav.css('margin-top'), 10);
                navHeight       = $navbar.outerHeight(true) + navRibbonHeight;
            // -------------------------


            // HOOK UP LONG-LIVING CLICK EVENTS
            // -------------------------
                if (gtIE8) {
                    $document
                        // prevent submission of forms in docs examples
                        .on('click', '.ws-example [type=submit]', function(e) {
                            e.preventDefault();
                        })
                        // disable href clicks when they are within an example
                        .on('click', '.ws-example [href^=#]', function(e) {
                            e.preventDefault();
                        })
                        // hook up code example visibility toggling
                        .on('click', '.code-toggle', function(e) {
                            e.preventDefault();

                            toggleCodeExample(this, e);
                        })
                        // hook up query strings for custom content filtering within docs pages
                        .on('click', '.ws-section [data-content-query]', function(e) {
                            e.preventDefault();
                            addQueryString($(this).data('content-query'));
                        })
                        // hook up section anchors within the docs content area
                        .on('click', '.ws-section [href^=#]:not([data-toggle])', function(e) {
                            var ev = e;
                            var $el = ev && $(ev.target);
                            var href = ev.target.getAttribute('href');

                            // check to see if its just a href="#"
                            if (href) {
                                if (href.length > 1) {
                                    try {
                                        scrollHere(href, scrollHereOffset, ev);
                                    } catch(err) {

                                    }
                                }
                            }
                        })
                        // hook up section anchors within the sidenav
                        .on('click', '.ws-sidenav [href^=#]', function(e) {
                            var ev = e;
                            var $el = ev && $(ev.target);

                            var isActive = $el.parent('.active').length > 0;
                            var hasActiveChildren = $el.parent().find('.nav').children('.active').length > 0;

                            if (isActive && !hasActiveChildren) {
                                // disable sidebar links if they are activated
                                e.preventDefault();
                            } else {
                                // its not the active link... scroll there.
                                scrollHere(ev.target.getAttribute('href'), scrollHereOffset, ev);
                            }
                        })
                        .on('click.docs.options.data-api', '[data-toggle=options]', function(e) {
                            var ev = e;
                            toggleDocOptionsMenu(this, ev);
                        });
                    }
            // -------------------------


            // Initialize collapsing docs options menu
            // -------------------------
                if (gtIE8) {
                    // register the mutex
                    docsNavbarMenuMutex();
                }
            // -------------------------


            // Initialize side bar navigation
            // -------------------------
                $sidenav
                    .affix({
                        scrollElement: $scrollSpyContentElem,
                        offset: {
                            top: function() {
                                return (this.top = getAffixOffset());
                            }
                          , bottom: function() {
                                return (this.bottom = $footer.outerHeight(true));
                            }
                        }
                    });


                function sidebarNavMaxHeight() {
                    //
                    // Reset height so that a new height will be determined
                    // if the viewport height grows instead of shrinks
                    //
                    $sidenav.css({
                        maxHeight: 'none'
                    });

                    viewportHeight = getViewportHeight();

                    // add a max-height to the $sidenav elem so that it will scroll if it is taller than the viewport
                    var sidenavAttrs = {
                        top: $sidenav.offset().top,
                        bottom: $sidenav.is('.affix-bottom') ? $footer.outerHeight(true) : 0,
                        height: $sidenav.outerHeight(true),
                        maxHeight: 0
                    };

                    var sidenavOffsets = sidenavAttrs.top + sidenavAttrs.bottom;

                    sidenavAttrs.maxHeight = viewportHeight - sidenavOffsets;

                    if (sidenavOffsets + sidenavAttrs.height > viewportHeight) {
                        $sidenav.css({
                            maxHeight: sidenavAttrs.maxHeight,
                            overflowY: 'scroll'
                        });
                    } else {
                        $sidenav.css({
                            maxHeight: sidenavAttrs.maxHeight
                        });
                    }

                    return sidenavAttrs.maxHeight;
                }


                // hook up scrolling for section navigation
                // -------------------------
                setTimeout(function() {
                    if (gtIE8) {
                        // wait for the page to load completely before taking measurements
                        scrollspyOffset = getScrollspyOffset();
                        $scrollSpyContentElem
                            .on('no-actives.wdesk.scrollspy', function(e) {
                                // if we scroll above the first elem on the page
                                // leave the first elem active.
                                $sidenavFirstElem.addClass('active');
                            })
                            .scrollspy({
                                target: scrollSpyElemClass,
                                offset: scrollspyOffset,
                                useOffset: true
                            });
                        scrollSpyInitialized = true;
                    }

                    viewportWidth = getViewportWidth();

                    sidebarNavMaxHeight();

                    // Scroll to section indicated by hash
                    // -------------------------
                    if (currentHash) {
                        scrollHere(currentHash);
                    }

                    // if nothing is active, activate the first one
                    var activeSection = $sidenav.find('li').hasClass('active');
                    if (! activeSection) {
                        $sidenavFirstElem.addClass('active');
                    }
                }, 2000);

                // make sure scrollspy locations are refreshed when window is resized
                if (gtIE8) {
                    $window.smartresize(function() {
                        if (scrollSpyInitialized) {
                            $scrollSpyContentElem.scrollspy('refresh');
                            sidebarNavMaxHeight();

                            // screen width was changed
                            if (viewportWidth != getViewportWidth()) {
                                replaceState();
                            }
                        }
                    });
                }

                // make sure height of sidenav is re-measured when
                // a new group expands via being activated by scrollspy
                $scrollSpyContentElem
                    .on('activate.wdesk.scrollspy', function(e) {
                        sidebarNavMaxHeight();
                    })
                    .smartscroll(function() {
                        // make sure height of sidenav is re-measured when
                        // the document is scrolled, to handle the edge case that the
                        // viewport is very short on load
                        sidebarNavMaxHeight();
                    });


            // -------------------------


            // Initialize chosen.js elems
            // -------------------------
            var $selectElems = $('select.chosen');
            if ($selectElems.length > 0) {
                $selectElems.chosen({
                    inherit_select_classes: true
                });
            }


            // Initialize docs permalinks
            // -------------------------

            // permalink rows of large tables (like js option tables)
            // var $tableRows = $('tr[id]');

            // $.each($tableRows, function() {
            //     var $this = $(this);
            //     var rowID = $this.attr('id');
            //     var $heading = $this.find('>th:first');
            //     var headingText = $heading.text();

            //     $heading.click(function(e) {
            //         permalinkIt(currentHash, rowID, headingText);
            //     });
            // });


            // permalink section headings
            // var $sectionHeadings = $('.ws-section h1[id], .ws-section h2[id], .ws-section > h3[id], .ws-section > h4[id], .sassdoc-heading__item');

            // $.each($sectionHeadings, function() {
            //     var $this = $(this);
            //     var headingID = $this.attr('id');
            //     var headingText = $this.text();
            //     $this
            //         .click(function(e) {
            //             permalinkIt(currentHash, headingID, headingText);
            //         });
            // });
            // -------------------------


            typeof console !== 'undefined' && debugMethodOrder && console.log('initializeDocsJsCore(end)');

        } // END initializeDocsJsCore()

    //----------------------------------------------


    //----------------------------------------------
    //+ DEMO JS
    //  Run after initializeDocsJsCore is finished
    //----------------------------------------------

        function initializeDocsJsDemos() {

            typeof console !== 'undefined' && debugMethodOrder && console.log('initializeDocsJsDemos(begin)');


            //----------------------------------------------
            //+ BTN-GROUP SKIN ON HOVER ONLY DEMO
            //----------------------------------------------
            // Something to identify the `.btn-group` that wraps around the two `.btn` elems
            var splitBtnGroupSkinAttr = 'data-skin-on-hover';
            var splitBtnGroupSelector = '[' + splitBtnGroupSkinAttr + ']';

            var addBtnSkinClass = function(group) {
                var self = group;

                var splitBtnGroupBtns = $('> .btn', self);
                var btnSkinName = $(self).attr(splitBtnGroupSkinAttr);

                splitBtnGroupBtns.addClass('btn-' + btnSkinName);
            };

            var removeBtnSkinClass = function(group) {
                var self = group;

                var splitBtnGroupBtns = $('> .btn', self);
                var btnSkinName = $(self).attr(splitBtnGroupSkinAttr);

                splitBtnGroupBtns.removeClass('btn-' + btnSkinName);
            };

            // Manipulate the CSS class when a parent `.btn-group` is hovered / focused
            $(document)
                .on('mouseenter focusin', splitBtnGroupSelector, function(event) {
                    $(this).data('isHovered', true);
                    addBtnSkinClass(this);
                })
                .on('mouseleave focusout', splitBtnGroupSelector, function(event) {
                    $(this).data('isHovered', false);

                    // only remove the btn skin if the dropdown menu is not open
                    if (!$(this).hasClass('open')) {
                        removeBtnSkinClass(this);
                    }
                })
                .on('hide.wdesk.dropdown', splitBtnGroupSelector, function(event) {
                    // dropdown menu is closing, so
                    // as long as the group is not still
                    // being hovered, remove the skin
                    if ($(this).data('isHovered') === false) {
                        removeBtnSkinClass(this);
                    }
                });


            // ------------------------------------------------
            //   MIGRATION GUIDE PANEL COLLAPSE / EXPAND LOGIC
            // ------------------------------------------------
            var $migrationClassChangePanelContainer = $('#migration-one-o-class-group-panels');

            if ($migrationClassChangePanelContainer.length > 0) {

                var updateExpandedPanelCount = function() {
                    expandedPanels = $migrationClassChangePanels.filter('[aria-hidden="false"]').length;
                    return expandedPanels;
                };

                var updateBtnState = function() {
                    updateExpandedPanelCount();

                    if (expandedPanels > 0) {
                        $migrationClassChangeCollapseAllBtn
                            .prop('disabled', false)
                            .removeAttr('disabled');
                    } else {
                        $migrationClassChangeCollapseAllBtn
                            .prop('disabled', true);
                    }

                    if (expandedPanels < $migrationClassChangePanels.length) {
                        $migrationClassChangeExpandAllBtn
                            .prop('disabled', false)
                            .removeAttr('disabled');
                    } else {
                        $migrationClassChangeExpandAllBtn
                            .prop('disabled', true);
                    }
                };

                var $migrationClassChangePanels = $migrationClassChangePanelContainer.find('.panel-collapse');
                var $migrationClassChangeExpandAllBtn = $('#btn-migration-class-changes-expand-all');
                var $migrationClassChangeCollapseAllBtn = $('#btn-migration-class-changes-collapse-all');
                var expandedPanels;

                updateBtnState();

                $migrationClassChangeExpandAllBtn
                    .on('click', function(event) {
                        $migrationClassChangePanelContainer.find('.panel-collapse[aria-hidden="true"]').collapse('show');
                    });

                $migrationClassChangeCollapseAllBtn
                    .on('click', function(event) {
                        $migrationClassChangePanelContainer.find('.panel-collapse[aria-hidden="false"]').collapse('hide');
                    });

                $migrationClassChangePanels
                    .on('shown.wdesk.collapse', function(event) {
                        expandedPanels++;
                        updateBtnState();
                        $scrollSpyContentElem.scrollspy('refresh');
                        replaceState();
                    })
                    .on('hidden.wdesk.collapse', function(event) {
                        expandedPanels--;
                        updateBtnState();
                        $scrollSpyContentElem.scrollspy('refresh');
                        replaceState();
                    });
            }


            //----------------------------------------------
            //+ BRAND ICO ASSET DOWNLOAD LOGIC
            //----------------------------------------------
            var brandIcoAssetTblSelector = '#branding-downloads-table';
            var brandIcoAssetTblRowSelector = brandIcoAssetTblSelector + ' .asset-download-row';
            var $frame = $('.brand-consistency-frame');
            var $frameImages = $('.img-reveal-on-dl-row-hover', $frame); // the images we'll reveal based on which row is hovered
            var $revealThisImg;

            $(brandIcoAssetTblSelector).hover(function() {
                $frame.toggleClass('dl-row-is-hovered');
            });
            $(brandIcoAssetTblRowSelector).hover(function() {
                $revealThisImg = $frameImages.filter('[data-reveal-on=' + $(this).data('download') + ']');
                $revealThisImg.addClass('reveal-img');
            }, function() {
                $revealThisImg.removeClass('reveal-img');
            });

            var $imgTips = $(brandIcoAssetTblSelector).find('.sizes [rel=tooltip]');
            $imgTips.tooltip({
                html: true,
                placement: 'right auto',
                delay: {
                    show: 500,
                    hide: 0
                },
                title: function() {
                    return $('<img src="' + $(this).attr('href') + '" width="' + $(this).data('imgWidth') + '" height="' + $(this).data('imgHeight') + '">');
                }
            });

            var $codeTips = $('.code-tip[rel="tooltip"]');
            $codeTips.tooltip({
                placement: 'top auto',
                delay: 500,
                html: true,
                container: 'body'
            });
            // delay the placement of the tooltip since the image height throws it off
            // $imgTips.one('show.wdesk.tooltip', function(event) {
            //     event.preventDefault();

            //     $(this).tooltip('show');
            // });


            //----------------------------------------------
            //+ OVERVIEW DEMOS
            //----------------------------------------------
            if ($overviewSection.length > 0) {
                var containerClass = 'ws-container';
                var $container = $('.' + containerClass);
                var $containerWidthDemoToggle = $('#ws-container-width-toggle');
                var $containerWidthRadios = $('input:radio', $containerWidthDemoToggle);
                var $activeRadio = $containerWidthRadios.filter(':checked');

                $containerWidthRadios.on('change', function(e) {
                    var $changed = $(e.target);

                    if (!$changed.is($activeRadio)) {
                        $container[e.target.id === 'normal' ? 'removeClass' : 'addClass']('container-wide');
                        $activeRadio = $changed;
                    }
                });
            }


            //----------------------------------------------
            //+ LABELS / BADGE DEMOS
            //----------------------------------------------
            if ($lblsBadgeSection.length > 0) {
                var $doctypeTbl = $('#doctype-label-variant-table');

                var $detailContainers = $doctypeTbl.find('.doctype-group-list');
                var $detailToggle = $('#doctype-group-detail-toggle');

                $detailToggle.on('change', function(e) {
                    var $this = $(this);

                    $detailContainers[$this.prop('checked') ? 'removeClass' : 'addClass']('hide');
                    $detailContainers.attr('aria-hidden', $this.prop('checked') ? 'false' : 'true');
                });

                var $clickableToggles = $('.clickable-elem-toggle');

                $clickableToggles.on('change', function(e) {
                    var $this = $(this);
                    var $parentTable = $(this).closest('.table');
                    var elemClass = $(this).attr('data-elem-class');
                    var isChecked = $this.prop('checked');

                    // add .hitarea class to all elements
                    // so user can see the hover effect on clickable elems
                    var $actualElems = $parentTable.find('.' + elemClass);
                    $actualElems[isChecked ? 'addClass' : 'removeClass']('hitarea');

                    // add/remove .hitarea class to code examples
                    var $elemCodeExamples = $parentTable.find('code');

                    var existingMarkup;
                    $.each($elemCodeExamples, function() {
                        existingMarkup = $(this).html();

                        if (isChecked) {
                            // add .hitarea class to example code
                            $(this).html(existingMarkup.replace('class="' + elemClass, 'class="' + elemClass + ' hitarea'));
                        } else {
                            // remove .hitarea class from example code
                            $(this).html(existingMarkup.replace('class="' + elemClass + ' hitarea', 'class="' + elemClass));
                        }
                    });
                });
            }


            //----------------------------------------------
            //+ COLLAPSIBLE TREE NAV DEMO
            //----------------------------------------------
            if ($navListTreeSection.length > 0) {

                var $treeNavDemo      = $navListTreeSection.find('#list-group-tree-example');
                var $treeNavSections  = $treeNavDemo.find('.list-group.collapse');
                var $treeNavContentElems = $('#list-group-tree-content').find('[data-folder-key]');

                var $activateGroup3Btn      = $navListTreeSection.find('#btn_activateGroup3');
                var $collapseAllBtn         = $navListTreeSection.find('#btn_collapseAll');

                $treeNavSections
                    .on('activate.wdesk.collapse', function(e) {
                        /*
                            The data() within the relatedTarget object on the event
                            contains everything you need to manipulate DOM based on
                            a new element in the nav list becoming activated
                        */
                        var btnData = $(e.relatedTarget).data();

                        if (btnData) {
                            /*
                                This contentSelector can be specified
                                as anything that is a valid jQuery selector
                            */
                            var contentSelectorGroups = btnData.targetContent.substr(1, btnData.targetContent.lastIndexOf('-content') - 1).split('_');
                            // we only go two levels deep for this demo
                            var contentFuzzySelector = contentSelectorGroups[0];
                            if (contentSelectorGroups.length > 1) {
                                 contentFuzzySelector += '_' + contentSelectorGroups[1];
                                 if (contentSelectorGroups.length > 2) {
                                    contentFuzzySelector += '_' + contentSelectorGroups[2];
                                }
                            }

                            var dataFilter = '';
                            if (contentFuzzySelector) {
                                if (contentFuzzySelector === 'projects' || contentFuzzySelector === 'my-recent') {
                                    if (contentFuzzySelector === 'projects') {
                                        dataFilter = '[data-is-project="true"]';
                                    } else {
                                        dataFilter = '[data-is-recent="true"]';
                                    }
                                } else {
                                    dataFilter = '[data-folder-key*=' + contentFuzzySelector + ']';
                                }

                                $.each($treeNavContentElems, function() {
                                    var $this = $(this);
                                    var $active = $this.filter(dataFilter);

                                    if ($active.length) {
                                        $active
                                            .removeClass('hide')
                                            .attr('aria-hidden', false);
                                    } else {
                                        ! $this.hasClass('hide') &&
                                            $this.addClass('hide')
                                                 .attr('aria-hidden', true);
                                    }
                                });
                            }
                        }
                    });

                $activateGroup3Btn
                    .on('click', function(e) {
                        $treeNavDemo.find('#workiva_risk-team_group-3-group')
                            .collapse('activate')
                            .collapse('show');

                        /*
                            Equivalent to the data-api initialization:
                            $treeNavDemo.find('#btn_riskMenu_grp3').click()

                            Normally, clicking on an element with [data-toggle=collapse]
                            will initialize a collapse instance on the element specified
                            by the clicked element's [data-target] or [href], with the
                            clicked element passed in as the initial _relatedTarget, which
                            will always receive classes related to the collapse element's
                            state.

                            In this case, since there is no _relatedTarget specified,
                            that argument will default to the element specified (by id) by
                            the collapsible element's aria-labelledby attribute. In most
                            cases, this should refer to the same element that would have
                            triggered the collapse element via the data-api.

                            This allows classes related to state to be communicated the
                            same, regardless of how the collapsible element was initialized.
                        */
                    });

                $collapseAllBtn
                    .on('click', function(e) {
                        $treeNavDemo.find('> li > .collapse').collapse('hide');
                    });
            } // END if ($navListTreeSection)
            //----------------------------------------------


            //----------------------------------------------
            //+ FORMS / INPUT DEMOS
            //----------------------------------------------
            if ($formSection.length > 0) {

                // remove invalid styling from invalid demo field
                $('input.invalid-demo').keyup(function(e) {
                    if ($(this).val() !== '') {
                        $(this).addClass('valid');
                    } else {
                        $(this).removeClass('valid');
                    }
                });

                // checkbox "toggle" demo
                var $cboxSwitchToggle = $('.wdesk-checkbox-switch-example').find('.checkbox-switch input');

                // disable inputs wrapped in .disabled CSS class
                var $disabledCboxes = $('.checkbox.disabled, .checkbox-inline.disabled, .radio.disabled, .radio-inline.disabled', document.body);
                $('> input', $disabledCboxes).prop('disabled', true);

                // tooltip validation demo
                var getValidationTooltipTemplate = function($input) {
                    var $formGroup = $input.closest('.form-group');
                    var template;

                    if ($formGroup.hasClass('has-warning')) {
                        template = '<div class="tooltip tooltip-warning"><div class="arrow"></div><div class="inner"></div></div>';
                    } else if ($formGroup.hasClass('has-error')) {
                        template = '<div class="tooltip tooltip-danger"><div class="arrow"></div><div class="inner"></div></div>';
                    } else if ($formGroup.hasClass('has-success')) {
                        template = '<div class="tooltip tooltip-success"><div class="arrow"></div><div class="inner"></div></div>';
                    } else {
                        // something went wrong... don't know which type of validation tooltip you need
                        throw 'This demo only works for inputs nested within .form-group elems that have the proper has-{state} css class.';
                    }

                    return template;
                };

                var $tooltipValidationDemos = $('.tooltip-validation-demo .form-group');
                var $validationInput = $('.form-control[data-toggle=tooltip]', $tooltipValidationDemos);

                $.each($validationInput, function() {
                    var $this = $(this);

                    $this.tooltip({
                        trigger: 'focus',
                        placement: 'left auto',
                        container: 'body', // so the extents of the form doesn't screw with placement
                        template: getValidationTooltipTemplate($this)
                    });
                });

                    // .on('focus', function(e) {
                    //     // var validationType = $(this).closest($tooltipValidationDemos).attr('class').replace('form-group ', '');
                    //     // console.log(validationType);
                    //     var $this = $(this);
                    //     $(this)
                    // });

            } // END if ($formSection)


            //
            // CLICK TO EDIT DEMO
            //

            //
            // Shared cte demo vars
            //
            var $selectedCteGroupElem = null;
            var $editableCteInputElem = null;
            var selectedCteCssClass = 'is-selected';
            var editableCteCssClass = 'is-editable';
            var uneditableCteInputCssClass = 'form-control-static';
            var ctePencilIconBtnCssClass = 'cte-edit-btn';
            var cteGroupSelector = '.cte-group';

            //
            // Vars / helpers to help distinguish between single / double click events
            //
            var cteClickTimer = 0;
            var cteClickDelay = 200;
            var cteClickPrevent = false;
            var ctePencilIconBtnDirectlyClicked = false;

            function wasCtePencilIconBtnClicked(e) {
                var $target = $(e.target);

                return $target.is('.' + ctePencilIconBtnCssClass) ||
                       $target.closest('.' + ctePencilIconBtnCssClass).length > 0;
            }

            function handleCteClick(e) {
                var _e = e;

                ctePencilIconBtnDirectlyClicked = wasCtePencilIconBtnClicked(_e);

                if (ctePencilIconBtnDirectlyClicked) {
                    handleValidCteDoubleClick(_e);
                    return;
                }

                // Wait to see if this is a double click first
                cteClickTimer = setTimeout(function() {
                    if (!cteClickPrevent) {
                        handleValidCteSingleClick(_e);
                    }
                    cteClickPrevent = false;
                }, cteClickDelay);
            }

            function handleCteDoubleClick(e) {
                if (!ctePencilIconBtnDirectlyClicked) {
                    clearTimeout(cteClickTimer);
                    cteClickPrevent = true;
                    handleValidCteDoubleClick(e);
                }
            }

            //
            // Core cte demo behaviors
            //
            function bindCteClickHandlers(cteGroupElem) {
                cteGroupElem = cteGroupElem || cteGroupSelector;

                $(document)
                    .on('click.ws-cte-demo', cteGroupElem, function(e) {
                        handleCteClick(e);
                    })
                    .on('dblclick.ws-cte-demo', cteGroupElem, function(e) {
                        handleCteDoubleClick(e);
                    })
                    .on('click.ws-cte-demo-mutex', function(e) {
                        var $target = $(e.target);

                        if ($target.is(cteGroupElem) ||
                            $target.closest($selectedCteGroupElem).length > 0) {
                            // its within a cte group... defer to our cte behavior
                        } else {
                            // its outside of a cte group... trigger mutex
                            stopCteEdit();
                            deSelectCteGroup();
                        }
                    });
            }

            function getCteGroupElem(e) {
                var _$target = e && $(e.target);

                return _$target && _$target.is(cteGroupSelector) ? _$target : _$target.closest(cteGroupSelector);
            }

            function getCteInputElem($cteGroupElem) {
                return $('.form-control', $cteGroupElem);
            }

            function deSelectCteGroup($currentlySelectedCteGroup) {
                $currentlySelectedCteGroup = $currentlySelectedCteGroup || $selectedCteGroupElem;

                if ($currentlySelectedCteGroup) {
                    // De-activate the currently selected one
                    $currentlySelectedCteGroup.removeClass(selectedCteCssClass);
                }

                // Re-assign
                $selectedCteGroupElem = null;
            }

            function selectCteGroup($cteGroupElem) {
                // De-select any currently selected cteGroup
                deSelectCteGroup($selectedCteGroupElem);

                // Activate the newly selected one
                $cteGroupElem.addClass(selectedCteCssClass);
                //
                // Place focus on the input, even though it may
                // not be editable yet.  This is for purposes of
                // "copy paste" functionality that isn't demonstated
                // in web-skin, but if this logic is being used as a
                // reference, deserves to be noted.
                //
                getCteInputElem($cteGroupElem).focus();

                // Re-assign
                $selectedCteGroupElem = $cteGroupElem;
            }

            function startCteEdit($cteGroupElem) {
                // Stop any edit currently in progress
                stopCteEdit();

                $cteGroupElem.addClass(editableCteCssClass);
                selectCteGroup($cteGroupElem);

                var $cteInput = getCteInputElem($cteGroupElem);

                $cteInput
                    .removeClass(uneditableCteInputCssClass)
                    .prop('readonly', false)
                    .focus();

                // Re-assign
                $editableCteInputElem = $cteInput;
            }

            function stopCteEdit() {
                if ($selectedCteGroupElem) {
                    $selectedCteGroupElem.removeClass(editableCteCssClass);
                }

                if ($editableCteInputElem) {
                    $editableCteInputElem
                        .addClass(uneditableCteInputCssClass)
                        .prop('readonly', true);
                }

                // Re-assign
                $editableCteInputElem = null;
            }


            //
            // Click "router" methods
            //
            function handleValidCteSingleClick(e) {
                var $cteGroupElem = getCteGroupElem(e);
                var shouldSelectGroup = true;

                if ($editableCteInputElem &&
                    $editableCteInputElem.closest($cteGroupElem).length > 0) {
                    // Don't do anything if an edit is currently in progress within the group that was clicked
                    shouldSelectGroup = false;
                }

                if ($cteGroupElem === $selectedCteGroupElem) {
                    // Don't do anything if the group is already "selected"
                    shouldSelectGroup = false;
                }

                shouldSelectGroup && selectCteGroup($cteGroupElem);
            }

            function handleValidCteDoubleClick(e) {
                var $cteGroupElem = getCteGroupElem(e);
                var shouldEditGroup = true;

                if ($editableCteInputElem &&
                    $editableCteInputElem.closest($cteGroupElem).length > 0) {
                    // Don't do anything if an edit is current in progress within the group that was clicked
                    shouldEditGroup = false;
                }

                shouldEditGroup && startCteEdit($cteGroupElem);
            }


            if ($clickToEditSection.length > 0) {
                //
                // INITIALIZE CLICK TO EDIT DEMO
                //
                bindCteClickHandlers();
            } // END if ($clickToEditSection)
            //----------------------------------------------


            //----------------------------------------------
            //+ INPUTMASK PLUGIN DEMOS
            //----------------------------------------------
            if ($inputmaskSection.length > 0) {
                var $demoValInput = $('#unmaskedValueDemo');
                var $maskedValuePrintout = $('#printMaskedValue');
                var $unmaskedValuePrintout = $('#printUnmaskedValue');

                var printValues = function() {
                    var demoVal = $demoValInput.val();
                    var hasData = $demoValInput.data('wdesk.inputmask');
                    var demoValUnmasked = hasData ? hasData.unmaskedValue : '';

                    $maskedValuePrintout.text('"' + demoVal + '"');
                    $unmaskedValuePrintout.text('"' + demoValUnmasked + '"');
                };

                printValues(); // do it once on load
                $('#unmaskedValueDemo').on('keyup.wdesk.inputmask', function(e) {
                    printValues();
                });
                $('#unmaskedValueDemo').on('focus', function(e) {
                    printValues();
                });
                $('#unmaskedValueDemo').on('blur', function(e) {
                    printValues();
                });
            } // END if ($formSection)
            //----------------------------------------------


            //----------------------------------------------
            //+ TABLE DEMOS
            //----------------------------------------------
            if ($tableSection.length > 0) {

                // Table sortable demo
                // -------------------------
                    var sortedClass = 'column-sorted';
                    var $sortableTable = $('.table-sortable');

                    var getSortedColIndex = function() {
                        var sortedIndex;

                        if ($sortTblCols.length > 0) {
                            $.each($sortTblCols, function(index, Element) {
                                var $this = $(this);
                                if ( $this.hasClass(sortedClass) ) {
                                    sortedIndex = index;
                                    return false;
                                }
                            });
                            return sortedIndex;
                        } else {
                            return false;
                        }
                    };

                    if ($sortableTable.length > 0) {

                        var $sortTblHeaders = $('.table-sortable > thead > tr > th[data-sort-by]');
                        var $sortTblCols = $('.table-sortable > colgroup > col');
                        var sortedColIndex = getSortedColIndex();

                        $.each($sortTblHeaders, function(index, Element) {

                            $(this).click(function() {

                                if ( $(this).hasClass(sortedClass) ) {
                                    if ( $(this).hasClass(sortedClass + '-ascending') ) {
                                        $(this).removeClass(sortedClass + '-ascending').addClass(sortedClass + '-descending');
                                    } else {
                                        $(this).removeClass(sortedClass + '-descending').addClass(sortedClass + '-ascending');
                                    }
                                } else {
                                    if ( $(this).hasClass(sortedClass + '-ascending') || $(this).hasClass(sortedClass + '-descending') ) {
                                        // leave the default sort
                                    } else {
                                        $(this).addClass(sortedClass + '-ascending');
                                    }
                                }

                                $(this).parent('tr').find('th').removeClass(sortedClass);
                                $(this).addClass(sortedClass);

                                $('colgroup col.' + sortedClass).removeClass(sortedClass);
                                $sortTblCols.filter(':eq(' + index + ')').addClass(sortedClass);

                            });

                        });
                    }
                } // END if ($tableSection)

                // Table selectable demo
                // Available not just in the table
                // demo section, but also in list-group-tree demo
                // -------------------------
                    var selectedClass = 'row-selected';
                    var $selectableDemoTable = $('.table-selectable');
                    var $selectableRows;
                    var $selectableRowCboxes;

                    var selectRow = function($row, cboxClicked) {
                        var $checkbox = $row.find(':checkbox');
                        var checkboxParentId = $checkbox.data('cboxGroup');

                        if (!cboxClicked) {
                            $checkbox.prop('checked') ? $checkbox.prop('checked', false) : $checkbox.prop('checked', true);
                            $checkbox.trigger('change');
                        }

                        if (checkboxParentId) {
                            updateCboxGroupParent(checkboxParentId);
                        }

                        $checkbox.prop('checked') ? $row.addClass(selectedClass) : $row.removeClass(selectedClass);
                    };

                    var initCboxGroupParent = function() {
                        var $selectedCboxes = $selectableRows.find(':checkbox').filter(':checked');
                        var checkboxParentId = false;
                        if ($selectedCboxes && $selectedCboxes.length > 0) {
                            checkboxParentId = $selectedCboxes.filter(':first').data('cboxGroup');
                            updateCboxGroupParent(checkboxParentId);
                        } else {
                            checkboxParentId = $selectableDemoTable.find('thead :checkbox').attr('id');
                        }

                        $('#' + checkboxParentId).on('click', function(e) {
                            var $toggleTheseCboxes;
                            if ($(this).prop('checked')) {
                                $toggleTheseCboxes = $selectableRowCboxes.not(':checked');
                            } else {
                                $toggleTheseCboxes = $selectableRowCboxes.filter(':checked');
                            }

                            $toggleTheseCboxes.closest('tr').trigger('click.cbox-demo');
                        });
                    };

                    var updateCboxGroupParent = function(checkboxParentId) {
                        var $parentCbox = $('#' + checkboxParentId);
                        var selectableRowCount = $selectableRows.length;
                        var selectedRowCount = $selectableRowCboxes.filter(':checked').length;

                        if (selectedRowCount === 0) {
                            $parentCbox
                                .prop('indeterminate', false)
                                .prop('checked', false);
                        } else if (selectedRowCount < selectableRowCount) {
                            $parentCbox
                                .prop('indeterminate', true)
                                .prop('checked', false);
                        } else if (selectedRowCount === selectableRowCount) {
                            $parentCbox
                                .prop('indeterminate', false)
                                .prop('checked', true);
                        } else {
                            // should never get here
                        }
                    };

                    if ($selectableDemoTable.length > 0) {

                        $selectableRows = $selectableDemoTable.find('tbody > tr');
                        $selectableRowCboxes = $selectableRows.find(':checkbox');

                        initCboxGroupParent();

                        $selectableRows.on('click.cbox-demo', function(e) {

                            var $checkbox = $(this).find('.checkbox');
                            var wasCboxClicked = e && ($(e.target).is($checkbox) || $(e.target).closest($checkbox).length > 0);

                            selectRow($(this), wasCboxClicked);

                        });
                    }



            function makePseudoContentSelectable($elems, pseudoElemSelector) {
                pseudoElemSelector = pseudoElemSelector || ':after';

                var pseudoStyle,
                    swatchHex,
                    computedStyleSupport = true;

                $elems.each(function() {
                    try {
                        pseudoStyle = window.getComputedStyle($(this)[0], pseudoElemSelector);
                    } catch(err) {
                        // browser doesn't support getComputedStyle()
                        computedStyleSupport = false;
                    }

                    // if browser supports computed styles
                    // copy the CSS :before content value into a data attribute
                    // on each individual cell
                    if (computedStyleSupport) {
                        try {
                            swatchHex = pseudoStyle.getPropertyValue('content').replace(/["']/g, '');
                            $(this).attr('data-pseudo-content', swatchHex);
                        } catch(err) {
                            // browser doesn't support getPropertyValue
                        }
                    }
                });

                // if browser supports computed styles
                if (computedStyleSupport) {
                    // Repaint the DOM repaint all at once
                    $elems
                        .addClass('js-content-replaced')
                        .attr('title', 'click to select the elem value');

                    var $nowrapElems = $elems.filter('.nowrap');
                    var $wrapElems = $elems.not($nowrapElems);

                    $nowrapElems
                        .html(function() {
                            return $(this).attr('data-pseudo-content') + $(this).html();
                        });

                    $wrapElems
                        .html(function() {
                            return $(this).attr('data-pseudo-content') + '\n<div class="clearfix"></div>\n' + $(this).html();
                        });

                    // Wire up click to select all text
                    selectAllNodeText($elems);
                }
            }

            function colorReferenceInfo(flexConstant, sassApiVar) {
                var str =
                    '<table class="table table-bordered">\n' +
                    '    <tbody>\n' +
                    '        <tr>\n' +
                    '           <th>FLEX:</th>\n' +
                    '           <td data-select-node-text-on-click><code>' + flexConstant + '</code></td>\n' +
                    '        </tr>\n' +
                    '        <tr>\n' +
                    '           <th>SCSS:</th>\n' +
                    '           <td data-select-node-text-on-click><code>' + sassApiVar + '</code></td>\n' +
                    '        </tr>\n' +
                    '    </tbody>\n' +
                    '</table>\n';

                return str;
            }

            if ($extendingSassSection.length > 0) {
                makePseudoContentSelectable($extendingSassSection.find('.swatch.scss-output'), ':after');
            }

            if ($colorPaletteSection.length > 0) {
                var $colorCells = $colorPaletteSection.find('td.scss-output');
                makePseudoContentSelectable($colorCells, ':after');

                // show the flex constant / sass api var in a tooltip on hover
                $colorCells.each(function() {
                    var $this = $(this);
                    var flexConstant = $this.attr('data-flex-constant');
                    var sassApiVar = $this.attr('data-sass-api-var');
                    var cellValue = $this.attr('data-pseudo-content');

                    $this.find('> .popover-trigger-icon')
                        .popover({
                            container: 'body',
                            html: true,
                            title: function() {
                                return 'Using <code>' + cellValue  + '</code> in Wdesk apps';
                            },
                            content: colorReferenceInfo(flexConstant, sassApiVar),
                            template: '<div role="tooltip" class="popover popover-tip"><div class="arrow" aria-hidden="true"></div><div class="inner"><h3 class="title"></h3><div class="content"></div></div></div>'
                        });
                });
            }

            //----------------------------------------------


            //----------------------------------------------
            //+ PROGRESS DEMOS
            //----------------------------------------------
            if ($spinnerSection.length > 0) {

                // DOWNLOADING PROGRESS SPINNER DEMO
                // -------------------------
                    $('#download-demo').click(function() {
                        var $btn = $(this);
                        var $icon = $('> .icon', this);
                        $btn.button('downloading');
                        $icon.removeClass('icon-download-available icon-downloaded')
                            .addClass('icon-downloading');
                        setTimeout(function() {
                            $btn.button('complete');
                            $icon.removeClass('icon-downloading')
                                 .addClass('icon-downloaded');
                        }, 5000);
                    });
            } // END if ($spinnerSection)
            //----------------------------------------------


            //----------------------------------------------
            //+ GRID DEMOS
            //----------------------------------------------
            if ($gridSection.length > 0) {
                // add tipsies to grid for scaffolding
                if ($('#grid-system').length) {
                  $gridSection.tooltip({
                      selector: '.show-grid > [class*=span]'
                    , title: function() { return $(this).width() + 'px'; }
                  });
                }
            } // END if ($gridSection)
            //----------------------------------------------


            //----------------------------------------------
            //+ JS BUTTON DEMOS
            //----------------------------------------------
            if ($jsButtonSection.length > 0) {
                $('#loading-btn-state-demo').click(function() {
                    var $btn = $(this);
                    $btn.button('loading');
                    setTimeout(function() {
                        $btn.button('reset');
                    }, 3000);
                });
            } // END if ($jsButtonSection)


            //----------------------------------------------
            //+ JS COLLAPSE DEMOS
            //----------------------------------------------
            if ($jsCollapseSection.length > 0) {
                var collapseID = 'demoCollapse';
                var $collapsedContent = $('#' + collapseID);
                var $collapseButton = $('[data-target=#' + collapseID + ']');

                var contentState = {
                    hide: {
                        btn_class: $collapseButton.attr('class'),
                        btn_text:  $collapseButton.text()
                    },
                    show: {
                        btn_class: 'btn btn-danger',
                        btn_text:  'Close'
                    }
                };

                $collapsedContent
                    .on('show.wdesk.collapse', function(e) {
                        $collapseButton
                            .attr('class', contentState.show.btn_class)
                            .text(contentState.show.btn_text);
                    })
                    .on('hide.wdesk.collapse', function(e) {
                        $collapseButton
                            .attr('class', contentState.hide.btn_class)
                            .text(contentState.hide.btn_text);
                    });
            } // END if ($jsCollapseSection)


            //----------------------------------------------
            //+ HELPER CLASS DEMOS
            //----------------------------------------------


            //----------------------------------------------
            //+ PANEL NOTES / COMMENTS DEMOS
            //----------------------------------------------

            // bind cancel/affirm behavior to modals and their comments
            function cancelPanelComment($modal) {
                var $confModal = $modal;
                var $thread = $confModal.closest('.panel-comments-thread');
                var $comment = $confModal.closest('.comment');
                var $textarea = $comment.find('textarea');
                var initialTextareaVal = $textarea.val();
                var $footer = $comment.find('.comment-footer');

                // remove the value and exit the editing task
                $textarea
                    .css('height', '60px')
                    .val(initialTextareaVal)
                    .trigger('change') // update flextext
                    .scrollTop(0)
                    .prop('readonly', true)
                    .blur();

                if ($comment.is('.comment-reply')) {
                    // if it was a reply - hide it
                    $comment.removeClass('show');
                    $textarea
                        .prop('readonly', false)
                        .val(null);

                    $textarea.closest('.flex-text-wrap').find('span').html('');
                }

                if ($comment.is('.comment-new')) {
                    $thread.remove();
                } else {
                    $thread.removeClass('comment-editing');
                    $comment.removeClass('comment-editing');
                    $footer.addClass('hide');
                }
            }

            if ($commentsSection.length > 0) {

                var $panelCommentThreads = $('.panel-comments-thread');
                var $panelComments = $('.panel-comment', $commentsSection);
                var $lastPanelCommentOverlay = $panelCommentThreads.find('> .panel-comment.comment-last:not(.comment-editing) .comment-reply-edit-overlay');
                var $panelCommentTextarea = $('.comment-body .form-control', $panelComments);
                var $resizableCommentTextarea = $panelCommentTextarea.not('[readonly]');
                var $threadCollapseWrappers = $panelCommentThreads.find('> .panel:first .panel-collapse');
                var $threadConfirmationModals = $panelCommentThreads.find(' > .confirmation-modal');
                var $replyCollapseWrappers;
                var $editCommentBtns = $('.panel-comments-thread').find('.edit-comment-btn');


                // add `.has-open-menu` CSS clas to thread when dropdown menu is open
                var $threadMenuButtons = $panelCommentThreads.find('.thread-actions > .dropdown');
                $threadMenuButtons
                    .on('show.wdesk.dropdown', function() {
                        $(this).closest('.panel-comments-thread').addClass('has-open-menu');
                    })
                    .on('hide.wdesk.dropdown', function() {
                        $(this).closest('.panel-comments-thread').removeClass('has-open-menu');
                    });

                // hide replies when comment thread is collapsed
                $threadCollapseWrappers
                    .on('hide.wdesk.collapse', function(e) {
                        if (!e.isDefaultPrevented()) {
                            var $this = $(this);
                            $replyCollapseWrappers = $this.closest('.panel-comments-thread').find('.panel-collapse').not($this);

                            $replyCollapseWrappers.collapse('hide');

                            $this.find('.comment-reply-edit-overlay').addClass('hide');
                        }
                    })
                    .on('hidden.wdesk.collapse', function(e) {
                        $(this).closest('.panel-comments-thread').addClass('panel-thread-collapsed');
                    })
                    .on('show.wdesk.collapse', function(e) {
                        if (!e.isDefaultPrevented()) {
                            var $this = $(this);
                            $replyCollapseWrappers = $this.closest('.panel-comments-thread').find('.panel-collapse').not($this);

                            $replyCollapseWrappers.collapse('show');
                        }
                    })
                    .on('shown.wdesk.collapse', function(e) {
                        $(this).closest('.panel-comments-thread').removeClass('panel-thread-collapsed');

                        $(this).find('.comment-reply-edit-overlay').removeClass('hide');
                    });


                // make some threads collapsed by default when the page loads
                var $autoCollapseThreads = $panelCommentThreads.find('.thread-collapse-control[data-auto-collapse]');
                $autoCollapseThreads.click();


                // check to see if a thread is collapsed before launching the delete confirmation modal
                $threadConfirmationModals.on('show.wdesk.modal', function(event) {
                    var deleteThreadButtonClicked = event.relatedTarget;
                    if (deleteThreadButtonClicked) {
                        var $that = $(this);

                        var $collapseTarget = $(event.relatedTarget.data('target'));
                        var $threadWrapper = $collapseTarget.parent('.panel-comments-thread');
                        var isCollapsed = $threadWrapper.hasClass('panel-thread-collapsed');
                        if (isCollapsed) {
                            // don't show yet
                            event.preventDefault();

                            // expand the collapsed thread, and proceed with the modal confirmation once its expanded
                            var $initialCommentCollapseWrapper = $threadWrapper.find('> .panel:first .panel-collapse');
                            $initialCommentCollapseWrapper
                                // use .one() instead of .on() so that our
                                // listener is automatically de-registered
                                .one('shown.wdesk.collapse', function(event) {
                                    $that.modal('show');
                                })
                                .collapse('show');
                        }
                    }
                });

                // $panelCommentThreads.on('click', '.btn-show-delete-thread-modal', function(event) {
                //     var $that = $(this);
                //     var modalOpts = $that.data();
                //     var $confModal = $(modalOpts.target);
                //     $confModal.modal(modalOpts);

                //     var $collapseTarget = $($that.data('target')).parent('.panel-comments-thread');
                //     if ($collapseTarget.hasClass('panel-thread-collapsed')) {
                //         // don't show yet
                //         // expand the collapsed thread, and proceed with the modal confirmation once its expanded
                //         var $firstThreadComment = $collapseTarget.find('> .panel:first .panel-collapse');
                //         $firstThreadComment
                //             .one('shown.wdesk.collapse', function(event) {
                //                 $confModal.modal('show');
                //             })
                //             .collapse('show');
                //     } else {
                //         $confModal.modal('show');
                //     }
                // });


                // bind "Reply" tooltip effect to last comment in a thread
                $lastPanelCommentOverlay
                    .on('click', function(e) {
                        var $target = $(e.target);
                        if ($target.not('.edit-comment-btn') && $target.closest('.edit-comment-btn').length === 0) {
                            var $thread = $(this).closest('.panel-comments-thread');
                            var $reply = $thread.find('.comment-reply');
                            var $textarea = $reply.find('textarea');
                            var $footer = $reply.find('.comment-footer');

                            // show the editable comment reply
                            $thread.addClass('comment-editing');
                            $reply.addClass('comment-editing');
                            $reply.addClass('show');
                            $footer.removeClass('hide');
                            $textarea
                                .css('height', '100%') // override the fixed height we apply
                                .prop('readonly', false)
                                .focus();

                            // hide any visible tooltips
                            $('.tooltip').hide();
                        }
                    })
                    .tooltip({
                        title: 'Reply',
                        placement: 'follow'
                    });

                $panelCommentThreads.find('.comment .modal')
                    .on('shown.wdesk.modal', function(e) {
                        if (!e.isDefaultPrevented()) {
                            $(this).closest('.panel-comments-thread').addClass('modal-open overlaid');
                        }
                    })
                    .on('hidden.wdesk.modal', function(e) {
                        if (!e.isDefaultPrevented()) {
                            $(this).closest('.panel-comments-thread').removeClass('modal-open overlaid');
                        }
                    });

                // bind "Edit Comment" tooltip effect
                $editCommentBtns
                    .tooltip({
                        placement: 'left auto',
                        container: 'body'
                    })
                    // prevent dupe tooltips from being open
                    .on('mouseenter', function(e) {
                        // we used a data-target on the comment to ensure the tip would have an ID
                        $('#replyTooltip').hide();
                    })
                    .on('mouseleave', function(e) {
                        $('#replyTooltip').show();
                    })
                    .on('click', function(e) {
                        var $this = $(this);
                        var $thread = $this.closest('.panel-comments-thread');
                        var $comment = $this.closest('.comment');
                        var $textarea = $comment.find('textarea');
                        var $footer = $comment.find('.comment-footer');

                        $textarea
                            .flexText('<pre><span /><br /><br /></pre>')
                            .css('height', '100%') // override the fixed height we apply
                            .prop('readonly', false)
                            .focus();

                        $thread.addClass('comment-editing');
                        $comment.addClass('comment-editing');
                        $footer.removeClass('hide');
                    });

                var refocusComment = false;
                $panelComments.find('.modal')
                    .on('show.wdesk.modal', function(event) {
                        var $confModal = $(this);
                        var $comment = $confModal.closest('.comment');
                        var $textarea = $comment.find('textarea');

                        if ($textarea.val() === '') {
                            // it is an empty comment,
                            // prevent confirmation modal from opening
                            event.preventDefault();

                            // and proceed with the logic as though
                            // the confirmation modal already appeared
                            // to immediately exit from the editing
                            // since the comment/reply was empty
                            cancelPanelComment($confModal);
                        }
                    })
                    .on('shown.wdesk.modal', function(event) {
                        var $confModal = $(this);
                        var $comment = $confModal.closest('.comment');
                        var $textarea = $comment.find('textarea');
                        var $confCancelBtn = $confModal.find('[data-cancel]');
                        var $confAffirmBtn = $confModal.find('[data-affirm]');

                        $confCancelBtn.click(function() {
                            // leave the value as is, and return the user to their editing task
                            refocusComment = true;
                        });
                        $confAffirmBtn.click(function() {
                            refocusComment = false;
                            cancelPanelComment($confModal);
                        });
                    })
                    .on('hidden.wdesk.modal', function(event) {
                        var $confModal = $(this);
                        var $comment = $confModal.closest('.comment');
                        var $textarea = $comment.find('textarea');

                        if (refocusComment) {
                            // leave the value as is, and return the user to their editing task
                            $textarea.focus();
                        }
                    });


                // keep the "focus" appearance on the panel-group when the textarea has focus.
                $resizableCommentTextarea
                    .on('focus', function(e) {
                        $(this).closest('.panel-comments-thread').addClass('panel-focus');
                    })
                    .on('blur', function(e) {
                        $(this).closest('.panel-comments-thread').removeClass('panel-focus');
                    });

                // automatically resize the height of the textarea as the user types
                $resizableCommentTextarea.flexText('<pre><span /><br /><br /></pre>');


                // disable the comment 'save' button unless there is text in the textarea
                var disableEmptyPanelCommentSaveButtons = function(val, $comment, $affirmBtn, $cancelBtn) {
                    if (val.length > 0) {
                        // $popParent.removeClass('empty-comment');
                        $affirmBtn.prop('disabled', false);
                        // $cancelBtn.prop('disabled', false);
                    } else {
                        $affirmBtn.prop('disabled', true);
                        // $cancelBtn.prop('disabled', true);
                    }
                };

                var $panelCommentTextareas = $('.comment-body textarea', '.panel-comments-thread');
                $.each($panelCommentTextareas, function() {
                    var $this = $(this);
                    var id = $this.attr('id');
                    var val = $this.val();
                    var $comment = $this.closest('.comment');
                    var $affirmBtn = $comment.find('[data-enabled-textarea=' + id + ']').filter('.post');
                    var $cancelBtn = $comment.find('[data-enabled-textarea=' + id + ']').filter('.cancel');

                    // initialize on load
                    disableEmptyPanelCommentSaveButtons(val, $comment, $affirmBtn, $cancelBtn);
                    // labelReplyCblockContainer(val, $comment);

                    if ($affirmBtn && $cancelBtn) {
                        $this.bind('keyup change', function() {
                            val = $(this).val();

                            // update again on keyup
                            disableEmptyPanelCommentSaveButtons(val, $comment, $affirmBtn, $cancelBtn);
                            // labelReplyCblockContainer(val, $comment);
                        });
                    } // END if ($affirmBtn)
                });

                // close / re-open comment threads
                $.each($panelCommentThreads, function() {
                    var $thread = $(this);
                    var $openCloseToggleBtn = $thread.find('.thread-open-close-toggle-btn');
                    var $openCloseToggleIcon = $openCloseToggleBtn.find('.icon');
                    var $openCloseToggleText = $thread.find('.thread-open-close-text');
                    var isClosed = $openCloseToggleBtn.data('threadClosed');

                    $openCloseToggleBtn.on('click', function(e) {
                        isClosed = $openCloseToggleBtn.data('threadClosed');

                        if (isClosed) {
                            $(this).data('threadClosed', false);
                            $openCloseToggleText.text('Resolve');
                            $openCloseToggleIcon
                                .removeClass('icon-comment-reopen')
                                .addClass('icon-comment-checkmark');
                            $thread.removeClass('panel-thread-closed');
                        } else {
                            $(this).data('threadClosed', true);
                            $openCloseToggleText.text('Reopen');
                            $openCloseToggleIcon
                                .removeClass('icon-comment-checkmark')
                                .addClass('icon-comment-reopen');
                            $thread.addClass('panel-thread-closed');
                        }
                    });
                });

            } // END if ($commentsSection)


            //----------------------------------------------
            //+ POPOVER NOTES / COMMENTS DEMOS
            //----------------------------------------------
            if ($commentsSection.length > 0) {

                var $popoverThreads = $('.popover-comment');

                // Single note popover demo
                // -------------------------
                    // add the overlaid class
                    // to the popover so we can darken the arrow
                    var $notePopoverConfirmationModal = $commentsSection.find('.popover .modal');

                    // add the "modal-open" css class to popover any time a modal is shown
                    var $modalConfirmations = $popoverThreads.find('.modal');
                    $.each($modalConfirmations, function() {
                        var $popParent = $(this).closest('.popover');
                        var $commentTextarea = $popParent.find('.comment-editing textarea');

                        $(this)
                            .on('backdrop_shown.wdesk.modal', function(e) {
                                $popParent.addClass('modal-open');
                            })
                            .on('backdrop_hide.wdesk.modal', function(e) {
                                $popParent.removeClass('modal-open');
                                // re-focus the textarea when closing the modal
                                $commentTextarea.focus();
                            });

                    });

                    // close / re-open comment threads
                    $.each($popoverThreads, function() {
                        var $thread = $(this);
                        var $openCloseToggleBtn = $thread.find('.thread-open-close-toggle-btn');
                        var $openCloseToggleIcon = $openCloseToggleBtn.find('.icon');
                        var $openCloseToggleText = $thread.find('.thread-open-close-text');
                        var $threadStatusElem = $thread.find('.thread-overlay .thread-status');
                        var $commentTypeIcon = $thread.find('.comment-title > .icon');
                        var isClosed = $openCloseToggleBtn.data('threadClosed');

                        $openCloseToggleBtn.on('click', function(e) {
                            isClosed = $openCloseToggleBtn.data('threadClosed');

                            if (isClosed) {
                                $(this).data('threadClosed', false);
                                $openCloseToggleText.text('Close');
                                $openCloseToggleIcon
                                    .removeClass('icon-comment-reopen')
                                    .addClass('icon-comment-checkmark');
                                $thread.removeClass('popover-thread-closed');
                                $threadStatusElem.text('');
                                $commentTypeIcon
                                    .removeClass('icon-comment-outline')
                                    .addClass('icon-comment-outline-lines');
                            } else {
                                $(this).data('threadClosed', true);
                                $openCloseToggleText.text('Reopen');
                                $openCloseToggleIcon
                                    .removeClass('icon-comment-checkmark')
                                    .addClass('icon-comment-reopen');
                                $thread.addClass('popover-thread-closed');
                                $threadStatusElem.text('Closed');
                                $commentTypeIcon
                                    .removeClass('icon-comment-outline-lines')
                                    .addClass('icon-comment-outline');
                            }
                        });
                    });

                    // delete / edit confirmation modal for saved comment in a thread
                    var isRightClick = function(e) {
                        var rightclick = false;
                        if (!e) {
                            e = window.event;
                        }
                        if (e.which) {
                            rightclick = (e.which == 3);
                        } else if (e.button) {
                            rightclick = (e.button == 2);
                        }

                        return rightclick;
                    };

                    var $savedComments = $('.popover-thread').find('.comment-readonly');
                    $.each($savedComments, function() {
                        var $savedComment = $(this);
                        var $confirmationModal = $(this).find('.modal');
                        var $confirmationTriggerBtn = $(this).find('.edit-delete-trigger');

                        $savedComment.on('contextmenu', function(e) {
                            $confirmationTriggerBtn.click();
                            return false;
                        });

                        $confirmationModal
                            .on('shown.wdesk.modal', function(e) {
                                $savedComment.off('contextmenu');
                            })
                            .on('hidden.wdesk.modal', function(e) {
                                $savedComment.on('contextmenu', function(e) {
                                    $confirmationTriggerBtn.click();
                                    return false;
                                });
                            });
                    });


                    // private / shared comment type toggle
                    var $commentTypeToggle = $('.popover-comment').find('.checkbox-switch > input');

                    $commentTypeToggle.each(function() {
                        var $thisComment = $(this).closest('.popover-comment');
                        var $commentTypeIcon = $thisComment.find('.comment-title > .icon');
                        var $commentDeleteBtn = $thisComment.find('.delete-hover');
                        var $commentSaveBtn = $thisComment.find('button[type="submit"]');
                        var $commentTextarea = $thisComment.find('.comment-body > textarea');
                        var $commentTextareaLbl = $thisComment.find('.comment-body > label');

                        var isShared = $(this).prop('checked');
                        $(this).on('change', function(e) {
                            isShared = $(this).prop('checked');

                            if (isShared) {
                                $commentTypeIcon
                                    .removeClass('icon-note')
                                    .addClass('icon-comment-outline-lines');
                                $commentDeleteBtn.text('Discard');
                                $commentSaveBtn.text('Post');
                                $commentTextarea.attr('placeholder', 'Make a shared comment...');
                            } else {
                                $commentTypeIcon
                                    .removeClass('icon-comment-outline-lines')
                                    .addClass('icon-note');
                                $commentDeleteBtn.text('Delete');
                                $commentSaveBtn.text('Save');
                                $commentTextarea.attr('placeholder', 'Enter a private comment...');
                            }

                            $commentTextareaLbl.text($commentTextarea.attr('placeholder'));
                        });
                    });

                    // automatically resize the height of the textarea as the user types
                    var $resizableTextareas = $commentsSection.find('textarea').not('[readonly]');
                    $resizableTextareas.flexText('<pre><span /><br /><br /></pre>');


                    // disable the comment 'save' button unless there is text in the textarea
                    var disableEmptyCommentSaveButtons = function(val, $comment, $popParent, $saveCommentBtn) {
                        // if the comment is empty - the delete button should not open the confirmation prompt
                        var $deleteCommentBtn = $comment.find('.comment-actions .delete-hover');

                        if (val.length > 0) {
                            $popParent.removeClass('empty-comment');
                            $saveCommentBtn.prop('disabled', false);
                            $deleteCommentBtn.prop('disabled', false);
                            // $deleteCommentBtn.bind('click', function(e) {
                            //     var targetModal = $(this).data('target');
                            //     $(targetModal).modal('show');
                            // });
                        } else {
                            $popParent.addClass('empty-comment');
                            $saveCommentBtn.prop('disabled', true);
                            $deleteCommentBtn.prop('disabled', true);
                            // $deleteCommentBtn.unbind('click');
                        }
                    };

                    var labelReplyCblockContainer = function(val, $comment) {
                        // if the comment-reply textarea is empty - the comment-reply div should have css class comment-reply-empty
                        var $commentReplyContainer = $comment.find('.comment-reply');

                        if (val.length > 0) {
                            $commentReplyContainer.removeClass('comment-reply-empty');
                        } else {
                            $commentReplyContainer.addClass('comment-reply-empty');
                        }
                    };

                    var $commentTextareas = $('.comment-body textarea, .comment-reply textarea', '.popover-comment');
                    $.each($commentTextareas, function() {
                        var $this = $(this);
                        var id = $this.attr('id');
                        var val = $this.val();
                        var $comment = $this.closest('.comment');
                        var $popParent = $this.closest('.popover');
                        var $saveCommentBtn = $popParent.find('[data-enabled-textarea=' + id + ']');

                        // initialize on load
                        disableEmptyCommentSaveButtons(val, $comment, $popParent, $saveCommentBtn);
                        labelReplyCblockContainer(val, $comment);

                        if ($saveCommentBtn) {
                            $this.bind('keyup', function() {
                                val = $(this).val();
                                // update again on keyup
                                disableEmptyCommentSaveButtons(val, $comment, $popParent, $saveCommentBtn);
                                labelReplyCblockContainer(val, $comment);
                            });
                        } // END if ($saveCommentBtn)
                    });
                // -------------------------


                // Threaded Comments Demo
                // -------------------------

                    // auto-height for saved readonly textareas
                    var $savedTextareas = $commentsSection.find('.comment-readonly textarea');
                    $.each($savedTextareas, function() {
                        $(this).height( 0 )
                               .height( this.scrollHeight );
                    });

                    // show the actions button when the 'reply' textarea is focused
                    var $replyTextareas = $commentsSection.find('.comment-reply textarea, .popover-thread .comment-body textarea').not('[readonly]');

                    var checkReplyVal = function($elem, $collapseElem) {
                        $elem.trigger('change');

                        if ($elem.closest('.modal-open').length === 0) {
                            if ($elem.val().length === 0) {
                                $collapseElem.collapse('hide');
                            }
                        }
                    };

                    $.each($replyTextareas, function() {
                        var $elem = $(this);
                        var $form = $elem.closest('.comment');
                        var $collapseMe = $form.find('.comment-actions');
                        var $collapsedMeta = $form.find('.comment-meta');

                        // $form.on('reset', function() {
                        //     setTimeout(function() {
                        //         checkReplyVal($elem, $collapseMe);
                        //     }, 5);
                        // });

                        if ($elem.closest('.new-comment').length === 0) {
                            $elem
                                .on('focus', function(e) {
                                    $collapseMe.collapse('show');
                                    $collapsedMeta.removeClass('hide');
                                })
                                .on('blur', function(e) {
                                    var that = this;

                                    setTimeout(function() {
                                        if ($elem.closest('.modal-open').length === 0) {
                                            if ($(that).val().length === 0) {
                                                $collapsedMeta.addClass('hide');
                                            }
                                        }
                                        checkReplyVal($(that), $collapseMe);
                                    }, 150);
                                 });
                        }

                    });

                // -------------------------
            } // END if ($commentsSection)


            //----------------------------------------------
            //+ DATEPICKER DEMOS
            //----------------------------------------------
            if ($datepickerSection.length > 0) {
                // $('#dp3').datepicker();
            } // END if ($datepickerSection)


            //----------------------------------------------
            //+ ICON GLYPH IFRAMES
            //----------------------------------------------
            if ($iconSection.length > 0) {

            } // END if ($iconSection)
            //----------------------------------------------

            //----------------------------------------------
            //+ DEMOS THAT ARE IN MORE THAN ONE SECTION
            //----------------------------------------------

                // Initialize tooltips / popovers
                // -------------------------
                    $('.tooltip-test').tooltip();
                    $('.popover-test').popover();

                    $('[role=main]', $footer).tooltip({
                        selector: '[data-toggle=tooltip]',
                        container: 'body',
                        html: 'true'
                    });

                    $('.tooltip-follow-demo').tooltip({
                        placement: 'follow',
                        title: 'Move your mouse cursor and watch me follow!'
                    });

                    $('[data-toggle=tooltip]').tooltip();
                    $('[data-toggle=popover]').popover();


                    var popoverMenuExampleListGroupContent =
                        '<div role="menu" class="list-group list-group-xs">\n' +
                        '  <button type="button" class="hitarea list-group-item">Select Table</button>\n' +
                        '  <button type="button" class="hitarea list-group-item">Clear Table</button>\n' +
                        '  <button type="button" class="hitarea list-group-item">Delete Table</button>\n' +
                        '  <button type="button" class="hitarea list-group-item">Table Properties</button>\n' +
                        '  <div role="separator" class="list-group-divider"></div>\n' +
                        '  <button type="button" class="hitarea list-group-item">Enter Table Focus Mode</button>\n' +
                        '  <div role="separator" class="list-group-divider"></div>\n' +
                        '  <button type="button" class="hitarea list-group-item">Start Tagging XBRL</button>\n' +
                        '</div>';

                    var popoverMenuExampleDropdownMenuContent =
                        '<div role="menu" class="dropdown-menu">\n' +
                        '  <li role="presentation" class="menu-item"><button type="button" class="hitarea">Select Table</button></li>\n' +
                        '  <li role="presentation" class="menu-item"><button type="button" class="hitarea">Clear Table</button></li>\n' +
                        '  <li role="presentation" class="menu-item"><button type="button" class="hitarea">Delete Table</button></li>\n' +
                        '  <li role="presentation" class="menu-item"><button type="button" class="hitarea">Table Properties</button></li>\n' +
                        '  <li role="separator" class="menu-item divider"></li>\n' +
                        '  <li role="presentation" class="menu-item"><button type="button" class="hitarea">Enter Table Focus Mode</button></li>\n' +
                        '  <li role="separator" class="menu-item divider"></li>\n' +
                        '  <li role="presentation" class="menu-item"><button type="button" class="hitarea">Start Tagging XBRL</button></li>\n' +
                        '</div>';

                    $('.popover-menu-example-toggle-btn')
                        .popover({
                            html: true,
                            modal: false,
                            placement: 'bottom auto',
                            container: '.ws-popover-menu-example',
                            viewport: {
                                selector: '.ws-popover-menu-example',
                                padding: 4
                            },
                            content: popoverMenuExampleDropdownMenuContent,
                            template: '<div role="tooltip" class="popover popover-menu"><div class="arrow" aria-hidden="true"></div><div class="inner"><div class="content"></div></div></div></div>'
                        })
                        .popover('show');

                    $('[data-toggle=popover]')
                        .on('show.wdesk.popover', function(e) {
                            $(this).addClass('active');
                            $(this).parent().addClass('active');
                        })
                        .on('hide.wdesk.popover', function(e) {
                            $(this).removeClass('active');
                            $(this).parent().removeClass('active');
                        });
                // -------------------------

                //
                // Tabbed docs examples
                //
                    // if anything other than the first tab is activated,
                    // we need to add a CSS class so that the top left corner of the nested
                    // .ws-example elem can be rounded
                    var $exampleTabContent = $('.example-tab-content');
                    $exampleTabContent.each(function() {
                        var $that = $(this);
                        var $toggles = $that.find('[data-toggle=tab]');

                        $toggles.on('show.wdesk.tab', function(event) {
                            var $toggle = $(this);

                            // if its the first tab
                            var firstTarget = $toggles.eq(0).data('target') || $toggles.eq(0).attr('href');
                            var thisTarget  = $toggle.data('target') || $toggle.attr('href');

                            if (thisTarget === firstTarget) {
                                $that.removeClass('first-tab-inactive');
                            } else {
                                $that.addClass('first-tab-inactive');
                            }
                        });
                    });


                // Clear search demo
                // -------------------------
                    var $clearSearch = $('.input-group-search-btn-clear > .btn');
                    if ($clearSearch.length > 0) {
                        $clearSearch.button('clearSearch');
                    }
                // -------------------------


                // Initialize all docs alerts
                // -------------------------
                    var $alerts = $('.ws-example .alert');
                    $.each($alerts, function() {
                        var isToast = $(this).hasClass('alert-toast');
                        if (!isToast) {
                            $(this).alert('show');
                        } else {
                            // don't show the toast alerts automatically
                            $(this).alert();
                        }

                        // DEBUG THE EVENTS

                        // $(this).on('shown.wdesk.alert', function(e) {
                        //             console.log('alert shown.wdesk.alert');
                        //      }).on('hidden.wdesk.alert', function(e) {
                        //             console.log('alert hidden.wdesk.alert');
                        //      });

                    });
                // -------------------------


                // Toast alert example (single, global messages)
                // -------------------------
                    setTimeout(function() {

                        var $toastTriggerBtns = $('.show-toast-alert');
                        var $exampleToastAlertContainer = $('body');

                        if ($toastTriggerBtns.length > 0) {
                            var $theToast, $triggerBtn;

                            var initToasts = function() {
                                $theToast
                                    .one('show.wdesk.alert', function(e) {
                                        $triggerBtn.off('click');
                                    })
                                    .one('hide.wdesk.alert', function(e) {
                                        var closedToastDir = e.target.dataset.toastDirection;
                                        $triggerBtn = $toastTriggerBtns.filter('[data-toast-direction="' + closedToastDir + '"]');
                                        $triggerBtn
                                            .on('click', function() { $(this).trigger('show.toast') });

                                        $triggerBtn.removeClass('active');
                                    })
                                    .alert('show');
                            };

                            var toastHTML = function(direction) {
                                var alertText = 'Your document was updated successfully.';
                                return '<div role="alert" aria-live="polite" class="alert alert-default alert-toast alert-toast-' + direction + ' alert-dismissible toast-example" data-toast-direction="' + direction + '">\n' +
                                        '<button type="button" class="close" data-dismiss="alert">\n' +
                                            '<i aria-hidden="true">&times;</i><i class="sr-only">Close</i>' +
                                        '</button>\n' +
                                        '<p>' + alertText + '</p>\n' +
                                    '</div>';
                            };

                            $toastTriggerBtns.on('click', function() {
                                $(this).trigger('show.toast');
                            });

                            $toastTriggerBtns.on('show.toast', function(e) {
                                $triggerBtn = $(this);
                                $triggerBtn.addClass('active');

                                var direction = $triggerBtn.data('toastDirection');
                                $theToast = $(toastHTML(direction)).appendTo($exampleToastAlertContainer);

                                setTimeout(initToasts, 50);
                            });
                        }

                    }, 100);

                // Toast alert example (multiple, stacked messages)
                // -------------------------
                    setTimeout(function() {

                        var $toastTriggerBtns = $('.show-toaster-alerts');
                        var exampleToastAlertContainerClass = 'alert-toaster';
                        var $exampleToastAlertContainer;

                        var toastMessages = [
                            '<p><strong>Heads Up!</strong> I&rsquo;m telling you this for your own good so you have all the info.</p>',
                            '<p><strong>Heads Up!</strong> I have something else I need to tell you about, listen carefully.</p>',
                            '<p><strong>Me again!</strong> This message will self destruct in 5, 4, 3, 2.........</p>'
                        ];

                        if ($toastTriggerBtns.length > 0) {

                            var activateDemoButton = function($btn) {
                                $btn
                                    .addClass('active js-running')
                                    .button('running');
                            };

                            var deactivateDemoButton = function($btn) {
                                $btn
                                    .removeClass('active js-running')
                                    .button('reset');
                            };

                            var selectPieceOfToast = function(toastIndex) {
                                var alertText = toastMessages[toastIndex];

                                return '<div role="alert" aria-live="polite" class="alert alert-default alert-toast alert-dismissible toast-example fade">\n' +
                                        '<button type="button" class="close" data-dismiss="alert">\n' +
                                            '<i aria-hidden="true">&times;</i><i class="sr-only">Close</i>' +
                                        '</button>\n' +
                                        alertText + '\n' +
                                    '</div>\n\n';
                            };

                            var addPieceOfToast = function(toastIndex) {
                                var toasterPositionTop = $(selectPieceOfToast(toastIndex)).closest('.alert-toaster').hasClass('alert-toaster-top');
                                var $pieceOfToast;

                                if (toasterPositionTop) {
                                    // add new pieces of toast below existing ones
                                    $pieceOfToast = $(selectPieceOfToast(toastIndex)).appendTo($exampleToastAlertContainer);
                                } else {
                                    // add new pieces of toast above existing ones
                                    $pieceOfToast = $(selectPieceOfToast(toastIndex)).prependTo($exampleToastAlertContainer);
                                }

                                $pieceOfToast
                                    .one('show.wdesk.alert', function(e) {
                                        $toastTriggerBtns.off('click');
                                    })
                                    .one('hide.wdesk.alert', function(e) {
                                        var remainingToasts = $exampleToastAlertContainer.find('.alert').length;

                                        if (remainingToasts === 1) {
                                            // the last alert is being hidden / removed.
                                            $toastTriggerBtns
                                                .on('click', function() {
                                                    $(this).trigger('show.toasts');
                                                });
                                            deactivateDemoButton($toastTriggerBtns);
                                        }
                                    });

                                // need slight delay so that fade css transitions work
                                setTimeout(function() {
                                    $pieceOfToast.alert('show');
                                }, 100);
                            };

                            var removePieceOfToast = function(toastIndex) {
                                var $pieceOfToast = $exampleToastAlertContainer.find('.alert').eq(toastIndex);

                                if ($pieceOfToast) {
                                    $pieceOfToast.alert('hide');
                                }
                            };

                            var loadToaster = function(autoUnload) {
                                autoUnload = autoUnload || false;

                                setTimeout(function() {
                                    addPieceOfToast(0);

                                    setTimeout(function() {
                                        addPieceOfToast(1);

                                        setTimeout(function() {
                                            addPieceOfToast(2);

                                            if (autoUnload) {
                                                // wait 5 seconds, then start removing pieces of toast
                                                setTimeout(function() {
                                                    unloadToaster();
                                                }, 5000);
                                            }

                                        }, 2000);
                                    }, 2000);
                                }, 0);
                            };

                            var unloadToaster = function() {
                                setTimeout(function() {
                                    removePieceOfToast(2);

                                    setTimeout(function() {
                                        removePieceOfToast(1);

                                        setTimeout(function() {
                                            removePieceOfToast(0);
                                        }, 2000);
                                    }, 2000);
                                }, 0);
                            };

                            var positionToaster = function() {
                                $exampleToastAlertContainer = $('.' + exampleToastAlertContainerClass);

                                if ($exampleToastAlertContainer.length === 0) {
                                    $exampleToastAlertContainer = $('<div class="' + exampleToastAlertContainerClass + '" />').appendTo('body');
                                }

                                //

                                var $positionOptContainer = $('.toaster-alignment-options');
                                var vPosGroupName = 'toaster-vertical-positions';
                                var hPosGroupName = 'toaster-horizontal-positions';

                                var $verticalPositionRadioGroup = $('input:radio[name="' + vPosGroupName + '"]');
                                var $horizontalPositionRadioGroup = $('input:radio[name="' + hPosGroupName + '"]');

                                // automatically update the position of the toaster when the radio buttons change values
                                $verticalPositionRadioGroup.one('change', positionToaster);
                                $horizontalPositionRadioGroup.one('change', positionToaster);

                                var verticalPositionDefault = 'bottom';
                                var verticalPosition = $verticalPositionRadioGroup.filter(':checked').val();

                                var horizontalPositionDefault = 'left';
                                var horizontalPosition = $horizontalPositionRadioGroup.filter(':checked').val();

                                var toasterPositionClasses = 'alert-toaster-' + verticalPosition + ' alert-toaster-' + horizontalPosition;

                                // modify DOM to position toaster
                                $exampleToastAlertContainer.addClass(toasterPositionClasses);
                            };

                            $toastTriggerBtns.on('click', function() {
                                positionToaster();

                                $(this).trigger('show.toasts');
                            });

                            $toastTriggerBtns.on('show.toasts', function() {
                                activateDemoButton($(this));
                                loadToaster(true);
                            });
                        }

                    }, 100);
                // -------------------------

                // Make sure css3 animations
                // don't play until they are
                // scrolled into view
                // -------------------------

                    // Returns true if the specified element has been scrolled into the viewport.
                    var isElementInViewport = function(elem) {
                        var $elem = $(elem);

                        // Get the scroll position of the page.
                        var scrollElem = ((navigator.userAgent.toLowerCase().indexOf('webkit') !== -1) ? 'body' : 'html');
                        var viewportTop = $(scrollElem).scrollTop();
                        var viewportBottom = viewportTop + $(window).height();

                        // Get the position of the element on the page.
                        var elemTop = Math.round( $elem.offset().top );
                        var elemBottom = elemTop + $elem.height();

                        return ((elemTop < viewportBottom) && (elemBottom > viewportTop));
                    };

                    // Check if it's time to start the animation.
                    var checkAnimation = function() {

                        $.each($animatedElems, function() {
                            var $this = $(this);
                            if (isElementInViewport($this)) {
                                if ($this.hasClass('js-play')) return;
                                // Start the animation
                                $this.addClass('js-play');
                            } else {
                                $this.removeClass('js-play');
                            }
                        });

                    };

                    if (gtIE8) {
                        // Capture scroll events (debounced)
                        $scrollSpyContentElem.smartscroll(function() {
                            checkAnimation();
                        });
                        // one time on load
                        checkAnimation();
                    }

            //----------------------------------------------

            var $globalHelpTabDemo = $('.global-help-tab');

            if ($globalHelpTabDemo) {

                $.each($globalHelpTabDemo, function() {
                    var $this = $(this);
                    $this
                        .on('show', function() {
                            $(this).parent('li').addClass('active');
                        })
                        .on('hide', function() {
                            $(this).parent('li').removeClass('active');
                        });

                    // substitute for ui mutex
                    var $navbar = $this.closest('.navbar');
                    $navbar.click(function(e) {
                        var $target = $(e.target);
                        var $popButton = ($target.hasClass('.global-help-tab') || $target.closest('.global-help-tab').length > 0);
                        var $pop = $('#' + $this.data('target'));
                        if (!$popButton && $pop.length > 0) {
                            $this.popover('hide');
                        }
                    });
                });
            }

            typeof console !== 'undefined' && debugMethodOrder && console.log('initializeDocsJsDemos(end)');

        } // END initializeDocsJsDemos()

    //----------------------------------------------


    //----------------------------------------------
    //+ METHOD CALL CONTROL
    //  (control when this stuff goes boom)
    //
        var debugMethodOrder = false;
    //
    //----------------------------------------------

        // INITIALIZE OPTIONS
        if (gtIE8) {
            initializeDocsJsOptions();
        }

        // INITIALIZE CORE DOCS JS
        initializeDocsJsCore();

        // INITIALIZE DEMO DOCS JS
        initializeDocsJsDemos();


        // special href="#name" anchors
        // that should go to that location on
        // the page, but then also toggle a tab
        $(document).on('click', '[data-tabs]', function(e) {
            var $this = $(this);
            var tabSet = $this.data('tabs');
            var tabHref = $this.data('target');

            var $toggleTab = $(tabSet).find('[href=' + tabHref + ']');

            $toggleTab && $toggleTab.tab('show');
        });

    //----------------------------------------------

});}(jQuery);

$(function() {

    var $datepickerSection = $('#datepicker-section');

    if ($datepickerSection.length > 0) {

        var $optionsExpandTriggerElem = $('.dp-options-panel-expand-trigger');
        var expandThis = $optionsExpandTriggerElem.data('target');
        var $optionsPanelHeading = $('#dp').find('[data-target=' + expandThis + ']');

        $optionsExpandTriggerElem.click(function(e) {
            if (! $optionsPanelHeading.hasClass('open')) {
                $optionsPanelHeading.click();
            }
        });

        // determine what options have changed for use in jQuery event
        var existingFormOptions, updatedFormOptions;

        $('#dp-options-panel').on('show.wdesk.collapse', function(e) {
            ga('send', 'event', 'Interactive', 'Datepicker Options', 'Show');
        });

        for (var lang in $.fn.datepicker.dates) {
            if (!$('#language option[value='+lang+']').length) {
                $('<option value="'+lang+'">'+lang+'</option>').appendTo('#language');
            }
        }
        $('#language').trigger("chosen:updated");

        var defaults = {},
                defaults_form = $('<form>', {html: $('.dp-form').html()})
        $.each(defaults_form.serializeArray(), function(i,e){
            if (e.name in defaults)
                defaults[e.name] += ',' + e.value;
            else
                defaults[e.name] = e.value;
        });
        delete defaults.markup;

        function fix_indent(s) {
            var lines = s && s.split(/\r?\n/g);
            var returnMe = false;

            if (lines) {
                while (/^\s*$/.test(lines[0])) lines.shift();
                while (/^\s*$/.test(lines[lines.length-1])) lines.pop();
                var indent = /^\s*/.exec(lines[0])[0],
                        deindent = new RegExp('^' + indent);
                for (var i=0; i<lines.length; i++)
                    lines[i] = lines[i].replace(deindent, '');
                returnMe = lines.join('\n');
            }

            return returnMe;
        }

        function build_code() {
            var form = $('.dp-form'),
                values = {};
            $.each(form.serializeArray(), function(i,e){
                if (e.name in values)
                    values[e.name] += ',' + e.value;
                else
                    values[e.name] = e.value;
            });

            if (values.markup) {
                var html = fix_indent($('[name=markup][value='+values.markup+']').siblings('script.html').html());
                var selector = $('[name=markup][value='+values.markup+']').siblings('script.selector').html().replace(/^\s+|\s+$/g, '');
                delete values.markup;

                var js = '$("#dp-container '+selector+'").datepicker({\n',
                        val;
                for (var opt in $.extend({}, defaults, values)){
                    if (values[opt] != defaults[opt]){
                        val = values[opt];
                        if (opt == 'daysOfWeekDisabled') val = '"'+val+'"'
                        else if (opt == 'beforeShowDay') val = function(date){
                            if (date.getMonth() == (new Date()).getMonth())
                                switch (date.getDate()){
                                    case 4:
                                        return {
                                            tooltip: 'Example tooltip',
                                            classes: 'active'
                                        };
                                    case 8:
                                        return false;
                                    case 12:
                                        return "green";
                                }
                        }
                        else if (val == 'on' || val == 'true') val = 'true';
                        else if (val === void 0 || val == 'false') val = 'false';
                        else if (parseInt(val) == val) val = val;
                        else val = '"'+val+'"'
                        js += '        ' + opt + ': ' + val + ',\n'
                    }
                }
                if (js.slice(-2) == ',\n')
                    js = js.slice(0,-2) + '\n';
                js += '});';

                return [html, js];
            } else {
                return false;
            }
        }
        function update_code() {
            var code = build_code(),
                    html = code[0],
                    js = code[1];

            if (html || js) {
                if (html) {
                    var print_html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    $('#dp-html').html(prettyPrintOne(print_html, 'html', true));
                }
                if (js) {
                    $('#dp-js').html(prettyPrintOne(js, 'js', true));
                }
                $('#dp').find('.chosen').trigger("chosen:updated");
            }
        }
        function update_dp() {
            var code = build_code(),
                    html = code[0],
                    js = code[1];

            if (html || js) {
                if (html) {
                    $('#dp-container > :first-child').datepicker('remove');
                    $('#dp-container').html(html);
                }
                if (js) {
                    setTimeout(function() {
                        eval(js);
                    }, 200);
                }
            }
        }
        function update_url() {
            var serializedForm = $('.dp-form').serialize();
            if (history.replaceState){
                var query = '?' + serializedForm;
                history.replaceState(null, null, query + '#datepicker');
            }

            // compare the previous options and these new options, and if there is a difference, broadcast an event to GA
            updatedFormOptions = $('.dp-form').serializeObject();
            var diff = compareObjects(existingFormOptions, updatedFormOptions);

            if (diff[0]) {
                send_dp_options_ga_event(updatedFormOptions, diff);

                // Reset existingFormOptions equal to updated ones
                existingFormOptions = updatedFormOptions;
            }
        }
        function update_form_opts() {
            // if inline dp-type is chosen... make sure we denote that keyboard navigation is disabled
            var dpTypeIsInline = $('.dp-form #markup-inline').is(':checked');
            var $keyboardNavOption = $('.dp-form #dp-opts').find('#keyboardNavigation');
            var keyboardNavigationOptionWasOn = $keyboardNavOption.is(':checked');
            if (dpTypeIsInline) {
                // disable keyboard navigation option
                $keyboardNavOption
                    .prop('disabled', true)
                    .closest('.checkbox')
                        .addClass('disabled')
                        .attr('title', 'Keyboard navigation cannot be used with inline datepicker type');
            } else {
                $keyboardNavOption
                    .prop('checked', keyboardNavigationOptionWasOn)
                    .prop('disabled', false)
                    .closest('.checkbox')
                        .removeClass('disabled')
                        .removeAttr('title');
            }
        }
        function update_all() {
            update_form_opts();
            update_code();
            update_dp();
            update_url();
        }
        function send_dp_options_ga_event(updatedFormOptions, diff) {
            var dpType = updatedFormOptions.markup;
            var optName = diff[0][1];
            var optWas = diff[0][2];
            var optIs = diff[0][3];

            var gaLabel = optName + ' = ' + optIs;
            if (optName != 'markup') {
                gaLabel = dpType + ':' + gaLabel;
            }

            try {
                ga('send', 'event', 'Interactive', 'Datepicker Options', gaLabel);
            } catch(err) {
                // something went wrong trying to broadcast GA event
            }
        }

        $('.dp-form').submit(function() { return false; });
        $('.dp-form #dp-type')
            .find('input')
                .click(update_all);
        $('.dp-form #dp-opts')
            .find('input, select, button')
                .blur(update_all)
                .change(update_all);

        $('.dp-form button[type=reset]').click(function(e) {
            $('.dp-form')[0].reset();
            update_code();
            update_dp();
            history.replaceState && history.replaceState(null, null, document.location.pathname + document.location.hash);

            try {
                ga('send', 'event', 'Interactive', 'Datepicker Options', 'Reset');
            } catch(err) {
                // something went wrong trying to broadcast GA event
            }
        });

        $('.dp-form button[type=reset]').on('nav-trigger-click', function(e) {
            $('.dp-form')[0].reset();
            update_code();
            update_dp();
            history.replaceState && history.replaceState(null, null, document.location.pathname);
        });

        // clicking a non-datepicker nav-element in the sidenav should trigger the reset
        var $sidenavChoices = $('.ws-sidenav').find('.hitarea');
        $sidenavChoices.on('click', function(e) {
            var $this = $(this);
            if ($this.attr('href').indexOf('datepicker') < 0) {
                // was not a datepicker nav selection...
                $('.dp-form button[type=reset]').trigger('nav-trigger-click');
            }
        });

        setTimeout(function() {
            // Load form state from url if possible
            var search = document.location.search.replace(/^\?/, '');
            if (search){
                search = search.split('&');
                var values = {};
                for (var i=0, opt, val; i<search.length; i++){
                    opt = search[i].split('=')[0];
                    val = search[i].split('=')[1];
                    if (opt in values)
                        values[opt] += ',' + val;
                    else
                        values[opt] = val;
                }

                for (var opt in $.extend({}, defaults, values)){
                    var el = $('[name='+opt+']'),
                            val = unescape(values[opt]);
                    if (el.is(':checkbox')){
                        if (el.length > 1){
                            var vals = val.split(',');
                            $('[name='+opt+']').prop('checked', false);
                            for (var i=0; i<vals.length; i++) {
                                $('[name='+opt+'][value='+vals[i]+']').prop('checked', true);
                            }
                        } else if (val === 'undefined') {
                            el.prop('checked', false);
                        } else {
                            el.prop('checked', true);
                        }
                    } else if (el.is(':radio')){
                        el.filter('[value='+val+']').prop('checked', true);
                    } else if (el.is('select')) {
                        if (el.attr('multiple')){
                            var vals = val.split(',');
                            el.find('option').prop('selected', false);
                            for (var i=0; i<vals.length; i++) {
                                el.find('option[value='+vals[i]+']').prop('selected', true);
                            }
                        } else {
                            el.find('option[value='+val+']').prop('selected', true);
                        }
                    } else {
                        el.val(val);
                    }
                }
            }

            // Don't replaceState the url on pageload
            update_form_opts();
            update_code();
            update_dp();

            // store the existing form options on page load
            existingFormOptions = $('.dp-form').serializeObject();
        }, 300);

        // Analytics event tracking
        // What options are people interested in?
        // $('.dp-form input, .dp-form select').change(function(e){
        //     var $this = $(this),
        //             val, opt;
        //     opt = $this.attr('name');
        //     val = $this.val();
        //     if ($this.is(':checkbox') && val == 'on')
        //         val = $this.is(':checked') ? 'on' : 'off';
        //     _gaq.push(['_trackEvent', 'Sandbox', 'Option: ' + opt, val]);
        // });
        // Do they even use the reset button?
        // $('.dp-form button[type=reset]').click(function() {
        //     _gaq.push(['_trackEvent', 'Sandbox', 'Reset']);
        // });

        // var flag=0, mousedown=false, delta=0, x=0, y=0, dx, dy;
        // How do they interact with the HTML display?    Do they select
        // the code, do they try to edit it (I'd want to!)?
        // $('#dp-html').mousedown(function(e){
        //     mousedown = true;
        //     delta = 0; x=e.clientX; y=e.clientY;
        // });
        // $('#dp-html').mousemove(function(e){
        //     if (mousedown){
        //         dx = Math.abs(e.clientX-x);
        //         dy = Math.abs(e.clientY-y);
        //         delta = Math.max(dx, dy);
        //     }
        // });
        // $('#dp-html').mouseup(function() {
        //     if (delta <= 10)
        //         _gaq.push(['_trackEvent', 'Sandbox', 'HTML Clicked']);
        //     else
        //         _gaq.push(['_trackEvent', 'Sandbox', 'HTML Selected']);
        //     delta = 0;
        //     mousedown = false;
        // });

        // How do they interact with the JS display?    Do they select
        // the code, do they try to edit it (I'd want to!)?
        // $('#dp-js').mousedown(function(e){
        //     mousedown = true;
        //     delta = 0; x=e.clientX; y=e.clientY;
        // });
        // $('#dp-js').mousemove(function(e){
        //     if (mousedown){
        //         dx = Math.abs(e.clientX-x);
        //         dy = Math.abs(e.clientY-y);
        //         delta = Math.max(dx, dy);
        //     }
        // });
        // $('#dp-js').mouseup(function() {
        //     if (delta <= 10)
        //         _gaq.push(['_trackEvent', 'Sandbox', 'JS Clicked']);
        //     else
        //         _gaq.push(['_trackEvent', 'Sandbox', 'JS Selected']);
        //     delta = 0;
        //     mousedown = false;
        // });
    }
});