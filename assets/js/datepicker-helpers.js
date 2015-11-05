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