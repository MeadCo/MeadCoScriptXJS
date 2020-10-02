// MeadCo.ScriptX.Print.UI
//
// Depends on MeadCo.ScriptX.Print.HTML
//
// A lightweight plug-in not implemented as a plug-in as it will only be used once or twice on a document
// so polluting jQuery is unneccessary.
//
// Optional dependency: bootstrap-select.js : Bootstrap-select v1.10.0 (http://silviomoreto.github.io/bootstrap-select)
// The above dependency is completely optional - the code looks for the enabling class.
//

(function (topLevelNs, $, undefined) {
    "use strict";

    var ui = MeadCo.createNS("MeadCo.ScriptX.Print.UI");

    ui.version = "1.7.0.0";

    // MeadCo.ScriptX.Print.UI.PageSetup()
    ui.PageSetup = function (fnCallBack) {

        if (!$.fn.modal) {
            console.error("MeadCo.ScriptX.Print.UI requires bootstrap Modal");
            fnCallBack(false);
            return;
        }

        var bAccepted = false;
        var sClass = "";
        var bs_majorVersion = ($.fn.modal.Constructor.VERSION || '').split(' ')[0].split('.')[0];

        // check for presence of bootstrap-select.js (doesn't work well with BS 4)
        if ($.fn.selectpicker && bs_majorVersion === '3') {
            sClass = "selectpicker";
        }

        // page setup modal to attach to the page
        //
        // Simple override is to include the dialog in the page with id="dlg-printoptions"
        //
        if (!$('#dlg-printoptions').length) {
            console.log("UI.PageSetup bootstrap modal version: " + $.fn.modal.Constructor.VERSION);
            var dlg;

            switch (bs_majorVersion) {
                case '3':
                    dlg = '<style>' +
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
                        '<div class="col-md-8"><select class="' + sClass + ' form-control show-tick" id="fld-papersize"></select></div>' +
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
                        '<input name="fld-marginL" id="fld-marginL" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
                        '</div>' +
                        '<label class="control-label col-md-2">Top</label>' +
                        '<div class="col-md-3">' +
                        '<input name="fld-marginT" id="fld-marginT" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
                        '</div>' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<label class="control-label col-md-4">Right</label>' +
                        '<div class="col-md-3">' +
                        '<input name="fld-marginR" id="fld-marginR" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
                        '</div>' +
                        '<label class="control-label col-md-2">Bottom</label>' +
                        '<div class="col-md-3">' +
                        '<input name="fld-marginB" id="fld-marginB" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
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
                        '<button type="button" class="btn btn-primary" id="btn-saveoptions">OK</button>' +
                        '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
                        '</div>' +
                        '</div>' +
                        '<!-- /.modal-content -->' +
                        '</div>' +
                        '<!-- /.modal-dialog -->' +
                        '</div>' +
                        '<!-- /.modal -->';
                    break;

                case '4':
                    dlg = '<div class="modal fade" tabindex="-1" role="dialog" id="dlg-printoptions"><div class="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-lg" role = "document">' +
                        '<div class="modal-content"><div class="modal-header"><h5 class="modal-title">Page setup</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                        '<span aria-hidden="true">&times;</span></button></div><div class="modal-body"><div class="container-fluid"><fieldset><legend>Paper</legend><div class="form-group row">' +
                        '<label for="fld-papersize" class="col-md-4 col-form-label text-right col-form-label-sm">Size</label><div class="col-md-8"><select class="' + sClass + ' form-control col-form-label-sm custom-select custom-select-sm" id="fld-papersize"></select>' +
                        '</div></div><div class="form-group row"><div class="col-md-8 offset-md-4"><div class="form-check form-check-inline"><input class="form-check-input" type="radio" value="2" id="fld-portrait" name="fld-orientation" />' +
                        '<label class="form-check-label" for="fld-portrait">Portrait</label></div><div class="form-check form-check-inline"><input class="form-check-input" type="radio" value="1" id="fld-landscape" name="fld-orientation" />' +
                        '<label class="form-check-label" for="fld-portrait">Landscape</label></div></div></div><div class="form-group row"><div class="col-md-8 offset-md-4"><div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" name="fld-shrinktofit" id="fld-shrinktofit">' +
                        '<label class="form-check-label" for="fld-shrinktofit">Shrink to fit</label></div></div></div><div class="form-group row"><div class="col-md-8 offset-md-4"><div class="form-check form-check-inline">' +
                        '<input class="form-check-input" type="checkbox" name="fld-printbackground" id="fld-printbackground"><label class="form-check-label" for="fld-printbackground">Print background colour and images</label>' +
                        '</div></div></div></fieldset><fieldset><legend>Margins</legend><div class="form-group row"><div class="col-md-8 offset-md-4"><div class="form-check form-check-inline"><input class="form-check-input" type="radio" value="2" id="fld-millimetres" name="fld-measure" />' +
                        '<label class="form-check-label" for="fld-millimetres">Millimetres</label></div><div class="form-check form-check-inline"><input class="form-check-input" type="radio" value="1" id="fld-inches" name="fld-measure" />' +
                        '<label class="form-check-label" for="fld-inches">Inches</label></div></div></div><div class="form-group row"><label class="col-md-4 col-form-label text-right col-form-label-sm">Left</label>' +
                        '<div class="col-md-3"><div class="input-group spinner" data-trigger="spinner"><input name="fld-marginL" id="fld-marginL" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
                        '</div></div><label class="col-md-2 col-form-label text-right col-form-label-sm">Top</label><div class="col-md-3"><div class="input-group spinner" data-trigger="spinner"><input name="fld-marginT" id="fld-marginT" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
                        '</div></div></div><div class="form-group row"><label class="col-md-4 col-form-label text-right col-form-label-sm">Right</label><div class="col-md-3"><div class="input-group spinner" data-trigger="spinner">' +
                        '<input name="fld-marginR" id="fld-marginR" type="text" class="form-control text-right" data-rule="measure" value="1" /></div></div><label class="col-md-2 col-form-label text-right col-form-label-sm">Bottom</label>' +
                        '<div class="col-md-3"><div class="input-group spinner" data-trigger="spinner"><input name="fld-marginB" id="fld-marginB" type="text" class="form-control text-right" data-rule="measure" value="1" />' +
                        '</div></div></div></fieldset><fieldset><legend>Headers and footers</legend><div class="form-group row"><label for="fld-header" class="col-md-4 col-form-label text-right col-form-label-sm">Header</label>' +
                        '<div class="col-md-8"><input type="text" name="fld-header" id="fld-header" class="form-control form-control-sm" /></div></div><div class="form-group row"><label for="fld-footer" class="col-md-4 col-form-label text-right col-form-label-sm">Footer</label>' +
                        '<div class="col-md-8"><input type="text" name="fld-footer" id="fld-footer" class="form-control form-control-sm" /></div></div></fieldset></div>' +
                        '</div><div class="modal-footer"><button type="button" class="btn btn-primary" id="btn-saveoptions">OK</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button></div></div></div></div>';
                    break;

                default:
                    console.error("Unknown version of bootstrap: " + bs_majorVersion);
                    fnCallBack(false);
                    return;
            }

            $('body').append(dlg);
        }

        $('[name="fld-measure"]')
            .off('change')
            .on('change', function () {
                switch ($(this).val()) {
                    case '2': // mm from inches
                        $('#dlg-printoptions input[type=text][data-rule=measure]').each(function () {
                            convertAndDisplayinchesToMM($(this));
                        });
                        break;

                    case '1': // inches from mm
                        $('#dlg-printoptions input[type=text][data-rule=measure]').each(function () {
                            convertAndDisplayMMtoInches($(this));
                        });
                        break;
                }
            });

        // reattach click handler as callback function scoped variables may (probably will) have changed
        $('#btn-saveoptions')
            .off("click")
            .on("click", function (ev) {
                ev.preventDefault();
                savePageSetup();
                bAccepted = true;
                $('#dlg-printoptions').modal('hide');
            });

        $("#dlg-printoptions")
            .off('hidden.bs.modal')
            .on('hidden.bs.modal', function () {
                if (typeof fnCallBack === "function") {
                    fnCallBack(bAccepted);
                }
            });

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

        // grab the paper size options 
        var printApi = MeadCo.ScriptX.Print;
        var $paperselect = $('#fld-papersize');
        var forms = printApi.deviceSettingsFor(printApi.printerName).forms;

        $('#fld-papersize > option').remove();
        for (var i in forms) {
            $paperselect.append("<option>" + forms[i] + "</option>");
        }

        if ($paperselect.hasClass("selectpicker")) {
            $paperselect.selectpicker('refresh');
        }

        $paperselect.val(MeadCo.ScriptX.Print.deviceSettings.paperSizeName);

        $dlg.modal('show');

        if ($paperselect.hasClass("selectpicker")) {
            $paperselect.selectpicker('refresh');
        }

    };

    // MeadCo.ScriptX.Print.UI.PrinterSettings()
    ui.PrinterSettings = function (fnCallBack) {

        if (!$.fn.modal) {
            console.error("MeadCo.ScriptX.Print.UI requires bootstrap Modal");
            fnCallBack(false);
            return;
        }

        var bAccepted = false;
        var sClass = "";
        var bs_majorVersion = ($.fn.modal.Constructor.VERSION || '').split(' ')[0].split('.')[0];

        // check for presence of bootstrap-select.js (doesn't work well with BS 4)
        if ($.fn.selectpicker && bs_majorVersion === '3') {
            sClass = "selectpicker";
        }

        // printer settings modal to attach to the page
        if (!$('#dlg-printersettings').length) {
            console.log("UI.PageSetup bootstrap modal version: " + $.fn.modal.Constructor.VERSION);

            var dlg;

            switch (bs_majorVersion) {
                case '3':
                dlg = '<style>' +
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
                '<h4 class="modal-title">Print</h4>' +
                '</div>' +
                '<div class="modal-body form-horizontal options-modal-body">' +
                //'<fieldset>' +
                //    '<legend>Printer</legend>' +
                '<div class="form-group">' +
                '<label class="col-md-4 control-label" for="fld-printerselect">Printer</label>' +
                '<div class="col-md-8"><select class="' + sClass + ' form-control show-tick" id="fld-printerselect"></select></div>' +
                '</div>' +
                '<div class="form-group">' +
                '<label class="col-md-4 control-label" for="fld-papersource">Paper source</label>' +
                '<div class="col-md-8"><select class="' + sClass + ' form-control show-tick" id="fld-papersource"></select></div>' +
                '</div>' +
                '<div class="form-group">' +
                '<label class="control-label col-md-4">Copies</label>' +
                '<div class="col-md-3">' +
                '<input name="fld-copies" id="fld-copies" type="text" class="form-control text-right" data-rule="quantity" value="1" />' +
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
                //'</fieldset>' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary" id="btn-savesettings">Print</button>' +
                '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
                '</div>' +
                '</div>' +
                '<!-- /.modal-content -->' +
                '</div>' +
                '<!-- /.modal-dialog -->' +
                '</div>' +
                '<!-- /.modal -->';
                    break;

                case '4':
                dlg = '<div class="modal fade" id="dlg-printersettings"><div class="modal-dialog modal-dialog-scrollable modal-dialog-centered" role = "document"><div class="modal-content">' +
                '<div class="modal-header"><h5 class="modal-title">Print</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>' +
                '</button></div><div class="modal-body"><div class="container-fluid"><div class="form-group row"><label for="fld-printerselect" class="col-md-4 col-form-label text-right col-form-label-sm">Printer</label>' +
                '<div class="col-md-8"><select class="' + sClass + ' form-control col-form-label-sm custom-select custom-select-sm" id="fld-printerselect"></select></div></div><div class="form-group row">' +
                '<label for="fld-papersource" class="col-md-4 col-form-label text-right col-form-label-sm">Paper source</label><div class="col-md-8"><select class="' + sClass + ' form-control col-form-label-sm custom-select custom-select-sm" id="fld-papersource"></select>' +
                '</div></div><div class="form-group row align-items-center"><label for="fld-copies" class="col-md-4 col-form-label text-right col-form-label-sm">Copies</label><div class="col-md-3">' +
                '<input name="fld-copies" id="fld-copies" type="text" class="form-control form-control-sm text-right" data-rule="quantity" value="1" /></div><div class="col-md-5"><div class="form-check form-check-inline">' +
                '<input class="form-check-input" type="checkbox" name="fld-collate" id="fld-collate"><label class="form-check-label" for="fld-collate">Collate</label></div></div></div></div>' +
                '</div><div class="modal-footer"><button type="button" class="btn btn-primary" id="btn-savesettings">Print</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button></div></div></div></div >';
                    break;

                default:
                    console.error("Unknown version of bootstrap: " + bs_majorVersion);
                    fnCallBack(false);
                    return;
            }

            $('body').append(dlg);


            $('[name="fld-measure"]').on('change', function () {
                switch ($(this).val()) {
                    case '2': // mm from inches
                        $('#dlg-printersettings input[type=text][data-rule=currency]').each(function () {
                            convertAndDisplayinchesToMM($(this));
                        });
                        break;

                    case '1': // inches from mm
                        $('#dlg-printersettings input[type=text][data-rule=currency]').each(function () {
                            convertAndDisplayMMtoInches($(this));
                        });
                        break;
                }
            });

            $('#dlg-printersettings #fld-printerselect').change(function (ev) {
                onSelectPrinter($(this).val());
            });
        }

        // reattach click handler as callback function scoped variables may (probably will) have changed
        $('#btn-savesettings')
            .off("click")
            .on("click", function (ev) {
                ev.preventDefault();
                savePrinterSettings();
                bAccepted = true;
                $('#dlg-printersettings').modal('hide');
            });

        $("#dlg-printersettings")
            .off('hidden.bs.modal')
            .on('hidden.bs.modal', function () {
                if (typeof fnCallBack === "function") {
                    fnCallBack(bAccepted);
                }
            });


        fillPrintersList();
        showPrinterSettings();
        $('#dlg-printersettings').modal('show');

        if (sClass === "selectpicker") {
            $('#dlg-printersettings .selectpicker').selectpicker('refresh');
        }
    };

    // show available sources and options 
    function showPrinterSettings() {
        var printApi = MeadCo.ScriptX.Print;
        var settings = printApi.deviceSettings;

        fillAndSetBinsList();

        var $dlg = $('#dlg-printersettings');
        $dlg.find('#fld-collate').prop('checked', printApi.deviceSettings.collate === printApi.CollateOptions.TRUE);
        $dlg.find('#fld-copies').val(settings.copies);

    }

    function savePageSetup() {
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

            MeadCo.ScriptX.Print.deviceSettings.paperSizeName = $('#fld-papersize').val();
        }
    }

    function savePrinterSettings() {
        var $dlg = $('#dlg-printersettings');
        var printApi = MeadCo.ScriptX.Print;

        if ($dlg.length) {
            // must set the printer first and note this might trigger a getDeviceSettings call to the server
            var a = printApi.onErrorAction;

            printApi.onErrorAction = printApi.ErrorAction.THROW;

            // eat all and any errors. finally might be better but
            // minifiers dont like empty blocks 
            try {
                printApi.printerName = $('#fld-printerselect').val();
                printApi.onErrorAction = a;
            }
            catch (e) {
                printApi.onErrorAction = a;
            }

            // update settings for the active printer
            var settings = printApi.deviceSettings;
            settings.paperSourceName = $('#fld-papersource').val();
            settings.collate = $dlg.find('#fld-collate').prop('checked') ? printApi.CollateOptions.TRUE : printApi.CollateOptions.FALSE
            settings.copies = $dlg.find('#fld-copies').val();
        }
    }

    // fill printers dropdown with those available
    function fillPrintersList() {
        var printApi = MeadCo.ScriptX.Print;
        var $printers = $('#fld-printerselect');
        var arrPrinters = printApi.availablePrinterNames;

        $('#fld-printerselect > option').remove();

        for (var i = 0; i < arrPrinters.length; i++) {
            $printers.append("<option>" + arrPrinters[i]);
        }

        $printers.val(printApi.printerName);
        if ($printers.hasClass("selectpicker")) {
            $printers.selectpicker('refresh');
        }
    }

    function onSelectPrinter(printerName) {
        var printApi = MeadCo.ScriptX.Print;
        var currentPrinterName = printApi.printerName;
        var currentSource = printApi.deviceSettings.paperSourceName;

        var a = printApi.onErrorAction;

        printApi.onErrorAction = printApi.ErrorAction.THROW;

        try {
            // select the printer to get its default source and size.
            printApi.printerName = printerName;
            fillAndSetBinsList();
        } catch (e) {
            alert("Sorry, an error has occurred:\n\n" + e.message);
        }

        // revert the current printer in ScriptX
        try {
            printApi.printerName = currentPrinterName;
            printApi.deviceSettings.paperSourceName = currentSource;
        } catch (e) {
            alert("Sorry, an error has occurred restoring current printer settings:\n\n" + e.message);
        }

        printApi.onErrorAction = a;

    }

    function fillAndSetBinsList() {
        var printApi = MeadCo.ScriptX.Print;
        var binsArray = printApi.deviceSettingsFor(printApi.printerName).bins;
        var $bins = $('#fld-papersource');

        $('#fld-papersource > option').remove();
        for (var i = 0; i < binsArray.length; i++) {
            $bins.append("<option>" + binsArray[i]);
        }

        $bins.val(printApi.deviceSettings.paperSourceName);

        if ($bins.hasClass("selectpicker")) {
            $bins.selectpicker('refresh');
        }
    }

    // convert the current inches value in the control to MM
    function convertAndDisplayinchesToMM($el) {
        $el.val(((parseFloat($el.val()) * 2540) / 100).toFixed(2));
    }

    // convert the current mm value in the control to inches
    function convertAndDisplayMMtoInches($el) {
        $el.val(((parseFloat($el.val()) * 100) / 2540).toFixed(2));
    }

}(window.MeadCo = window.MeadCo || {}, jQuery));
