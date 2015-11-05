!function($) { $(function() {

    var $demoForms     = $('.wdesk-login-form-demo');
    var $loginMainRow  = $('.row-login-main');
    var $usernameField = $('#username');
    var $ssoUsernameField = $('#ssoUsername');
    var $resetPwUsernameField = $('#resetPwUsername');
    var $passwordField = $('#password');


    // -------------------------------------
    //   Navigate the views using buttons
    //   -> so we can preserve things like
    //      location.search throughout the
    //      login page demos
    // -------------------------------------
    var linkButtonSelector = 'button[data-href]';
    $(document).on('click', linkButtonSelector, function(event) {
        if ($(this).attr('type') !== 'submit') {
            var href = $(this).data('href');
            window.location.href = href + window.location.search;
        }
    });


    // -------------------------------------
    //   Toggle layout with/without mktg img
    // -------------------------------------
    $.enableHeroImage = function() {
        $loginMainRow.attr('data-has-hero-img', true);
    };

    $.disableHeroImage = function() {
        $loginMainRow.attr('data-has-hero-img', false);
    };

    // check url query string to see if we should be
    // showing the marketing image or now
    var heroImgOption = $.getQueryVariable('hero');
    var showHeroImg = heroImgOption === 'false' ? false : true;

    if (!showHeroImg) {
        $.disableHeroImage();
    }


// -------------------------------------
//   Demo Form Validation
//   --> Using BootstrapValidator
//       http://bootstrapvalidator.com/
// -------------------------------------
    var loginFormErrorAlertTimerId = 0;

    var $loginFormErrorAlert = $('#login-form-error-alert');
    var $loginFormErrorAlertMsgList = $('#login-form-error-alert-msgs');
    var $loginFormSuccessAlert = $('#login-form-success-alert');

    var $loginForm = $('#wdesk-login-form');
    var $ssoLoginForm = $('#wdesk-login-sso-form');
    var $loginHelpForm = $('#wdesk-login-help-form');
    var $loginHelpConfirmForm = $('#wdesk-login-help-confirm-form');
    var $signInContinueBtn = $loginHelpConfirmForm.find('#signin-continue');

    if ($loginForm.length > 0) {
        // focus the username field when the page first loads
        $usernameField.focus();

        initWdeskLoginDemoFormValidation($loginForm);
    }

    if ($ssoLoginForm.length > 0) {
        // focus the sso username field when the page first loads
        $ssoUsernameField.focus();

        initWdeskLoginDemoFormValidation($ssoLoginForm);
    }

    if ($loginHelpForm.length > 0) {
        // focus the username field when the page first loads
        $resetPwUsernameField.focus();

        initWdeskLoginDemoFormValidation($loginHelpForm);
    }

    if ($loginHelpConfirmForm.length > 0) {
        // focus the sign in button when the page first loads
        $signInContinueBtn.focus();
    }

    function initWdeskLoginDemoFormValidation($form) {

        // ----- METHODS ----- //
        function showFormValidationSuccessAlert() {
            hideFormValidationErrorAlert();

            $loginFormSuccessAlert
                .attr('aria-hidden', false)
                .addClass('in');
        }

        function hideFormValidationSuccessAlert() {
            $loginFormSuccessAlert
                .attr('aria-hidden', true)
                .removeClass('in');
        }

        function showFormValidationErrorAlert() {
            hideFormValidationSuccessAlert();

            $loginFormErrorAlert
                .attr('aria-hidden', false)
                .addClass('in');

            clearTimeout(loginFormErrorAlertTimerId);

            // start timer to auto-hide the alert
            loginFormErrorAlertTimerId = setTimeout(function() {
                hideFormValidationErrorAlert();
            }, 5000);
        }

        function hideFormValidationErrorAlert() {
            clearTimeout(loginFormErrorAlertTimerId);

            $loginFormErrorAlert
                .attr('aria-hidden', true)
                .removeClass('in');
        }

        function checkValidatorMessages() {
            var errCount = $loginFormErrorAlertMsgList.find('li').length;

            if (errCount === 0) {
                hideFormValidationErrorAlert();
            }
        }

        function focusFirstErrorField() {
            var $errorGroups = $form.find('.form-group.has-error');
            $errorGroups.first().find(':input').focus();
        }

        // ----- CONFIGURATION ----- //
        $form.bootstrapValidator({
            container: '#dummy-validation-msgs-container',
            live: 'submitted',
            fields: {
                ssoUsername: {
                    validators: {
                        notEmpty: {
                            message: 'You must enter your username or email address to sign in using SSO.'
                        }
                    }
                },
                resetPwUsername: {
                    validators: {
                        notEmpty: {
                            message: 'You must enter your username to reset your password.'
                        }
                    }
                },
                username: {
                    validators: {
                        notEmpty: {
                            message: 'You must enter your username to sign in.'
                        }
                    }
                },
                password: {
                    validators: {
                        notEmpty: {
                            message: 'You must enter your password to sign in.'
                        }
                    }
                }
            }
        });


        // ----- EVENT WIRING ----- //
        $form
            .on('success.form.bv', function(e) {
                e.preventDefault(); // don't actually submit the form - this is just a demo.

                var that = this;

                // Reset the message element when the form is valid
                $loginFormErrorAlertMsgList.html('');

                // Redirect the user to the data-href of the submit button if it exists
                setTimeout(function() {
                    var $submitBtn = $(that).find('button[type="submit"]').not('.bv-hidden-submit');
                    var href = $submitBtn.data('href');

                    if (href) {
                        window.location.href = href + window.location.search;
                    }
                }, 1000);

                // Show the form validation success alert when the form is valid
                showFormValidationSuccessAlert();
            })

            .on('error.form.bv', function(e) {
                // Show the form validation error alert when the form is invalid
                showFormValidationErrorAlert();
            })

            .on('error.field.bv', function(e, data) {
                // data.bv      --> The BootstrapValidator instance
                // data.field   --> The field name
                // data.element --> The field element

                // Get the messages of field
                var messages = data.bv.getMessages(data.element);

                // Remove the field messages if they're already available
                $loginFormErrorAlertMsgList.find('li[data-field="' + data.field + '"]').remove();

                // Loop over the messages
                var elementTitle = '';
                for (var i in messages) {
                    elementTitle += messages[i] + '. ';
                    // Create new 'li' element to show the message
                    $('<li/>')
                        .attr('data-field', data.field)
                        .wrapInner(
                            $('<button/>')
                                .attr({
                                    'type': 'button',
                                    'class': 'hitarea'
                                })
                                .html(messages[i])
                                /* jshint ignore:start */
                                .on('click', function(e) {
                                    // Focus on the invalid field
                                    data.element.focus();
                                })
                                /* jshint ignore:end */
                        )
                        .appendTo($loginFormErrorAlertMsgList);
                }

                // Add some error meta to the element itself
                data.element
                    .attr({
                        'aria-invalid': 'true',
                        'title': elementTitle
                    });

                // Show the custom message alert container
                showFormValidationErrorAlert();
            })

            .on('success.field.bv', function(e, data) {
                // Update error meta to the element itself
                data.element
                    .attr({
                        'aria-invalid': 'false'
                    })
                    .removeAttr('title');

                // Remove the field messages
                $loginFormErrorAlertMsgList.find('li[data-field="' + data.field + '"]').remove();

                checkValidatorMessages();
            });


        // ----- CUSTOM ALERT DISMISSAL ----- //
        // we don't want the alert to be removed from the page, so we'll roll our own dismissal.
        $(document).on('click.wdesk.login-alert.data-api', '[data-custom-dismiss="alert"]', function(event) {
            var $alert = $(this).closest('.alert');

            $alert
                .attr('aria-hidden', 'true')
                .removeClass('in');

            if ($alert.is($loginFormErrorAlert)) {
                focusFirstErrorField();
            }
        });
    }

});}(jQuery);
