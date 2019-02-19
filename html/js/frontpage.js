/* vim: set expandtab shiftwidth=4 softtabstop=4: */

//
// TODO:
// Main page:
//      ~~Change tab names to Analyze and Edit
// Edit tab experiments table:
//      Replace incomplete uploads with all experiments + status
//          (Sort by "status" to see incomplete uploads together)
//      ~~Add delete experiment button with popup confirmation
//      ~~Replace Experiment Condition with Notes
// Edit tab upload form:
//      Add controls for experiment type vocabulary
//      Add controls for run category vocabulary
//      Add runs table for setting category and date
// Analyze tab:
//      ???
//

frontpage = (function(){

    var BaseURL = "/MSWeb"

    // The front page consists of multiple tabs.
    // Tabs may (or may not) need initialization.
    // To handle this, we register for the "shown.bs.tab"
    // event, which is fired after a tab is fully shown.
    // The callback simply looks in "tab_funcs" for an
    // attribute matching the id of the shown tab, and
    // calls it as a function.  For tabs needing initialization,
    // such as "edit" which has to initialize its
    // bootgrid instance, the init function is first
    // registered in "tab_funcs" and then replaced by
    // the regular callback.  For tabs not needing
    // initialization, the regular callback is registered
    // in "tab_funcs" directly.

    // -----------------------------------------------------------------
    // Analyze tab functions
    // -----------------------------------------------------------------

    // TODO: work on this tab has not started yet.

    var show_tab_analyze = function() {
        /* alert("show tab experiments"); */
    }

    // -----------------------------------------------------------------
    // Edit tab functions
    // -----------------------------------------------------------------

    //
    // init_tab_edit:
    //   Initialize all sections of the "upload" tab
    //
    var init_tab_edit = function() {
        // Setup grid layout for all sections
        $("#expedit").layout({
            name: "expedit",
            north__size: "40%"
        });

        // Setup upload file elements
        $("#upload-drop").on("dragover", stop_default)
                         .on("dragenter", stop_default)
                         .on("drop", file_dropped);
        $("#upload-file").change(file_selected);
        $("#upload-button").click(upload_file).attr("disabled", "disabled");

        // Show experiments
        init_edit_table();
        init_controlled_vocabulary();
        init_metadata_form();

        /* Reset tab callback */
        tab_funcs.tab_edit = show_tab_edit;
        show_tab_edit();
    }

    //
    // show_tab_edit:
    //   Display "upload" tab.  Currently does nothing,
    //   but may (in the future), refresh the list of experiments.
    //
    var show_tab_edit = function() {
        /* alert("show tab edit"); */
    }

    //
    // stop_default:
    //   Event callback that prevents default action and propagation
    //  
    var stop_default = function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    //
    // file_dropped:
    //   Event callback when user drops a file on our upload box
    //
    var file_dropped = function(ev) {
        ev.preventDefault();
        var data_transfer = ev.originalEvent.dataTransfer;
        var file;
        if (data_transfer.items) {
            if (data_transfer.items.length != 1) {
                alert("You can only upload one file at a time.");
                return;
            }
            set_file(data_transfer.items[0].getAsFile());
        } else {
            if (data_transfer.files.length != 1) {
                alert("You can only upload one file at a time.");
                return;
            }
            set_file(data_transfer.files[0]);
        }
    }

    //
    // file_selected:
    //   Event callback when user selects a file from <input type=file>
    //
    var file_selected = function(ev) {
        var files = ev.target.files;
        if (files.length != 1) {
            alert("You can only upload one file at a time.");
            return;
        }
        set_file(files[0]);
    }

    var selected_file;      // Last file selected

    //
    // set_file:
    //   Display the selected file name and size
    //
    var set_file = function(file) {
        if (!file) {
            $("#upload-button").attr("disabled", "disabled");
        } else {
            $("#upload-button").removeAttr("disabled");
            selected_file = file;
            $("#upload-file-name").text(file.name + " (" +
                                        readable_size(file.size) + ")");
        }
    }

    //
    // upload_file:
    //   Upload selected file to server
    //
    var upload_file = function(ev) {
        stop_default(ev);
        if (!selected_file) {
            alert("Please select a file to upload");
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", upload_progress, false);
        xhr.addEventListener("load", upload_complete, false);
        xhr.addEventListener("error", upload_failed, false);
        xhr.addEventListener("abort", upload_canceled, false);
        var form_data = new FormData();
        form_data.append("action", "file_upload");
        form_data.append("datafile", selected_file);
        xhr.open("POST", BaseURL + "/cgi-bin/upload.py")
        xhr.send(form_data);
        set_upload_status("uploading %s" % selected_file.name);
    }

    //
    // upload_progress:
    //   Event callback to display upload progress
    //
    var upload_progress = function(ev) {
        var msg;
        if (!ev.lengthComputable)
            msg = "unavailable";
        else
            msg = readable_size(ev.loaded) + " / " +
                  readable_size(ev.total) + " (" +
                  Math.round(ev.loaded * 100 / ev.total) + "%)...";
        set_upload_status(msg);
    }

    //
    // upload_complete:
    //   Event callback to complete processing upload request
    //
    var upload_complete = function(ev) {
        var answer = JSON.parse(ev.target.responseText);
        if (answer.status != "success") {
            show_error(answer.status, answer.reason, answer.cause);
            set_upload_status("error: " + answer.reason);
        } else {
            set_upload_status("finished");
            reload_edit_table();
        }
    }

    //
    // upload_failed:
    //   Event callback to report failure in upload
    //
    var upload_failed = function(ev) {
        set_upload_status("failed");
    }

    //
    // upload_canceled:
    //   Event callback to report cancelation of upload
    //
    var upload_canceled = function(ev) {
        set_upload_status("canceled");
    }

    //
    // set_upload_status:
    //   Display status message about upload (progress, completion, etc)
    //
    var set_upload_status = function(msg) {
        $("#upload-status").text(msg);
    }

    //
    // --------------------------------------------------------------------
    // Experiments
    // --------------------------------------------------------------------
    //

    var EditTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: false,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        formatters: {
            "actions": function(column, row) {
                return '<button data-row-id="' + row.id +
                       '" class="btn btn-xs btn-default exp-delete">' +
                       '<span class="fa fa-trash"></span></button>'
            }
        }
    }
    var experiments = {}      // Last set of experiments from server

    //
    // init_edit_table:
    //   Initialize the edit table with appropriate headers
    //
    var init_edit_table = function() {
        var columns = [
            ["Upload Date", "uploaddate"],
            ["Uploader", "uploader"],
            ["Status", "status"],
            ["File Name", "datafile"],
        ];
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-visible": false }).text("Id"));
        htr.append($("<th/>", { "data-column-id": "actions",
                                "data-formatter": "actions",
                                "data-sortable": false }).text("Actions"));
        $.each(columns, function(index, values) {
            htr.append($("<th/>", { "data-column-id": values[1] })
                            .text(values[0]));
        });
        var tbl = $("#upload-entries-table");
        tbl.append($("<thead/>").append(htr))
           .bootgrid(EditTableOptions)
           .on("selected.rs.jquery.bootgrid", edit_experiment_selected)
           .on("deselected.rs.jquery.bootgrid", edit_experiment_deselected)
           .on("loaded.rs.jquery.bootgrid", function() {
                tbl.find(".exp-delete").on("click", function(ev) {
                    stop_default(ev);
                    var exp_id = ev.target.dataset.rowId
                    var exp = experiments[exp_id];
                    var msg = "Really delete experiment";
                    if (exp.title)
                        msg += ' "' + exp.title + '"';
                    msg += " uploaded by "
                    msg += exp.uploader ? exp.uploader : "(unknown)";
                    if (exp.uploaddate)
                        msg += " on " + exp.uploaddate;
                    msg += '?';
                    if (confirm(msg))
                        delete_experiment(exp_id);
                });
            });
        reload_edit_table();
    }

    //
    // reload_edit_table:
    //   Upload list of experiments in edit table
    //
    var reload_edit_table = function() {
        $.ajax({
            dataType: "json",
            url: BaseURL + "/cgi-bin/upload.py?action=all_experiments",
            success: fill_edit_table,
        });
    }

    //
    // fill_edit_table:
    //   Display the list of experiments in edit table
    //
    var fill_edit_table = function(data) {
        var tbl = $("#upload-entries-table");
        tbl.bootgrid("clear");
        var rows = [];
        $.each(data.results, function(exp_id, exp) {
            var row = Object.assign({id: parseInt(exp_id)}, exp);
            rows.push(row);
        });
        tbl.bootgrid("append", rows);

        // Update and save information for later updates
        var new_experiments = [];
        $.each(data.results, function(exp_id, exp) {
            if (!(exp_id in experiments))
                new_experiments.push(exp_id);
        });
        experiments = data.results;
        if (new_experiments.length == 1)
            // Select if there is exactly one new experiment
            // (i.e., the one we just uploaded)
            tbl.select(new_experiments);
    }

    //
    // edit_experiment_selected:
    //   Event callback when user clicks on a row in uploads tables
    //
    var edit_experiment_selected = function(ev, rows) {
        $("#upload-metadata-fieldset").removeAttr("disabled");
        show_metadata(rows[0].id);
    }

    //
    // edit_experiment_deselected:
    //   Event callback when user deselects row in uploads table or
    //   selects a different row
    //
    var edit_experiment_deselected = function(ev, rows) {
        $("#upload-metadata-fieldset").attr("disabled", "disabled");
    }

    //
    // delete_experiment:
    //   Delete experiment on server
    //
    var delete_experiment = function(exp_id) {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL + "/cgi-bin/upload.py",
            data: {
                action: "delete_experiment",
                exp_id: exp_id,
            },
            success: function(data) {
                if (data.status != "success") {
                    show_error(data.status, data.reason, data.cause);
                } else {
                    var new_data = Object.assign({}, experiments);
                    delete new_data[exp_id];
                    fill_edit_table({ results: new_data });
                }
            },
        });
    }

    //
    // --------------------------------------------------------------------
    // Controlled vocabulary
    // --------------------------------------------------------------------
    //

    var controlled_vocabulary;

    // 
    // init_controlled_vocabulary:
    //   Initialize controlled vocabulary elements
    //
    var init_controlled_vocabulary = function() {
        $("#upload-experiment-type").attr("disabled", "disabled")
                                    .click(add_experiment_type);
        $("#upload-run-category").attr("disabled", "disabled")
                                 .click(add_run_category);
        $("#exptype").change(experiment_type_changed);
        $("#runcat").change(run_category_changed);
        reload_controlled_vocabulary();
        experiment_type_changed();  // in case browser kept input history
        run_category_changed();
    }

    //
    // reload_controlled_vocabulary:
    //   Update list of known controlled vocabulary terms
    //
    var reload_controlled_vocabulary = function() {
        // Setup controlled vocabulary and metadata elements
        $.ajax({
            dataType: "json",
            url: BaseURL + "/cgi-bin/upload.py?action=controlled_vocabulary",
            success: fill_controlled_vocabulary,
        });
    }

    //
    // fill_controlled_vocabulary:
    //   Add elements for selecting and adding controlled vocabulary terms
    //
    var fill_controlled_vocabulary = function(data) {
        fill_list($("#exptype-list"), data.results.experiment_types);
        fill_list($("#runcat-list"), data.results.run_categories);
    }

    var fill_list = function(div, list) {
        if (list.length == 0)
            list = [ "None" ];
        div.empty();
        $.each(list, function(index, val) {
            var a = $("<a/>", { href: "#", class: "dropdown-item" }).text(val);
            div.append(a);
        });
    }

    //
    // experiment_type_changed:
    //   Event callback when user changes value of experiment input field
    //
    var experiment_type_changed = function(ev) {
        var v = $("#exptype").val();
        if (v)
            $("#upload-experiment-type").removeAttr("disabled")
        else
            $("#upload-experiment-type").attr("disabled", "disabled")
    }

    //
    // add_experiment_type:
    //   Upload a new experiment type to server
    //
    var add_experiment_type = function() {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL + "/cgi-bin/upload.py",
            data: {
                action: "add_experiment_type",
                exp_type: $("#exptype").val(),
            },
            success: function(data) {
                if (data.status != "success")
                    show_error(data.status, data.reason, data.cause);
                else
                    reload_controlled_vocabulary();
            },
        });
    }

    //
    // run_category_changed:
    //   Event callback when user changes value of category input field
    //
    var run_category_changed = function(ev) {
        var v = $("#runcat").val();
        if (v)
            $("#upload-run-category").removeAttr("disabled")
        else
            $("#upload-run-category").attr("disabled", "disabled")
    }

    //
    // add_run_category:
    //   Upload a new run category to server
    //
    var add_run_category = function() {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL + "/cgi-bin/upload.py",
            data: {
                action: "add_experiment_type",
                exp_type: $("#exptype").val(),
            },
            success: function(data) {
                if (data.status != "success")
                    show_error(data.status, data.reason, data.cause);
                else
                    reload_controlled_vocabulary();
            },
        });
    }

    //
    // --------------------------------------------------------------------
    // Metadata upload form
    // --------------------------------------------------------------------
    //

    var metadata_fields;

    //
    // init_metadata_form:
    //   Display metadata upload form
    //
    var init_metadata_form = function() {
        $.ajax({
            dataType: "json",
            url: BaseURL + "/cgi-bin/upload.py?action=metadata_fields",
            success: fill_metadata_form,
        });
    }

    //
    // fill_metadata_form:
    //   Lay out experiment attribute name and value fields in metadata form
    //
    var fill_metadata_form = function(data) {
        var div = $("#upload-metadata-fieldset div");
        $.each(data.results, function(index, val) {
            var input_type = val[1];
            var input_id = val[2];
            var label = $("<label/>", { "for": input_id }).text(val[0]);
            var input;
            if (input_type == "textarea")
                input = $("<textarea/>");
            else
                input = $("<input/>", { "type": input_type });
            input.prop("id", input_id);
            $.each(val[3], function(index, value) {
                input.prop(value[0], value[1]);
            });
            div.append(label).append(input);
        });
        metadata_fields = data.results;
    }

    //
    // show_metadata:
    //   Display experiment attribute values in metadata form
    //
    var show_metadata = function(exp_id) {
        var exp = experiments[exp_id];
        $.each(metadata_fields, function(index, val) {
            var input_id = val[2];
            var field_value = exp[input_id];
            $("#" + input_id).val(field_value);
        });
    }

    // -----------------------------------------------------------------
    // Main page functions
    // -----------------------------------------------------------------

    var tab_funcs = {
        tab_analyze: show_tab_analyze,
        tab_edit: init_tab_edit,
    };

    //
    // init_main:
    //   Initialize front page
    //
    var init_main = function() {
        $("#frontpage").on("shown.bs.tab", function(e) {
            tab_funcs[e.target["id"]]();
        });
        var active = $("#frontpage .nav li.active a").attr("id");
        tab_funcs[active]();
    };

    // -----------------------------------------------------------------
    // Utility functions
    // -----------------------------------------------------------------

    //
    // readable_size:
    //   Return file size in human-readable form
    //
    var readable_size = function(size) {
        var gb = 1024 * 1024 * 1024;
        var mb = 1024 * 1024;
        var kb = 1024;
        var display;
        if (size >= gb)
            return (size / gb).toFixed(1) + "GB";
        else if (size >= mb)
            return (size / mb).toFixed(1) + "MB";
        else if (size >= kb)
            return (size / kb).toFixed(1) + "KB";
        else
            return size + "B";
    }

    //
    // show_error:
    //   Display error from server
    //
    var show_error = function(status, reason, cause) {
        console.log(cause);
        var msg = status + ": " + reason;
        alert(msg);
    }

    return {
        init: function() {
            init_main();
            console.log("MSWeb initialization complete");
        },
    };
})();

$(window).on("load", frontpage.init);
