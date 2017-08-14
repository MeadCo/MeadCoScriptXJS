// MeadCo.ScriptX.Print.UI
//
// Depends on MeadCo.ScriptX.Print.HTML
//
// A lightweight plug-in not implemented as a plug-in as it will only be used once or twice on a document
// so polluting jQuery is unneccessary.
//
// Trigger AttachPrintAction with attrubute data-meado-ui = "print"
//

(function (topLevelNs, $, undefined) {
    "use strict";

    var ui = MeadCo.createNS("MeadCo.ScriptX.Print.UI");

    ui.moduleversion = "0.0.1.1";

    // MeadCo.ScriptX.Print.UI.AttachPrintAction(
    //  id - id of clickable element
    //
    ui.AttachPrintAction = function (el) {
        console.log("starting PrintUI.AttachPrintAction");

        var $to = $(el);

        $to.click(function () {
            var $this = $(this);

            switch ($this.data("action")) {
                case "document":
                    break;

                case "remote":
                    MeadCo.ScriptX.Print.HTML.printFromUrl($this.data("url"));
                    break;

                case "element":
                    break;
            }
        });
    }

    console.log("Autostart meadco.PrintUI ...");

    $("[data-meadco-ui='print']").each(function (i) {
        ui.AttachPrintAction(this);
    });

    // MeadCo.ScriptX.Print.UI.PageSetup()
    ui.PageSetup = function () {
        // page setup modal to attach to the page
        if (!$('#dlg-printoptions').length) {
            var dlg = '<style>' +
                        '.modal-dialog legend { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; } ' +
                        '.modal-dialog fieldset { padding-bottom: 0px; } ' +
                        '.modal-dialog .options-modal-body { padding-bottom: 0px !important; } ' +
                        '.modal-dialog .checkbox2 {  padding-top: 0px !important; min-height: 0px !important; } ' +
                        '.modal-dialog .radio2 { padding-top: 0px !important; min-height: 0px !important; } ' +
                    '</style>' +
                    '<div class="modal fade" id="dlg-printoptions">' +
                        '<div class="modal-dialog">' +
                            '<div class="modal-content">' +
                                '<div class="modal-header">' +
                                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                                    '<h4 class="modal-title">Page setup</h4>' +
                                '</div>' +
                                '<div class="modal-body form-horizontal options-modal-body">' +
                                    '<fieldset>' +
                                        '<legend>Paper</legend>' +
                                        '<div class="form-group">' +
                                            '<label class="col-md-4 control-label" for="fld-papersize">Size</label>' +
                                            '<select class="selectpicker col-md-8 show-tick show-menu-arrow" id="fld-papersize">' +
                                            '</select>' +
                                        '</div>' +
                                        '<div class="form-group">' +
                                            '<div class="col-md-offset-4 col-md-8">' +
                                                '<div class="radio2">' +
                                                    '<label class="radio-inline">' +
                                                        '<input type="radio" value="2" id="fld-portrait" name="fld-orientation">' +
                                                        ' Portrait' +
                                                    '</label>' +
                                                    '<label class="radio-inline">' +
                                                        '<input type="radio" value="1" id="fld-landscape" name="fld-orientation">' +
                                                        ' Landscape' +
                                                    '</label>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="form-group">' +
                                            '<div class="col-md-offset-4 col-md-8">' +
                                                '<div class="checkbox2">' +
                                                    '<label class="checkbox-inline">' +
                                                        '<input type="checkbox" name="fld-shrinktofit" id="fld-shrinktofit">' +
                                                        ' Shrink to fit' +
                                                    '</label>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="form-group">' +
                                            '<div class="col-md-offset-4 col-md-8">' +
                                                '<div class="checkbox2">' +
                                                    '<label class="checkbox-inline">' +
                                                        '<input type="checkbox" name="fld-printbackground" id="fld-printbackground">' +
                                                        ' Print background colour and images' +
                                                    '</label>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</fieldset>' +
                                    '<fieldset>' +
                                        '<legend>Margins</legend>' +
                                        '<div class="form-group">' +
                                            '<div class="col-md-offset-4 col-md-8">' +
                                                '<div class="radio2">' +
                                                    '<label class="radio-inline">' +
                                                        '<input type="radio" value="2" id="fld-millimetres" name="fld-measure">' +
                                                        ' Millimetres' +
                                                    '</label>' +
                                                    '<label class="radio-inline">' +
                                                        '<input type="radio" value="1" id="fld-inches" name="fld-measure">' +
                                                        ' Inches' +
                                                    '</label>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="form-group">' +
                                            '<label class="control-label col-md-4">Left</label>' +
                                            '<div class="col-md-3">' +
                                                '<div class="input-group spinner" data-trigger="spinner">' +
                                                    '<input name="fld-marginL" id="fld-marginL" type="text" class="form-control text-right" data-rule="currency" value="1" />' +
                                                    '<span class="input-group-addon">' +
                                                        '<a class="spin-up" href="javascript:;" data-spin="up">' +
                                                            '<i class="fa fa-caret-up"></i>' +
                                                        '</a>' +
                                                        '<a class="spin-down" href="javascript:;" data-spin="down">' +
                                                            '<i class="fa fa-caret-down"></i>' +
                                                        '</a>' +
                                                    '</span>' +
                                                '</div>' +
                                            '</div>' +
                                            '<label class="control-label col-md-2">Top</label>' +
                                            '<div class="col-md-3">' +
                                                '<div class="input-group spinner" data-trigger="spinner">' +
                                                    '<input name="fld-marginT" id="fld-marginT" type="text" class="form-control text-right" data-rule="currency" value="1" />' +
                                                    '<span class="input-group-addon">' +
                                                        '<a class="spin-up" href="javascript:;" data-spin="up">' +
                                                            '<i class="fa fa-caret-up"></i>' +
                                                        '</a>' +
                                                        '<a class="spin-down" href="javascript:;" data-spin="down">' +
                                                            '<i class="fa fa-caret-down"></i>' +
                                                        '</a>' +
                                                    '</span>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="form-group">' +
                                            '<label class="control-label col-md-4">Right</label>' +
                                            '<div class="col-md-3">' +
                                                '<div class="input-group spinner" data-trigger="spinner">' +
                                                    '<input name="fld-marginR" id="fld-marginR" type="text" class="form-control text-right" data-rule="currency" value="1" />' +
                                                    '<span class="input-group-addon">' +
                                                        '<a class="spin-up" href="javascript:;" data-spin="up">' +
                                                            '<i class="fa fa-caret-up"></i>' +
                                                        '</a>' +
                                                        '<a class="spin-down" href="javascript:;" data-spin="down">' +
                                                            '<i class="fa fa-caret-down"></i>' +
                                                        '</a>' +
                                                    '</span>' +
                                                '</div>' +
                                            '</div>' +
                                            '<label class="control-label col-md-2">Bottom</label>' +
                                            '<div class="col-md-3">' +
                                                '<div class="input-group spinner" data-trigger="spinner">' +
                                                    '<input name="fld-marginB" id="fld-marginB" type="text" class="form-control text-right" data-rule="currency" value="1" />' +
                                                    '<span class="input-group-addon">' +
                                                        '<a class="spin-up" href="javascript:;" data-spin="up">' +
                                                            '<i class="fa fa-caret-up"></i>' +
                                                        '</a>' +
                                                        '<a class="spin-down" href="javascript:;" data-spin="down">' +
                                                            '<i class="fa fa-caret-down"></i>' +
                                                        '</a>' +
                                                    '</span>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</fieldset>' +
                                    '<fieldset>' +
                                        '<legend>Headers and footers</legend>' +
                                        '<div class="form-group">' +
                                            '<label class="control-label col-md-4">Header</label>' +
                                            '<div class="col-md-8">' +
                                                '<input type="text" name="fld-header" id="fld-header" class="form-control" style="max-width: none !important;" />' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="form-group">' +
                                            '<label class="control-label col-md-4">Footer</label>' +
                                            '<div class="col-md-8">' +
                                                '<input type="text" name="fld-footer" id="fld-footer" class="form-control" style="max-width: none !important;" />' +
                                            '</div>' +
                                        '</div>' +
                                    '</fieldset>' +
                                '</div>' +
                                '<div class="modal-footer">' +
                                    '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                                    '<button type="button" class="btn btn-primary" id="btn-saveoptions">Save changes</button>' +
                                '</div>' +
                            '</div>' +
                            '<!-- /.modal-content -->' +
                        '</div>' +
                        '<!-- /.modal-dialog -->' +
                    '</div>' +
                    '<!-- /.modal -->';
            $('body').append(dlg);

            $('#btn-saveoptions').click(function (ev) {
                ev.preventDefault();
                ui.SavePageSetup();
                $('#dlg-printoptions').modal('hide');
            });

            $('[name="fld-measure"]').on('change', function () {
                switch ($(this).val()) {
                    case '2': // mm from inches
                        $('#dlg-printoptions input[type=text][data-rule=currency]').each(function () {
                            ui.convertAndDisplayinchesToMM($(this));
                        });
                        break;

                    case '1': // inches from mm
                        $('#dlg-printoptions input[type=text][data-rule=currency]').each(function () {
                            ui.convertAndDisplayMMtoInches($(this));
                        });
                        break;
                }
            });

            $('#dlg-printoptions [data-trigger="spinner"]').spinner();
        }
        ui.SetPageSetupDialog();

        $('#dlg-printoptions').modal('show');
        $('#dlg-printoptions .selectpicker').selectpicker('refresh');
    };

    // MeadCo.ScriptX.Print.UI.PrinterSettings()
    ui.PrinterSettings = function () {
        // printer settings modal to attach to the page
        if (!$('#dlg-printersettings').length) {
            var dlg = '<style>' +
                    '.modal-dialog legend { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; } ' +
                    '.modal-dialog fieldset { padding-bottom: 0px; } ' +
                    '.modal-dialog .options-modal-body { padding-bottom: 0px !important; } ' +
                    '.modal-dialog .checkbox2 {  padding-top: 0px !important; min-height: 0px !important; } ' +
                    '.modal-dialog .radio2 { padding-top: 0px !important; min-height: 0px !important; } ' +
                '</style>' +
                '<div class="modal fade" id="dlg-printersettings">' +
                    '<div class="modal-dialog">' +
                        '<div class="modal-content">' +
                            '<div class="modal-header">' +
                                '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                                '<h4 class="modal-title">Print options</h4>' +
                            '</div>' +
                            '<div class="modal-body form-horizontal options-modal-body">' +
                                '<fieldset>' +
                                    '<legend>Printer</legend>' +
                                    '<div class="form-group">' +
                                        '<label class="col-md-4 control-label" for="fld-printerselect">Printer</label>' +
                                        '<select class="selectpicker col-md-8 show-tick show-menu-arrow" id="fld-printerselect">' +
                                        '</select>' +
                                    '</div>' +
                                    '<div class="form-group">' +
                                        '<label class="col-md-4 control-label" for="fld-papersource">Paper source</label>' +
                                        '<select class="selectpicker col-md-8 show-tick show-menu-arrow" id="fld-papersource">' +
                                        '</select>' +
                                    '</div>' +
                                    '<div class="form-group">' +
                                        '<label class="control-label col-md-4">Copies</label>' +
                                        '<div class="col-md-3">' +
                                            '<div class="input-group spinner" data-trigger="spinner">' +
                                                '<input name="fld-copies" id="fld-copies" type="text" class="form-control text-right" data-rule="quantity" value="1" />' +
                                                '<span class="input-group-addon">' +
                                                    '<a class="spin-up" href="javascript:;" data-spin="up">' +
                                                        '<i class="fa fa-caret-up"></i>' +
                                                    '</a>' +
                                                    '<a class="spin-down" href="javascript:;" data-spin="down">' +
                                                        '<i class="fa fa-caret-down"></i>' +
                                                    '</a>' +
                                                '</span>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="col-md-5">' +
                                            '<div class="checkbox2">' +
                                                '<label class="checkbox-inline">' +
                                                    '<input type="checkbox" name="fld-collate" id="fld-collate">' +
                                                    ' Collate' +
                                                '</label>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</fieldset>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                                '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                                '<button type="button" class="btn btn-primary" id="btn-savesettings">Save changes</button>' +
                            '</div>' +
                        '</div>' +
                        '<!-- /.modal-content -->' +
                    '</div>' +
                    '<!-- /.modal-dialog -->' +
                '</div>' +
                '<!-- /.modal -->';
            $('body').append(dlg);

            $('#btn-savesettings').click(function (ev) {
                ev.preventDefault();
                ui.SavePrinterSettings();
                $('#dlg-printersettings').modal('hide');
            });

            $('[name="fld-measure"]').on('change', function () {
                switch ($(this).val()) {
                    case '2': // mm from inches
                        $(idDialog + ' input[type=text][data-rule=currency]').each(function () {
                            ui.convertAndDisplayinchesToMM($(this));
                        });
                        break;

                    case '1': // inches from mm
                        $(idDialog + ' input[type=text][data-rule=currency]').each(function () {
                            ui.convertAndDisplayMMtoInches($(this));
                        });
                        break;
                }
            });

            $('#dlg-printersettings [data-trigger="spinner"]').spinner();

            $('#dlg-printersettings .selectpicker').on('changed.bs.select', function(ev) {
                ui.SetPrinterSettingsDialog();
            });
        }
        ui.SetPrinterSettingsDialog();
        $('#dlg-printersettings').modal('show');
        $('#dlg-printersettings .selectpicker').selectpicker('refresh');
    };

    ui.SetPageSetupDialog = function () {
        var $dlg = $('#dlg-printoptions');
        var settings = MeadCo.ScriptX.Print.HTML.settings;

        $dlg.find('[name="fld-orientation"]').val([settings.page.orientation]);
        $dlg.find('#fld-printbackground').prop('checked', settings.printBackgroundColorsAndImages);
        $dlg.find('#fld-shrinktofit').prop('checked', settings.viewScale == -1);
        $dlg.find('[name="fld-measure"]').val([settings.page.units]);
        $dlg.find('#fld-marginL').val(settings.page.margins.left);
        $dlg.find('#fld-marginT').val(settings.page.margins.top);
        $dlg.find('#fld-marginR').val(settings.page.margins.right);
        $dlg.find('#fld-marginB').val(settings.page.margins.bottom);
        $dlg.find('#fld-header').val(settings.header);
        $dlg.find('#fld-footer').val(settings.footer);

        // grab the paper size options from printerControl
        var $paperselect = $('#fld-papersize');
        var printerControl = MeadCo.ScriptX.Printing.printerControl();
        $('#fld-papersize > option').remove();
        for (var i in printerControl.Forms) {
            $paperselect.append("<option>" + printerControl.Forms[i] + "</option>");
        }
        $paperselect.selectpicker('val', MeadCo.ScriptX.Printing.paperSize);

        $dlg.modal('show');
        $paperselect.selectpicker('refresh');
    };

    ui.SavePageSetup = function () {
        var $dlg = $('#dlg-printoptions');
        var settings = MeadCo.ScriptX.Print.HTML.settings;

        if ($dlg.length) {
            settings.page.orientation = $dlg.find('[name="fld-orientation"]:checked').val();
            settings.printBackgroundColorsAndImages = $dlg.find('#fld-printbackground').prop('checked');
            settings.viewScale = $dlg.find('#fld-shrinktofit').prop('checked') ? -1 : 100;
            settings.page.units = parseInt($dlg.find('[name="fld-measure"]:checked').val());
            settings.page.margins.left = $dlg.find('#fld-marginL').val();
            settings.page.margins.top = $dlg.find('#fld-marginT').val();
            settings.page.margins.right = $dlg.find('#fld-marginR').val();
            settings.page.margins.bottom = $dlg.find('#fld-marginB').val();
            settings.header = $dlg.find('#fld-header').val();
            settings.footer = $dlg.find('#fld-footer').val();
            MeadCo.ScriptX.Printing.paperSize = $('#fld-papersize').selectpicker('val');
        }
    };

    ui.SetPrinterSettingsDialog = function () {
        var $dlg = $('#dlg-printersettings');
        var printHtml = MeadCo.ScriptX.Print.HTML;
        var printer = MeadCo.ScriptX.Printing;

        ui.FillAndSetPrintersList();
        ui.FillAndSetBinsList();

        $dlg.find('#fld-collate').prop('checked', printer.collate == printHtml.CollateOptions.TRUE);
        $dlg.find('#fld-copies').val(printer.copies);

    };

    ui.SavePrinterSettings = function () {
        var $dlg = $('#dlg-printersettings');
        var printHtml = MeadCo.ScriptX.Print.HTML;
        var printer = MeadCo.ScriptX.Printing;
        var settings = MeadCo.ScriptX.Print.HTML.settings;

        if ($dlg.length) {
            // set printer first as this triggers a getDeviceSettings call to the server
            // which would overwrite any settings previously assigned from the dialog
            printer.currentPrinter = $('#fld-printerselect').selectpicker('val');
            printer.paperSource = $('#fld-papersource').selectpicker('val');
            printer.collate = $dlg.find('#fld-collate').prop('checked') ? printHtml.CollateOptions.TRUE : printHtml.CollateOptions.FALSE;
            printer.copies = $dlg.find('#fld-copies').val();
        }
    };

    ui.FillAndSetPrintersList = function () {
        var printer = MeadCo.ScriptX.Printing;
        var printersArray = printer.EnumPrinters();
        var $printers = $('#fld-printerselect');

        $('#fld-printerselect > option').remove();
        for (var i = 0; i < length; i++) {
            $printers.append("<option>" + printersArray[i]);
        }

        $printers.selectpicker('val', printer.currentPrinter);
        $printers.selectpicker('refresh');
    };

    ui.FillAndSetBinsList = function () {
        var printer = MeadCo.ScriptX.Printing;
        var binsArray = printer.printerControl(printer.CurrentPrinter).Bins;
        var $bins = $('#fld-papersource');

        $('#fld-papersource > option').remove();
        for (var i = 0; i < length; i++) {
            $bins.append("<option>" + binsArray[i]);
        }

        $bins.selectpicker('val', printer.paperSource);
        $bins.selectpicker('refresh');
    };

    // convert the current inches value in the control to MM
    ui.convertAndDisplayinchesToMM = function ($el) {
        $el.val(((parseFloat($el.val()) * 2540) / 100).toFixed(2));
    }

    // convery the current mm value in the control to inches
    ui.convertAndDisplayMMtoInches = function ($el) {
        $el.val(((parseFloat($el.val()) * 100) / 2540).toFixed(2));
    }


}(window.MeadCo = window.MeadCo || {}, jQuery));
