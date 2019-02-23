/* vim: set expandtab shiftwidth=4 softtabstop=4: */

//
// TODO:
// Main page:
//      ~~Change tab names to Analyze and Edit
// Edit tab experiments table:
//      ~~Replace incomplete uploads with all experiments + status
//      ~~    (Sort by "status" to see incomplete uploads together)
//      ~~Add delete experiment button with popup confirmation
//      ~~Replace Experiment Condition with Notes
// Edit tab upload form:
//      ~~Add controls for experiment type vocabulary
//      ~~Add controls for run category vocabulary
//      Make editing experiment attributes work
//      Add editable runs table for setting category and date
// Analyze tab:
//      ???
//

frontpage = (function(){

    var BaseURL = "/MSWeb/cgi-bin/upload.py"

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

    var AnalyzeTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
    }

    //
    // init_tab_analyze:
    //   Initialize all sections of the "analyze" tab
    //
    var init_tab_analyze = function() {
        // Setup grid layout for all sections
        $("#expanalyze").layout({
            name: "expanalyze",
            north__size: "40%"
        });
        //
        // Show experiments
        init_analyze_table();

        /* Reset tab callback */
        tab_funcs.tab_analyze = show_tab_analyze;
        show_tab_analyze();
    }

    //
    // show_tab_analyze:
    //   Display "analyze" tab
    //
    var show_tab_analyze = function() {
        fill_analyze_table(experiments);
    }

    //
    // init_analyze_table:
    //   Initialize table of experiments in "analyze" tab
    //
    var init_analyze_table = function() {
        var columns = [
            ["Title", "title"],
            ["Researcher", "researcher"],
            ["Upload Date", "uploaddate"],
        ];
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-searchable": "false",
                                "data-visible": false }).text("Id"));
        $.each(columns, function(index, values) {
            htr.append($("<th/>", { "data-column-id": values[1] })
                            .text(values[0]));
        });
        var tbl = $("#analyze-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"))
           .bootgrid(AnalyzeTableOptions)
           .on("selected.rs.jquery.bootgrid", analyze_experiment_selected)
           .on("deselected.rs.jquery.bootgrid", analyze_experiment_deselected);
    }

    //
    // fill_analyze_table:
    //   Display the list of experiments in analyze table
    //
    var fill_analyze_table = function(results) {
        var tbl = $("#analyze-table");
        tbl.bootgrid("clear");
        var rows = [];
        $.each(results, function(exp_id, exp) {
            if (exp.status != "incomplete") {
                var row = Object.assign({id: parseInt(exp_id)}, exp);
                rows.push(row);
            }
        });
        tbl.bootgrid("append", rows);

        //
        // If an experiment was selected, select it again.
        //
        if (analyze_exp_id)
            tbl.select([ analyze_exp_id ]);
    }

    //
    // analyze_experiment_selected:
    //   Event callback when user clicks on a row in analyze table
    //
    var analyze_experiment_selected = function(ev, rows) {
        // TODO: update display for newly selected experiment
        alert("update display for newly selected experiment");
    }

    //
    // analyze_experiment_deselected:
    //   Event callback when user deselects row in uploads table or
    //   selects a different row
    //
    var analyze_experiment_deselected = function(ev, rows) {
        // TODO: hide display of experiment data
        alert("hide display of experiment data");
    }

    // -----------------------------------------------------------------
    // Edit tab functions
    // -----------------------------------------------------------------

    //
    // init_tab_edit:
    //   Initialize all sections of the "edit" tab
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
        init_runs_form();

        /* Reset tab callback */
        tab_funcs.tab_edit = show_tab_edit;
        show_tab_edit();
    }

    //
    // show_tab_edit:
    //   Display "edit" tab.  Currently does nothing,
    //   but may (in the future), refresh the list of experiments.
    //
    var show_tab_edit = function() {
        fill_edit_table(experiments);
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
        // Have to do our own encoding since jQuery
        // AJAX data does not support files yet
        var form_data = new FormData();
        form_data.append("action", "file_upload");
        form_data.append("datafile", selected_file, selected_file.name);
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: form_data,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.status != "success") {
                    set_upload_status("error: " + data.reason);
                    show_error(data.status, data.reason, data.cause);
                } else {
                    set_upload_status("finished");
                    reload_experiment_tables();
                }
            },
            error: function(jqXHR, text_status, error_thrown) {
                var msg = text_status ? text_status : "error";
                if (error_thrown)
                    msg += ": " + error_thrown;
                set_upload_status(msg);
            },
            xhr: function() {
                var xhr = new XMLHttpRequest();
                xhr.upload.addEventListener("progress", upload_progress, false);
                return xhr;
            },
        });
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
    var analyze_exp_id;

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
                                "data-searchable": "false",
                                "data-visible": false }).text("Id"));
        htr.append($("<th/>", { "data-column-id": "actions",
                                "data-formatter": "actions",
                                "data-searchable": "false",
                                "data-sortable": false }).text("Actions"));
        $.each(columns, function(index, values) {
            htr.append($("<th/>", { "data-column-id": values[1] })
                            .text(values[0]));
        });
        var tbl = $("#edit-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"))
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
    }

    //
    // fill_edit_table::
    //   Display the list of experiments in edit table
    //
    var fill_edit_table = function(results) {
        var tbl = $("#edit-table");
        if (tbl.find("tbody").length == 0)
            return;
        tbl.bootgrid("clear");
        var rows = [];
        $.each(results, function(exp_id, exp) {
            var row = Object.assign({id: parseInt(exp_id)}, exp);
            rows.push(row);
        });
        tbl.bootgrid("append", rows);

        // If there is exactly one new experiment, select it
        // (probably an upload).  If an experiment was selected,
        // select it (probably an edit).
        var new_experiments = [];
        if (experiments)
            $.each(results, function(exp_id, exp) {
                if (!(exp_id in experiments))
                    new_experiments.push(exp_id);
            });
        if (new_experiments.length == 1)
            tbl.select(new_experiments);
        else if (metadata_exp_id)
            tbl.select([ metadata_exp_id ]);
    }

    //
    // edit_experiment_selected:
    //   Event callback when user clicks on a row in edit table
    //
    var edit_experiment_selected = function(ev, rows) {
        $("#edit-metadata-fieldset").removeAttr("disabled");
        $("#edit-metadata-button").removeAttr("disabled");
        $("#edit-revert-metadata-button").removeAttr("disabled");
        show_metadata(rows[0].id);
    }

    //
    // edit_experiment_deselected:
    //   Event callback when user deselects row in uploads table or
    //   selects a different row
    //
    var edit_experiment_deselected = function(ev, rows) {
        $("#edit-metadata-fieldset").attr("disabled", "disabled");
        $("#edit-metadata-button").attr("disabled", "disabled");
        $("#edit-revert-metadata-button").attr("disabled", "disabled");
    }

    //
    // delete_experiment:
    //   Delete experiment on server
    //
    var delete_experiment = function(exp_id) {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: "delete_experiment",
                exp_id: exp_id,
            },
            success: function(data) {
                if (data.status != "success") {
                    show_error(data.status, data.reason, data.cause);
                } else {
                    reload_experiment_tables();
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
    var cv_exptypes = [ "exptype-vocab" ];
    var cv_runcats = [ "runcat-vocab" ];

    // 
    // init_controlled_vocabulary:
    //   Initialize controlled vocabulary elements
    //
    var init_controlled_vocabulary = function() {
        var v = add_vocab_dropdown("exptype-vocab");
        $("#exptype-vocab-div").append(v[0]);
        v[1].prop("placeholder", "experiment type name");
        v = add_vocab_dropdown("runcat-vocab");
        $("#runcat-vocab-div").append(v[0]);
        v[1].prop("placeholder", "run category name");
        $("#add-experiment-type").attr("disabled", "disabled")
                                 .click(add_experiment_type);
        $("#remove-experiment-type").attr("disabled", "disabled")
                                    .click(remove_experiment_type);
        $("#add-run-category").attr("disabled", "disabled")
                              .click(add_run_category);
        $("#remove-run-category").attr("disabled", "disabled")
                                 .click(remove_run_category);
        $("#exptype-vocab").on("input", experiment_type_changed);
        $("#runcat-vocab").on("input", run_category_changed);
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
            method: "POST",
            url: BaseURL,
            data: {
                action: "controlled_vocabulary",
            },
            success: fill_controlled_vocabulary,
        });
    }

    //
    // fill_controlled_vocabulary:
    //   Add elements for selecting and adding controlled vocabulary terms
    //
    var fill_controlled_vocabulary = function(data) {
        if (data)
            controlled_vocabulary = data.results;
        var root = $("#frontpage");
        $.each(cv_exptypes, function(index, eid) {
            fill_list(root, eid, controlled_vocabulary.experiment_types);
        });
        $.each(cv_runcats, function(index, eid) {
            fill_list(root, eid, controlled_vocabulary.run_categories);
        });
        experiment_type_changed();
        run_category_changed();
    }

    var fill_list = function(root, eid, list) {
        // eid is the root (e.g., "exptype")
        // Fill in list eid-list (e.g., "exptype-list") and
        // add callback to update eid (e.g., "exptype-vocab")
        if (list.length == 0)
            list = [ "None" ];
        var ul_id = "#" + eid + "-list"
        var ul = root.find(ul_id);
        ul.empty();
        $.each(list, function(index, val) {
            var a = $("<a/>", { href: "#", "data-value": val }).text(val);
            ul.append($("<li/>").append(a));
        });
        root.find(ul_id + " a").click(function() {
            $("#" + eid).val($(this).attr("data-value")).trigger("input");
        });
    }

    //
    // vocab_changed:
    //   Update button status when vocabulary input field changes
    //
    var vocab_changed = function(v, vid, vkey) {
        var add = $("#add-" + vid);
        var remove = $("#remove-" + vid);
        if (v && controlled_vocabulary) {
            if ($.inArray(v, controlled_vocabulary[vkey]) == -1) {
                add.removeAttr("disabled");
                remove.attr("disabled", "disabled");
            } else {
                add.attr("disabled", "disabled");
                remove.removeAttr("disabled");
            }
        } else {
            add.attr("disabled", "disabled");
            remove.attr("disabled", "disabled");
        }
    }

    //
    // add_vocab_dropdown:
    //   Add a editable dropdown input for controlled vocabulary
    //   without filling it in with the actual vocabulary terms
    //
    var add_vocab_dropdown = function(input_id) {
        var div = $("<div/>", { "class": "input-group dropdown" });
        var input = $("<input/>", { "type": "text",
                                    "id": input_id,
                                    "class": "form-control dropdown-toggle" });
        var ul_id = input_id + "-list";
        var ul = $("<ul/>", { "id": ul_id,
                              "class": "dropdown-menu" });
        var span = $("<span/>", { role: "button",
                                  "class": "input-group-addon dropdown-toggle",
                                  "data-toggle": "dropdown",
                                  "aria-haspopup": "true",
                                  "aria-expanded": "false" });
        span.append($("<span/>", { "class": "fa fa-caret-down" }));
        div.append(input).append(ul).append(span);
        return [ div, input ];
    }

    //
    // add_exptype_vocab
    //   Fill in experiment type terms in dropdown list
    //
    var add_exptype_vocab = function(root, input_id, fill_now) {
        if (fill_now && controlled_vocabulary)
            fill_list(root, input_id, controlled_vocabulary.experiment_types);
        if (cv_exptypes.indexOf(input_id) == -1)
            cv_exptypes.push(input_id);
    }

    //
    // add_runcat_vocab:
    //   Fill in run category terms in dropdown list
    //
    var add_runcat_vocab = function(root, input_id, fill_now) {
        if (fill_now && controlled_vocabulary)
            fill_list(root, input_id, controlled_vocabulary.run_categories);
        if (cv_runcats.indexOf(input_id) == -1)
            cv_runcats.push(input_id);
    }

    //
    // experiment_type_changed:
    //   Event callback when user changes value of experiment input field
    //
    var experiment_type_changed = function() {
        vocab_changed($("#exptype-vocab").val(), "experiment-type",
                      "experiment_types");
    }

    //
    // run_category_changed:
    //   Event callback when user changes value of category input field
    //
    var run_category_changed = function(ev) {
        vocab_changed($("#runcat-vocab").val(), "run-category",
                      "run_categories");
    }

    //
    // vocab_server:
    //   Send a request for controlled vocabulary change
    //
    var vocab_server = function(action, value) {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL + "/cgi-bin/upload.py",
            data: {
                action: action,
                exp_type: value,
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
    // add_experiment_type:
    //   Upload a new experiment type to server
    //
    var add_experiment_type = function() {
        vocab_server("add_experiment_type", $("#exptype-vocab").val());
    }

    //
    // remove_experiment_type:
    //   Upload a new experiment type to server
    //
    var remove_experiment_type = function() {
        vocab_server("remove_experiment_type", $("#exptype-vocab").val());
    }

    //
    // add_run_category:
    //   Upload a new run category to server
    //
    var add_run_category = function() {
        vocab_server("add_run_category", $("#runcat-vocab").val());
    }

    //
    // remove_run_category:
    //   Upload a new run category to server
    //
    var remove_run_category = function() {
        vocab_server("remove_run_category", $("#runcat-vocab").val());
    }

    //
    // --------------------------------------------------------------------
    // Metadata upload form
    // --------------------------------------------------------------------
    //

    var metadata_fields;
    var metadata_exp_id;

    //
    // init_metadata_form:
    //   Display metadata upload form
    //
    var init_metadata_form = function() {
        $("#edit-metadata-button").click(update_metadata);
        $("#edit-revert-metadata-button").click(revert_metadata);
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: "metadata_fields",
            },
            success: fill_metadata_form,
        });
    }

    //
    // fill_metadata_form:
    //   Lay out experiment attribute name and value fields in metadata form
    //
    var fill_metadata_form = function(data) {
        var div = $("#edit-metadata-fieldset div");
        $.each(data.results, function(index, val) {
            var input_type = val[1];
            var input_id = val[2];
            var label = $("<label/>", { "for": input_id }).text(val[0]);
            var input;
            if (input_type == "exptype") {
                var v = add_vocab_dropdown(input_id);
                container = v[0];
                input = v[1];
                add_exptype_vocab(container, input_id, false);
            } else if (input_type == "runcat") {
                var v = add_vocab_dropdown(input_id);
                container = v[0];
                input = v[1];
                add_runcat_vocab(container, input_id, false);
            } else if (input_type == "textarea")
                container = input = $("<textarea/>", { "id": input_id });
            else
                container = input = $("<input/>", { "type": input_type,
                                                    "id": input_id });
            $.each(val[3], function(index, value) {
                input.prop(value[0], value[1]);
            });
            div.append(label).append(container);
        });
        metadata_fields = data.results;
    }

    //
    // show_metadata:
    //   Display experiment attribute values in metadata form
    //
    var show_metadata = function(exp_id) {
        metadata_exp_id = exp_id;
        var exp = experiments[exp_id];
        $.each(metadata_fields, function(index, val) {
            var input_id = val[2];
            var field_value = exp[input_id];
            $("#" + input_id).val(field_value);
        });
        show_runs(exp_id);
        // Fill vocabulary dropdowns.  The "run category" dropdowns
        // are built empty, so we have to fill them.  This also
        // refills all other vocabulary dropdowns as a side effect,
        // so maybe we want to be a little more efficient about it.
        fill_controlled_vocabulary(null);
    }

    //
    // update_metadata:
    //   Send current metadata values to server
    //
    var update_metadata = function(ev) {
        stop_default(ev);
        var form_data = {
            "action": "update_experiment",
            "exp_id": metadata_exp_id,
        }
        $.each(metadata_fields, function(index, val) {
            var input_id = val[2];
            var value = $("#" + input_id).val();
            if (value)
                form_data[input_id] = value;
        });
        var runs = {};
        $("#edit-runs-table tbody tr").each(function(index) {
            var name = $(this).find("td:nth-child(1)").text();
            var date = $(this).find("td:nth-child(2) input").val();
            var cat = $(this).find("td:nth-child(3) input").val();
            // keys should match those used in show_runs()
            runs[name] = { date: date, category: cat };
        });
        form_data["runs"] = JSON.stringify(runs);
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: form_data,
            success: function(data) {
                if (data.status != "success")
                    show_error(data.status, data.reason, data.cause);
                else
                    reload_edit_table();
            },
        });
    }

    //
    // revert_metadata:
    //   Revert metadata values to unchanged values
    //
    var revert_metadata = function() {
        show_metadata(metadata_exp_id);
    }

    // -----------------------------------------------------------------
    // Edit runs table
    // -----------------------------------------------------------------

    //
    // init_runs_form:
    //   Initialize the edit runs table with appropriate headers
    //
    var init_runs_form = function() {
        var htr = $("<tr/>");
        htr.append($("<th/>").text("Name"));
        htr.append($("<th/>").text("Date"));
        htr.append($("<th/>").text("Category"));
        var tbl = $("#edit-runs-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"));
    }

    //
    // show_runs:
    //   Display experiment attribute values in metadata form
    //
    var show_runs = function(exp_id) {
        var exp = experiments[exp_id];
        var tbl = $("#edit-runs-table");
        var tbody = tbl.find("tbody");
        tbody.empty();
        var rid = 1;
        // $.each(exp["runs"], function(run_name, run_data) {
        var runs = exp["runs"];
        Object.keys(runs).sort().forEach(function(run_name) {
            var run_data = runs[run_name];
            var tr = $("<tr/>");
            tr.append($("<td/>").text(run_name));
            tr.append($("<td/>").append($("<input/>",
                                            { type: "date",
                                              value: run_data["date"] })));
            var input_id = "run-" + rid;
            var v = add_vocab_dropdown(input_id);
            container = v[0];
            input = v[1];
            add_runcat_vocab(container, input_id, false);
            input.attr("placeholder", "run category name");
            input.val(run_data["category"]);
            tr.append($("<td/>").append(container));
            tbody.append(tr);
            rid += 1;
        });
    }

    // -----------------------------------------------------------------
    // Main page functions
    // -----------------------------------------------------------------

    var tab_funcs = {
        tab_analyze: init_tab_analyze,
        tab_edit: init_tab_edit,
    };
    var experiments = {}      // Last set of experiments from server

    //
    // init_main:
    //   Initialize front page
    //
    var init_main = function() {
        $("#frontpage").on("shown.bs.tab", function(e) {
            var func = tab_funcs[e.target["id"]];
            if (func)
                func();
        });
        var active = $("#frontpage .nav li.active a").attr("id");
        tab_funcs[active]();
        reload_experiment_tables();
    };

    //
    // reload_experiment_tables:
    //   Upload list of experiments in edit table
    //
    var reload_experiment_tables = function() {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: "all_experiments"
            },
            success: fill_experiment_tables,
        });
    }

    //
    // fill_experiment_tables:
    //   Display the list of experiments in edit table
    //
    var fill_experiment_tables = function(data) {
        if (data.status != "success")
            show_error(data.status, data.reason, data.cause);
        else {
            fill_analyze_table(data.results);
            fill_edit_table(data.results);
            experiments = data.results;
        }
    }

    // -----------------------------------------------------------------
    // Utility functions
    // -----------------------------------------------------------------

    //
    // stop_default:
    //   Event callback that prevents default action and propagation
    //  
    var stop_default = function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

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
        if (cause)
            console.log("cause of error: " + cause);
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
