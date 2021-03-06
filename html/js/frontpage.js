// vim: set expandtab shiftwidth=4 softtabstop=4:

frontpage = (function(){

    var PageURL = "/AMaSS/index.html";
    var BaseURL = "/AMaSS/cgi-bin/frontpage.py";
    var modules = {};

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

    // =================================================================
    // Browse tab functions
    // =================================================================

    //
    // init_tab_browse:
    //   Initialize all sections of the "browse" tab
    //
    function init_tab_browse() {
        // console.log("init_tab_browse");
        init_browse_experiments();
        init_browse_metadata();
        init_browse_runs();
        init_browse_stats();
        browse_initialized = true;

        // Reset tab callback
        tab_funcs["tab-browse"] = show_tab_browse;
        show_tab_browse();
    }

    //
    // show_tab_browse:
    //   Display "browse" tab
    //
    function show_tab_browse() {
        // console.log("show_tab_browse");
        fill_browse_experiments(experiment_metadata);
    }

    // -----------------------------------------------------------------
    // Browse experiments section
    // -----------------------------------------------------------------

    //
    // Currently selected values in browse tab
    //
    var browse_initialized = false;
    var browse_exp_id;
    var browse_raw_id;

    //
    // Options for experiments table in browse tab
    //
    var BrowseExperimentsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: false,
        keepSelection: true,
        rowCount: [10, 20, 50, 100, -1],
        formatters: {
            "copy": function(column, row) {
                return '<button data-row-id="' + row.id +
                       '" class="btn btn-xs btn-default exp-copy-url">' +
                       '<span class="icon fa fa-copy align-top"></span></button>'
            }
        }
    };

    //
    // init_browse_experiments:
    //   Initialize table of experiments in "browse" tab
    //
    function init_browse_experiments() {
        var columns = [
            ["Title", "title"],
            ["Researcher", "researcher"],
            ["Upload Date", "uploaddate"],
        ];
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-searchable": false,
                                "data-visible": false }).text("Id"));
        htr.append($("<th/>", { "data-column-id": "copy",
                                "data-formatter": "copy",
                                "data-searchable": false,
                                "data-sortable": false }).text("URL"));
        $.each(columns, function(index, values) {
            htr.append($("<th/>", { "data-column-id": values[1] })
                            .text(values[0]));
        });
        var tbl = $("#browse-exp-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"))
           .bootgrid(BrowseExperimentsTableOptions)
           .on("selected.rs.jquery.bootgrid", browse_experiment_selected)
           .on("deselected.rs.jquery.bootgrid", browse_experiment_deselected)
           .on("loaded.rs.jquery.bootgrid", function() {
                tbl.find("button.exp-copy-url").on("click", function(ev) {
                    stop_default(ev);
                    var exp_id = ev.currentTarget.dataset.rowId
                    var exp = experiment_metadata[exp_id];
                    var msg = "URL to clipboard.";
                    if (exp.title || exp.uploader || exp.uploaddate)
                        msg += "\nExperiment: ";
                    if (exp.title)
                        msg += ' "' + exp.title + '"';
                    if (exp.uploader)
                        msg += " uploaded by " + exp.uploader;
                    if (exp.uploaddate)
                        msg += " on " + exp.uploaddate;
                    var url = [ location.protocol, "//",
                                location.host, PageURL,
                                "?exp_id=", exp_id ].join('');
                    msg += "\nURL: " + url;
                    var textarea = $("<textarea/>").appendTo($("body"))
                                                   .val(url)
                                                   .focus()
                                                   .select();
                    if (document.execCommand("copy"))
                        msg = "Copied " + msg;
                    else
                        msg = "Failed to copy " + msg;
                    textarea.remove();
                    alert(msg);
                });
            });
        $("#download-raw").click(download_experiment);
        $("#download-csv").click(download_csv);
        $("#download-selected").click(download_csv_selected);
        $("#analyze").click(analyze_experiment);
        browse_experiment_enable(false, true);
    }

    //
    // fill_browse_experiments:
    //   Display the list of experiments in browse table
    //
    function fill_browse_experiments(results) {
        if (!browse_initialized)
            return;
        var tbl = $("#browse-exp-table");
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
        if (experiment_init_target !== null) {
            tbl.on("loaded.rs.jquery.bootgrid", function() {
                // console.log("loaded");
                if (experiment_init_target == null)
                    tbl.off("loaded.rs.jquery.bootgrid");
                else {
                    if (tbl.bootgrid("getTotalRowCount") > 0) {
                        tbl.bootgrid("select", [ parseInt(experiment_init_target) ]);
                        experiment_init_target = null;
                    }
                }
            });
        }
        else if (browse_exp_id) {
            tbl.on("loaded.rs.jquery.bootgrid", function() {
                tbl.off("loaded.rs.jquery.bootgrid");
                tbl.bootgrid("select", [ browse_exp_id ]);
            });
        }
    }

    //
    // browse_experiment_selected:
    //   Event callback when user clicks on a row in browse table
    //
    function browse_experiment_selected(ev, rows) {
        // console.log("selected");
        if (rows[0].id == browse_exp_id)
            return;
        browse_exp_id = rows[0].id;
        set_run_order(browse_exp_id);
        fill_browse();
    }

    //
    // browse_experiment_deselected:
    //   Event callback when user deselects row in uploads table or
    //   selects a different row
    //
    function browse_experiment_deselected(ev, rows) {
        // console.log("deselected", browse_exp_id, browse_raw_id);
        if (browse_exp_id) {
            // XXX: clear out runs and data tables?
            browse_exp_id = undefined;
            browse_raw_id = undefined;
        }
        browse_experiment_enable(false, true);
    }

    //
    // browse_experiment_enable:
    //   Make buttons for browse experiment enabled/disabled
    //
    function browse_experiment_enable(enabled, toggle) {
        if (enabled) {
            $("#analyze").removeClass("disabled").removeAttr("disabled");
            $("#download").removeClass("disabled").removeAttr("disabled");
            var md = experiment_metadata[browse_exp_id];
            var module = get_module_by_type(md.exptype);
            if (module.download_csv == undefined) {
                $("#download-csv").addClass("disabled").attr("disabled", "disabled");
                $("#download-selected").addClass("disabled").attr("disabled", "disabled");
                $("#analyze").addClass("disabled").attr("disabled", "disabled");
            } else {
                $("#download-csv").removeClass("disabled").removeAttr("disabled");
                $("#download-selected").removeClass("disabled").removeAttr("disabled");
                $("#analyze").removeClass("disabled").removeAttr("disabled");
            }
            if (toggle)
                $("#exp-stats-tabs").collapse("show");
        } else {
            $("#analyze").addClass("disabled").attr("disabled", "disabled");
            $("#download").addClass("disabled").attr("disabled", "disabled");
            if (toggle)
                $("#exp-stats-tabs").collapse("hide");
        }
    }

    // -----------------------------------------------------------------
    // Browse runs section
    // -----------------------------------------------------------------

    //
    // Options for runs table in browse tab
    //
    var BrowseRunsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [-1],
    };

    //
    // init_browse_runs:
    //   Initialize runs table headers
    //
    function init_browse_runs() {
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-searchable": false,
                                "data-visible": true })
                        .text("Id"));
        htr.append($("<th/>", { "data-column-id": "name" })
                        .text("Name"));
        htr.append($("<th/>", { "data-column-id": "date" })
                        .text("Date"));
        htr.append($("<th/>", { "data-column-id": "category" })
                        .text("Category/Index"));
        var tbl = $("#browse-runs-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"))
           .bootgrid(BrowseRunsTableOptions);
    }

    //
    // fill_browse_runs:
    //   Display runs in selected experiment
    //
    function fill_browse_runs() {
        if (!browse_exp_id)
            return;
        if (!experiment_stats[browse_exp_id]) {
            get_experiment_stats(browse_exp_id, fill_browse);
            return;
        }
        // console.log("fill_browse_runs");
        var exp = experiment_metadata[browse_exp_id];
        var runs = exp["runs"];
        var rows = [];
        $.each(exp.run_order, function(run_index, run_name) {
            var run_data = runs[run_name];
            var row = { "id": run_index + 1,
                        "name": run_name,
                        "date": run_data["date"],
                        "category": exp.run_label[run_name], };
            rows.push(row);
        });
        $("#browse-runs-table").bootgrid("clear").bootgrid("append", rows);
        browse_experiment_enable(true, true);
    }

    //
    // set_run_order:
    //   Set the order in which runs will be displayed in
    //   runs tab and stats table columns
    //
    function set_run_order(exp_id) {
        var exp = experiment_metadata[exp_id];
        if (exp.run_order)
            return;
        var runs = exp["runs"];
        var run_label = {};
        var cat_index = {};
        var labels = []
        var label_name = {}
        Object.keys(runs).forEach(function(run_name) {
            var run_data = runs[run_name];
            var cat_name = run_data["category"];
            var index = cat_index[cat_name];
            if (index == null)
                index = 1;
            else
                index += 1;
            cat_index[cat_name] = index;
            var label = cat_name + "/" + index;
            run_label[run_name] = label;
            label_name[label] = run_name;
            labels.push(label);
        });
        labels.sort();
        run_order = $.map(labels, function(lab) { return label_name[lab]; });
        exp.run_order = run_order;
        exp.run_label = run_label;
    }

    // -----------------------------------------------------------------
    // Browse metadata section
    // -----------------------------------------------------------------

    //
    // init_browse_metadata:
    //   Display metadata upload form
    //
    function init_browse_metadata() {
        if (metadata_fields)
            make_browse_metadata_form();
        else
            $.ajax({
                dataType: "json",
                method: "POST",
                url: BaseURL,
                data: {
                    action: "metadata_fields",
                },
                success: function(data) {
                    metadata_fields = data.results;
                    make_browse_metadata_form();
                },
            });
    }

    //
    // make_browse_metadata_form:
    //   Lay out experiment attribute name and value fields in metadata form in browse tab
    //
    function make_browse_metadata_form() {
        var div = $("#exp-metadata-tab");
        // console.log(metadata_fields);
        $.each(metadata_fields, function(index, val) {
            var span_id = "browse-" + val[2];
            var label = $("<label/>", { "class": "col-2 col-form-label",
                                        "for": span_id }).text(val[0]);
            var span = $("<span/>", { "class": "col-10 col-form-label metadata-value",
                                      "id": span_id });
            div.append($("<div/>", { "class": "form-group row" })
                        .append(label, span));
        });
    }

    //
    // fill_browse_metadata:
    //   Display experiment attribute values in metadata form
    //
    function fill_browse_metadata(exp_id) {
        if (!browse_exp_id)
            return;
        var exp = experiment_metadata[browse_exp_id];
        $.each(metadata_fields, function(index, val) {
            var span_id = val[2];
            var field_value = exp[span_id];
            $("#browse-" + span_id).text(field_value);
        });
        browse_experiment_enable(true, true);
    }

    // -----------------------------------------------------------------
    // Browse raw data section
    // -----------------------------------------------------------------

    //
    // init_browse_stats:
    //   Initialize stats user interface in "browse" tab
    //
    function init_browse_stats() {
        return;
    }

    //
    // get_experiment_stats:
    //   Get experiment data from server
    //
    function get_experiment_stats(exp_id, callback) {
        // console.log("get_experiment_stats");
        show_status("fetching experiment data...", true)
        browse_experiment_enable(false, true);
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: "get_experiment",
                exp_id: exp_id,
            },
            success: function(data) {
                show_status("", false)
                if (data.status != "success") {
                    show_ajax_error(data.status, data.reason, data.cause);
                } else {
                    var exp_id = data.results.experiment_id;
                    var raw = data.results.experiment_data;
                    experiment_stats[exp_id] = { raw: raw };
                    callback();
                }
            },
            error: function(xhr, status, error) {
                alert("Fetching experiment data failed.");
                show_status(error);
            },
        });
    }

    //
    // show_experiment_raw:
    //   Display data for given experiment in browse tab
    //
    function show_experiment_raw(exp_id) {
        // console.log("show_experiment_raw", exp_id, browse_raw_id);
        if (browse_raw_id == exp_id)
            return;
        var md = experiment_metadata[browse_exp_id];
        var stats = experiment_stats[browse_exp_id];
        var module = get_module_by_type(md.exptype);
        module.show_raw(md, stats, "browse-stats-table", "browse-stats-table-container");
        browse_raw_id = exp_id;
    }

    //
    // fill_browse_raw:
    //   Fill browse raw tab
    //
    function fill_browse_raw() {
        if (!browse_exp_id)
            return;
        if (!experiment_stats[browse_exp_id]) {
            get_experiment_stats(browse_exp_id, fill_browse);
            return;
        }
        show_experiment_raw(browse_exp_id);
        browse_experiment_enable(true, true);
    }

    //
    // fill_browse:
    //   Fill active browse experiment tab
    //
    function fill_browse() {
        // console.log("fill_browse " + browse_exp_id);
        if (!browse_exp_id)
            return;
        var active = $("#exp-stats-tabs nav a.active").attr("id");
        // console.log("  active " + active);
        if (active == "tab-browse-raw")
            fill_browse_raw();
        else if (active == "tab-browse-runs")
            fill_browse_runs();
        else if (active == "tab-browse-metadata")
            fill_browse_metadata();
    }

    // -----------------------------------------------------------------
    // Code for various browse buttons
    // -----------------------------------------------------------------

    //
    // download_experiment:
    //   Download raw file for selected experiment
    //
    function download_experiment(ev) {
        ev.preventDefault();
        if (!browse_exp_id)
            alert("No experiment selected");
        else {
            var url = BaseURL + "?action=download_experiment&exp_id=" +
                      browse_exp_id;
            window.location.href = url;
        }
    }

    //
    // download_csv:
    //   Download raw file for selected experiment
    //
    function download_csv(ev) {
        ev.preventDefault();
        _download_csv(false);
    }

    //
    // download_csv:
    //   Download raw file for selected experiment
    //
    function download_csv_selected(ev) {
        ev.preventDefault();
        _download_csv(true);
    }

    //
    // _download_csv:
    //    Download selected (or all) rows for selected experiment
    //
    function _download_csv(only_selected) {
        if (!browse_exp_id)
            alert("No experiment selected");
        else {
            var md = experiment_metadata[browse_exp_id];
            var stats = experiment_stats[browse_exp_id];
            var table = browse_raw_id == browse_exp_id
                        ? $("#browse-stats-table") : null;
            var module = get_module_by_type(md.exptype);
            module.download_csv(only_selected, md, stats, table);
        }
    }

    //
    // unimplemented:
    //   Show alert saying functionality not ready yet
    //
    function unimplemented(ev) {
        ev.preventDefault();
        alert(ev.target.innerHTML + ": not implemented");
    }

    // =================================================================
    // Edit tab functions
    // =================================================================

    var edit_initialized = false;

    //
    // init_tab_edit:
    //   Initialize all sections of the "edit" tab
    //
    function init_tab_edit() {
        // Setup upload file elements
        $("#upload-drop").on("dragover", stop_default)
                         .on("dragenter", stop_default)
                         .on("drop", file_dropped);
        $("#upload-file").change(file_selected);
        $("#upload-button").click(upload_file).attr("disabled", "disabled");
        container = input = add_exptype_vocab("upload-type");
        input.click(update_upload_button);
        container.attr("class", "col-4");
        $("#upload-experiment-type").append(container);

        // Show experiments
        init_edit_experiments();
        init_edit_controlled_vocabulary();
        init_edit_metadata();
        init_edit_runs();
        edit_initialized = true;

        // Reset tab callback
        tab_funcs["tab-edit"] = show_tab_edit;
        show_tab_edit();
    }

    //
    // show_tab_edit:
    //   Display "edit" tab.  Currently does nothing,
    //   but may (in the future), refresh the list of experiments.
    //
    function show_tab_edit() {
        fill_edit_experiments(experiment_metadata);
    }

    // --------------------------------------------------------------------
    // Edit upload section
    // --------------------------------------------------------------------

    //
    // file_dropped:
    //   Event callback when user drops a file on our upload box
    //
    function file_dropped(ev) {
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
    function file_selected(ev) {
        var files = ev.target.files;
        if (files.length != 1) {
            alert("You can only upload one file at a time.");
            return;
        }
        set_file(files[0]);
    }

    //
    // Last file selected
    //
    var selected_file;

    //
    // set_file:
    //   Display the selected file name and size
    //
    function set_file(file) {
        selected_file = file;
        if (file)
            $("#upload-file-name").text(file.name + " (" +
                                        readable_size(file.size) + ")");
        update_upload_button();
    }

    //
    // update_upload_button:
    //   Update state of Upload button
    //
    function update_upload_button() {
        if (!selected_file || !$("#upload-type").val())
            $("#upload-button").attr("disabled", "disabled");
        else
            $("#upload-button").removeAttr("disabled");
    }

    //
    // upload_file:
    //   Upload selected file to server
    //
    function upload_file(ev) {
        stop_default(ev);
        if (!selected_file) {
            alert("Please select a file to upload");
            return;
        }
        // Have to do our own encoding since jQuery
        // AJAX data does not support files yet
        var form_data = new FormData();
        form_data.append("action", "file_upload");
        form_data.append("exptype", $("#upload-type").val());
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
                    show_ajax_error(data.status, data.reason, data.cause);
                } else {
                    set_upload_status("finished");
                    reload_experiments_tables();
                    $("#edit-metadata-body").collapse("toggle");
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
    function upload_progress(ev) {
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
    function set_upload_status(msg) {
        $("#upload-status").text(msg);
    }

    // --------------------------------------------------------------------
    // Edit controlled vocabulary section
    // --------------------------------------------------------------------

    var controlled_vocabulary;
    var cv_exptypes = [ "exptype-vocab" ];

    // 
    // init_edit_controlled_vocabulary:
    //   Initialize controlled vocabulary elements
    //
    function init_edit_controlled_vocabulary() {
        var v = add_editable_vocab("exptype-vocab", "experiment-type");
        $("#exptype-vocab-div").append(v[0]);
        v[1].prop("placeholder", "experiment type name");
        $("#add-experiment-type").attr("disabled", "disabled")
                                 .click(add_experiment_type);
        $("#remove-experiment-type").attr("disabled", "disabled")
                                    .click(remove_experiment_type);
        $("#exptype-vocab").on("input", experiment_type_changed);
        reload_controlled_vocabulary();
        experiment_type_changed();  // in case browser kept input history
    }

    //
    // reload_controlled_vocabulary:
    //   Update list of known controlled vocabulary terms
    //
    function reload_controlled_vocabulary() {
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
    function fill_controlled_vocabulary(data) {
        if (data)
            controlled_vocabulary = data.results;
        var root = $("#frontpage");
        fill_dropdown(root, "exptype-vocab",
                      controlled_vocabulary.experiment_types);
        $.each(cv_exptypes, function(index, eid) {
            fill_selector(root, eid, controlled_vocabulary.experiment_types);
        });
        experiment_type_changed();
    }

    function fill_dropdown(root, eid, list) {
        var input = root.find("#" + eid);
        var input_group = input.parent();
        var menu = input_group.find(".dropdown-menu");
        menu.empty();
        $.each(list, function(index, val) {
            menu.append($("<a/>", { "class": "dropdown-item",
                                    "href": "#",
                                    "data-value": val }).text(val));
        });
        var button = input_group.find(".input-group-prepend button");
        if (button) {
            if (list.length == 0)
                button.attr("disabled", "disabled");
            else
                button.removeAttr("disabled");
            menu.find("a").click(function() {
                input.val($(this).attr("data-value")).trigger("input");
            });
        }
    }

    function fill_selector(root, eid, values) {
        var select = root.find("#" + eid);
        var disabled = select.attr("disabled");
        if (disabled)
            select.removeAttr("disabled");
        select.empty();
        select.append($("<option/>", { "value": ""}));
        $.each(values, function(index, val) {
            select.append($("<option/>", { "value": val }).text(val));
        });
        if (disabled)
            select.attr("disabled", "disabled");
    }

    //
    // vocab_changed:
    //   Update button status when vocabulary input field changes
    //
    function vocab_changed(v, vid, values) {
        var add = $("#add-" + vid);
        var remove = $("#remove-" + vid);
        if (v && controlled_vocabulary) {
            if ($.inArray(v, values) == -1) {
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
    // add_editable_vocab:
    //   Add a editable dropdown input for controlled vocabulary
    //   without filling it in with the actual vocabulary terms
    //
    function add_editable_vocab(input_id, name) {
        var div = $("<div/>", { "class": "input-group mb-3" });
        var predefined = $("<div/>", { "class": "input-group-prepend" });
        var button = $("<button/>", { "class": "btn btn-outline-secondary dropdown-toggle",
                                      "type": button,
                                      "data-toggle": "dropdown",
                                      "aria-haspopup": "true",
                                      "aria-expanded": "false" });
        var dropdown = $("<div/>", { "class": "dropdown-menu" });
        var input = $("<input/>", { "type": "text",
                                    "id": input_id,
                                    "class": "form-control" });
        var actions = $("<div/>", { "class": "input-group-append" });
        actions.append($("<button/>", { "class": "btn btn-outline-secondary",
                                        "id": "add-" + name,
                                        "type": "button" }).text("Add"))
               .append($("<button/>", { "class": "btn btn-outline-secondary",
                                        "id": "remove-" + name,
                                        "type": "button" }).text("Remove"));
        predefined.append(button).append(dropdown);
        div.append(predefined, input, actions);
        return [ div, input ];
    }

    //
    // add_exptype_vocab:
    //   Add selector for experiment type
    //
    function add_exptype_vocab(input_id) {
        var select = $("<select/>", { "class": "form-control",
                                      "id": input_id });
        if (cv_exptypes.indexOf(input_id) == -1)
            cv_exptypes.push(input_id);
        return select;
    }

    //
    // experiment_type_changed:
    //   Event callback when user changes value of experiment input field
    //
    function experiment_type_changed() {
        if (controlled_vocabulary)
            vocab_changed($("#exptype-vocab").val(), "experiment-type",
                          controlled_vocabulary.experiment_types);
    }

    //
    // vocab_server:
    //   Send a request for controlled vocabulary change
    //
    function vocab_server(action, value) {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: action,
                exptype: value,
            },
            success: function(data) {
                if (data.status != "success")
                    show_ajax_error(data.status, data.reason, data.cause);
                else
                    reload_controlled_vocabulary();
            },
        });
    }

    //
    // add_experiment_type:
    //   Upload a new experiment type to server
    //
    function add_experiment_type() {
        vocab_server("add_experiment_type", $("#exptype-vocab").val());
    }

    //
    // remove_experiment_type:
    //   Upload a new experiment type to server
    //
    function remove_experiment_type() {
        vocab_server("remove_experiment_type", $("#exptype-vocab").val());
    }

    // --------------------------------------------------------------------
    // Edit experiment and runs section
    // --------------------------------------------------------------------

    var EditExperimentsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: false,
        keepSelection: true,
        rowCount: [10, 20, 50, 100, -1],
        formatters: {
            "actions": function(column, row) {
                return '<button data-row-id="' + row.id +
                       '" class="btn btn-xs btn-default exp-delete">' +
                       '<span class="icon fa fa-trash"></span></button>'
            }
        }
    }

    //
    // init_edit_experiments:
    //   Initialize the edit experiments table with appropriate headers
    //
    function init_edit_experiments() {
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
                                "data-searchable": false,
                                "data-visible": false }).text("Id"));
        htr.append($("<th/>", { "data-column-id": "actions",
                                "data-formatter": "actions",
                                "data-searchable": false,
                                "data-sortable": false }).text("Actions"));
        $.each(columns, function(index, values) {
            htr.append($("<th/>", { "data-column-id": values[1] })
                            .text(values[0]));
        });
        var tbl = $("#edit-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"))
           .bootgrid(EditExperimentsTableOptions)
           .on("selected.rs.jquery.bootgrid", edit_experiment_selected)
           .on("deselected.rs.jquery.bootgrid", edit_experiment_deselected)
           .on("loaded.rs.jquery.bootgrid", function() {
                tbl.find("button.exp-delete").on("click", function(ev) {
                    stop_default(ev);
                    // Use currentTarget = element listener is attached to
                    // not target = element triggering event
                    var exp_id = ev.currentTarget.dataset.rowId
                    var exp = experiment_metadata[exp_id];
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
    // fill_edit_experiments:
    //   Display the list of experiments in edit table
    //
    function fill_edit_experiments(results) {
        if (!edit_initialized)
            return;
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
        if (experiment_metadata)
            $.each(results, function(exp_id, exp) {
                if (!(exp_id in experiment_metadata))
                    new_experiments.push(exp_id);
            });
        if (new_experiments.length == 1)
            tbl.select(new_experiments);
        else if (edit_exp_id)
            tbl.select([ edit_exp_id ]);
    }

    //
    // edit_experiment_selected:
    //   Event callback when user clicks on a row in edit table
    //
    function edit_experiment_selected(ev, rows) {
        $("#edit-metadata-fieldset").removeAttr("disabled");
        $(".edit-metadata").removeClass("disabled")
        edit_exp_id = rows[0].id;
        show_edit_metadata(edit_exp_id);
    }

    //
    // edit_experiment_deselected:
    //   Event callback when user deselects row in uploads table or
    //   selects a different row
    //
    function edit_experiment_deselected(ev, rows) {
        $("#edit-metadata-fieldset").attr("disabled", "disabled");
        $(".edit-metadata").addClass("disabled")
        edit_exp_id = undefined;
        // XXX: hide metadata?
    }

    //
    // delete_experiment:
    //   Delete experiment on server
    //
    function delete_experiment(exp_id) {
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
                    show_ajax_error(data.status, data.reason, data.cause);
                } else {
                    reload_experiments_tables();
                }
            },
        });
    }

    // --------------------------------------------------------------------
    // Edit experiment metadata section
    // --------------------------------------------------------------------

    var metadata_fields;
    var edit_exp_id;

    //
    // init_edit_metadata:
    //   Display metadata upload form
    //
    function init_edit_metadata() {
        $("#edit-metadata-button").click(update_metadata);
        $("#edit-revert-metadata-button").click(revert_metadata);
        if (metadata_fields)
            fill_edit_metadata_form();
        else
            $.ajax({
                dataType: "json",
                method: "POST",
                url: BaseURL,
                data: {
                    action: "metadata_fields",
                },
                success: function(data) {
                    metadata_fields = data.results;
                    fill_edit_metadata_form();
                },
            });
    }

    //
    // fill_edit_metadata_form:
    //   Lay out experiment attribute name and value fields in metadata form
    //
    function fill_edit_metadata_form() {
        var div = $("#edit-metadata-exp");
        $.each(metadata_fields, function(index, val) {
            var input_type = val[1];
            var input_id = val[2];
            var label = $("<label/>", { "class": "col-2 col-form-label",
                                        "for": input_id }).text(val[0]);
            var input;
            if (input_type == "exptype") {
                container = input = add_exptype_vocab(input_id);
                input.addClass("disabled").attr("disabled", "disabled");
            } else if (input_type == "runcat") {
                container = input = add_runcat_vocab(input_id);
            } else if (input_type == "textarea")
                container = input = $("<textarea/>", { "id": input_id });
            else
                container = input = $("<input/>", { "type": input_type,
                                                    "id": input_id });
            $.each(val[3], function(index, value) {
                input.prop(value[0], value[1]);
            });
            container.attr("class", "col-10");
            div.append($("<div/>", { "class": "form-group row" })
                        .append(label, container));
        });
    }

    //
    // show_edit_metadata:
    //   Display experiment attribute values in metadata form
    //
    function show_edit_metadata(exp_id) {
        fill_controlled_vocabulary(null);
        fill_run_category_vocabulary(exp_id, null);
        var exp = experiment_metadata[exp_id];
        $.each(metadata_fields, function(index, val) {
            var input_id = val[2];
            var field_value = exp[input_id];
            $("#" + input_id).val(field_value);
        });
        fill_edit_runs(exp_id);
    }

    //
    // update_metadata:
    //   Send current metadata values to server
    //   NB: run category vocabulary is not included!
    //
    function update_metadata(ev) {
        stop_default(ev);
        var form_data = {
            "action": "update_experiment",
            "exp_id": edit_exp_id,
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
            var cat = $(this).find("td:nth-child(3) select").val();
            // keys should match those used in fill_edit_runs()
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
                    show_ajax_error(data.status, data.reason, data.cause);
                else
                    reload_experiments_tables();
            },
        });
    }

    //
    // revert_metadata:
    //   Revert metadata values to unchanged values
    //
    function revert_metadata() {
        show_edit_metadata(edit_exp_id);
    }

    // -----------------------------------------------------------------
    // Edit runs metadata section
    // -----------------------------------------------------------------

    var cv_runcats = [];

    //
    // init_edit_runs:
    //   Initialize the edit runs table with appropriate headers
    //
    function init_edit_runs() {
        var htr = $("<tr/>");
        htr.append($("<th/>").text("Name"));
        htr.append($("<th/>").text("Date"));
        htr.append($("<th/>").text("Category"));
        var tbl = $("#edit-runs-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"));
        var v = add_editable_vocab("runcat-vocab", "run-category");
        $("#runcat-vocab-div").append(v[0]);
        v[1].prop("placeholder", "run category name");
        $("#add-run-category").attr("disabled", "disabled")
                              .click(add_run_category);
        $("#remove-run-category").attr("disabled", "disabled")
                                 .click(remove_run_category);
        $("#runcat-vocab").on("input", run_category_changed);
    }

    //
    // fill_edit_runs:
    //   Display experiment attribute values in metadata form
    //
    function fill_edit_runs(exp_id) {
        var exp = experiment_metadata[exp_id];
        var tbl = $("#edit-runs-table");
        var tbody = tbl.find("tbody");
        tbody.empty();
        var rid = 1;
        var runs = exp.runs;
        Object.keys(runs).sort().forEach(function(run_name) {
            var run_data = runs[run_name];
            var tr = $("<tr/>");
            tr.append($("<td/>").text(run_name));
            tr.append($("<td/>").append($("<input/>",
                                            { type: "date",
                                              value: run_data["date"] })));
            var input_id = "run-" + rid;
            container = input = add_runcat_vocab(input_id);
            tr.append($("<td/>").append(container));
            tbody.append(tr);
            fill_selector(tr, input_id, exp.run_categories);
            input.val(run_data["category"]);
            rid += 1;
        });
    }

    //
    // add_runcat_vocab:
    //   Add selector for run category
    //
    function add_runcat_vocab(input_id) {
        var select = $("<select/>", { "class": "form-control",
                                      "id": input_id });
        if (cv_runcats.indexOf(input_id) == -1)
            cv_runcats.push(input_id);
        return select;
    }

    //
    // fill_run_category_vocabulary:
    //   Reload run category dropdowns
    //
    function fill_run_category_vocabulary(exp_id, categories) {
        var exp = experiment_metadata[exp_id];
        if (categories != null)
            exp.run_categories = categories;
        var root = $("#edit-metadata-runs");
        fill_dropdown(root, "runcat-vocab", exp.run_categories);
        $.each(cv_runcats, function(index, eid) {
            fill_selector(root, eid, exp.run_categories);
        });
        run_category_changed();
    }

    //
    // run_category_vocab_server:
    //   Send a request for controlled vocabulary change
    //
    function run_category_vocab_server(action, exp_id, value) {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: action,
                exp_id: exp_id,
                run_cat: value,
            },
            success: function(data) {
                if (data.status != "success")
                    show_ajax_error(data.status, data.reason, data.cause);
                else
                    fill_run_category_vocabulary(data.results.exp_id,
                                                 data.results.run_categories);
            },
        });
    }

    //
    // add_run_category:
    //   Upload a new run category to server
    //
    function add_run_category() {
        run_category_vocab_server("add_run_category", edit_exp_id,
                                  $("#runcat-vocab").val());
    }

    //
    // remove_run_category:
    //   Upload a new run category to server
    //
    function remove_run_category() {
        run_category_vocab_server("remove_run_category", edit_exp_id,
                                  $("#runcat-vocab").val());
    }

    //
    // run_category_changed:
    //   Event callback when user changes value of category input field
    //
    function run_category_changed(ev) {
        vocab_changed($("#runcat-vocab").val(), "run-category",
                      experiment_metadata[edit_exp_id].run_categories);
    }

    function analyze_experiment() {
        if (browse_exp_id in experiment_stats)
            create_analyze_tab();
        else
            get_experiment_stats(browse_exp_id, create_analyze_tab);
    }

    function create_analyze_tab() {
        var md = experiment_metadata[browse_exp_id];
        var module = get_module_by_type(md.exptype);
        module.create_tab($("#frontpage"), browse_exp_id, md,
                          experiment_stats[browse_exp_id]);
    }

    // =================================================================
    // Main page functions
    // =================================================================

    var tab_funcs = {
        "tab-browse": init_tab_browse,
        "tab-browse-raw": fill_browse_raw,
        "tab-browse-metadata": fill_browse_metadata,
        "tab-browse-runs": fill_browse_runs,
        "tab-edit": init_tab_edit,
    };
    var experiment_metadata = {}      // All experiment metadata
    var experiment_stats = {}         // Fetched experiment stats
    var experiment_init_target;

    //
    // init_main:
    //   Initialize front page
    //
    function init_main() {
        // Enumerate all supported experiment type modules
        modules["abundance"] = abundance;
        modules["generic"] = generic;

        get_themes();
        $("#frontpage").on("shown.bs.tab", function(e) {
            var func = tab_funcs[e.target["id"]];
            if (func)
                func();
        });
        if (window.location.href.indexOf("upload") >= 0) {
            // Make the edit/upload tab active
            $("#tab-edit").tab("show");
        } else {
            // Blow away the edit/upload tabs and make browse tab active
            $("#tab-edit").remove();
            $("#edit-tab").remove();
            $("#tab-browse").tab("show");
        }
        for (var module_name in modules) {
            var module = modules[module_name];
            if (module.init !== undefined)
                module.init();
        }
        experiment_init_target = get_parameter("exp_id");
        reload_experiments_tables();
    };

    //
    // get_parameter:
    //   Return query parameter from URL
    //   Adapted from http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
    //
    function get_parameter(param) {
        var url = window.location.search.substring(1);
        var parameters = url.split('&');
        for (var i = 0; i < parameters.length; i++) {
            var param_parts = parameters[i].split('=');
            if (param_parts[0] == param)
                return param_parts[1]
        }
        return null;
    }

    //
    // get_themes:
    //   Fetch list of Bootstrap themes from cdnjs
    //
    function get_themes() {
        $.ajax({
            dataType: "json",
            method: "GET",
            url: "https://bootswatch.com/api/4.json",
            success: function(data) {
                var select = $("#themes");
                $.each(data.themes, function(index, theme) {
                    select.append($("<option/>", { "data-value": theme.cssCdn })
                                    .text(theme.name));
                });
                select.change(function() {
                    var url = $(this).children(":selected").attr("data-value");
                    if (url) {
                        var theme = $("#css-theme");
                        if (theme.length > 0)
                            theme.attr("href", url);
                        else
                            $("<link/>", { "id": "css-theme",
                                           "rel": "stylesheet",
                                           "type": "text/css",
                                           "href": url })
                                .appendTo($("head"));
                    }
                });
                select.val("Cosmo").trigger("change");
            }
        });
    }

    //
    // reload_experiments_tables:
    //   Upload list of experiments in edit tab
    //
    function reload_experiments_tables() {
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
    function fill_experiment_tables(data) {
        if (data.status != "success")
            show_ajax_error(data.status, data.reason, data.cause);
        else {
            fill_browse_experiments(data.results);
            fill_edit_experiments(data.results);
            experiment_metadata = data.results;
        }
    }

    // =================================================================
    // Utility functions
    // =================================================================

    //
    // stop_default:
    //   Event callback that prevents default action and propagation
    //  
    function stop_default(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    //
    // readable_size:
    //   Return file size in human-readable form
    //
    function readable_size(size) {
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
    // show_ajax_error:
    //   Display error from server
    //
    function show_ajax_error(status, reason, cause) {
        if (cause)
            console.log("cause of error: " + cause);
        var msg = status + ": " + reason;
        alert(msg);
    }

    //
    // show_status:
    //   Display status at status box at top of page
    //
    function show_status(msg, busy) {
        $("#top-status-box").text(msg);
        $("body").css("cursor", busy ? "progress" : "default");
    }

    //
    // get_module_by_type:
    //   Return module by experiment type
    //   Modules define download_csv() and display() methods
    //
    function get_module_by_type(type) {
        var lc_type = type.toLowerCase();
        for (var module_name in modules)
            if (lc_type.startsWith(module_name))
                return modules[module_name];
        return generic;
    }

    return {
        init: function() {
            init_main();
            console.log("AMaSS initialization complete");
        },
        url: BaseURL,
        show_status: show_status,
        show_ajax_error: show_ajax_error,
    };
})();

$(window).on("load", frontpage.init);
