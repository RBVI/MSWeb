// vim: set expandtab shiftwidth=4 softtabstop=4:

//
// TODO:
//   Add plot area
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

    // =================================================================
    // Browse tab functions
    // =================================================================

    //
    // init_tab_browse:
    //   Initialize all sections of the "browse" tab
    //
    var init_tab_browse = function() {
        init_browse_experiments();
        init_browse_runs();
        init_browse_stats();

        // Reset tab callback
        tab_funcs.tab_browse = show_tab_browse;
        show_tab_browse();
    }

    //
    // show_tab_browse:
    //   Display "browse" tab
    //
    var show_tab_browse = function() {
        fill_browse_experiments(experiment_metadata);
    }

    // -----------------------------------------------------------------
    // Browse experiments section
    // -----------------------------------------------------------------

    //
    // Currently selected values in browse tab
    //
    var browse_exp_id;
    var browse_summary_id;
    var browse_raw_id;
    var browse_raw_rows;

    //
    // Options for experiments table in browse tab
    //
    var BrowseExperimentsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: false,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
    };

    //
    // init_browse_experiments:
    //   Initialize table of experiments in "browse" tab
    //
    var init_browse_experiments = function() {
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
        $.each(columns, function(index, values) {
            htr.append($("<th/>", { "data-column-id": values[1] })
                            .text(values[0]));
        });
        var tbl = $("#browse-exp-table");
        tbl.append($("<thead/>").append(htr))
           .append($("<tbody/>"))
           .bootgrid(BrowseExperimentsTableOptions)
           .on("selected.rs.jquery.bootgrid", browse_experiment_selected)
           .on("deselected.rs.jquery.bootgrid", browse_experiment_deselected);
        $("#download").click(download_experiment).attr("disabled", "disabled");
        $("#showplot").click(show_plot).attr("disabled", "disabled");
        $(".make-plot-button").click(make_plot);
        $(".cancel-plot-button").click(cancel_plot);
    }

    //
    // fill_browse_experiments:
    //   Display the list of experiments in browse table
    //
    var fill_browse_experiments = function(results) {
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
        if (browse_exp_id)
            tbl.select([ browse_exp_id ]);
    }

    //
    // browse_experiment_selected:
    //   Event callback when user clicks on a row in browse table
    //
    var browse_experiment_selected = function(ev, rows) {
        $("#download").removeAttr("disabled");
        $("#showplot").removeAttr("disabled");
        $("#browse-fieldset").removeAttr("disabled");
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
    var browse_experiment_deselected = function(ev, rows) {
        if (browse_exp_id) {
            // XXX: clear out runs and data tables?
            $("#browse-fieldset").attr("disabled", "disabled");
            browse_exp_id = undefined;
            browse_summary_id = undefined;
            browse_raw_id = undefined;
            browse_raw_rows = undefined;
        }
        $("#download").attr("disabled", "disabled");
        $("#showplot").attr("disabled", "disabled");
        $("#browse-fieldset").attr("disabled", "disabled");
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
    var init_browse_runs = function() {
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
    var fill_browse_runs = function() {
        if (!browse_exp_id)
            return;
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
        var tbl = $("#browse-runs-table");
        function select_all_first_time() {
            tbl.off('selected.rs.jquery.bootgrid')
               .off('deselected.rs.jquery.bootgrid')
               .off('loaded.rs.jquery.bootgrid', select_all_first_time)
               .bootgrid("select")
               .on('selected.rs.jquery.bootgrid', function() {
                    update_stats_columns();
                })
               .on('deselected.rs.jquery.bootgrid', function() {
                    update_stats_columns();
                });
        }
        tbl.bootgrid("clear")
           .bootgrid("append", rows)
           .on('loaded.rs.jquery.bootgrid', select_all_first_time);
    }

    //
    // set_run_order:
    //   Set the order in which runs will be displayed in
    //   runs tab and stats table columns
    //
    var set_run_order = function(exp_id) {
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
            if (index === undefined)
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
    // Browse stats section
    // -----------------------------------------------------------------

    //
    // Options for browse stats table and stats column information
    //
    var BrowseStatsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
    };
    var BrowseStatsColumns = [
        [ "unique_peptides", "Num Unique", "Unique", false, ],
        [ "peptide_count", "Peptide Count", "Count", true, ],
        [ "coverage", "% Cov", "Cov", false, ],
        [ "best_score", "Best Disc Score", "Score", false, ],
        [ "best_expected", "Best Expect Val", "Exp", false, ],
    ];

    //
    // init_browse_stats:
    //   Initialize stats user interface in "browse" tab
    //
    var init_browse_stats = function() {
        var columns = $("#browse-stats-columns");
        $.each(BrowseStatsColumns, function(index, column) {
            var checkbox = $("<input/>",
                             { "type": "checkbox",
                               "class": "browse-stats-cb",
                               "data-value": index,
                               "name": column[0] });
            checkbox.prop("checked", column[3]);
            var label = $("<label/>", { "for": column[0] }).text(column[1]);
            columns.append(checkbox, label);
        });
        $(".browse-stats-cb").click(function(ev) {
            var index = $(this).attr("data-value");
            var checked = $(this).prop("checked");
            BrowseStatsColumns[index][3] = checked;
            update_stats_columns();
        });
    }

    //
    // get_experiment_stats:
    //   Get experiment data from server
    //
    var get_experiment_stats = function(exp_id) {
        show_status("fetching experiment data...", true)
        $("#browse-fieldset").attr("disabled", "disabled");
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL,
            data: {
                action: "get_experiment",
                exp_id: exp_id,
            },
            success: function(data) {
                $("#browse-fieldset").removeAttr("disabled");
                show_status("", false)
                if (data.status != "success") {
                    show_error(data.status, data.reason, data.cause);
                } else {
                    var exp_id = data.results.experiment_id;
                    experiment_stats[exp_id] = JSON.parse(data.results.experiment_data);
                    fill_browse();
                }
            },
        });
    }

    //
    // show_experiment_stats:
    //   Display data for given experiment in browse tab
    //
    var show_experiment_stats = function(exp_id) {
        if (browse_raw_id == browse_exp_id)
            return;
        var table = $("#browse-stats-table");
        table.bootgrid("destroy").empty();
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-searchable": false,
                                "data-visible": false })
                        .text("Id"));
        htr.append($("<th/>", { "data-column-id": "protein" })
                        .text("Protein"));
        htr.append($("<th/>", { "data-column-id": "gene" })
                        .text("Gene"));
        var exp = experiment_metadata[exp_id];
        var run_order = exp.run_order;
        var run_label = exp.run_label;
        $.each(run_order, function(run_index, run_name) {
            var run_id = run_index + 1;
            $.each(BrowseStatsColumns, function(index, column) {
                var id = run_id + "-" + column[2];
                var label = run_label[run_name] + "<br/>" + column[2];
                htr.append($("<th/>", { "data-column-id": id,
                                        "data-type": "numeric",
                                        "data-visible": column[3],
                                        "data-searchable": false })
                                .text(label));
            });
        });

        var stats = experiment_stats[exp_id];
        var rows = [];
        $.each(stats.proteins, function(index, protein) {
            var row = { id: index };
            row.protein = protein["Acc #"] ? protein["Acc #"].toString() : "-";
            row.gene = protein["Gene"] ? protein["Gene"].toString() : "-";
            $.each(run_order, function(run_index, run_name) {
                var run_id = run_index + 1;
                var run_data = stats.runs[run_name].protein_stats[index];
                if (run_data)
                    $.each(BrowseStatsColumns, function(index, column) {
                        row[run_id + "-" + column[2]] = run_data[column[1]];
                    });
                else
                    $.each(BrowseStatsColumns, function(index, column) {
                        row[run_id + "-" + column[2]] = "-";
                    });
            });
            rows.push(row);
        });
        browse_raw_rows = rows;
        browse_raw_id = browse_exp_id;
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(BrowseStatsTableOptions)
             .bootgrid("append", rows);
    }

    //
    // update_stats_columns:
    //   Show or hide all the columns for a particular run
    //
    var update_stats_columns = function() {
        if (!browse_exp_id)
            return;
        var selected = $("#browse-runs-table").bootgrid("getSelectedRows");
        $("#browse-stats-table").bootgrid("destroy");
        // Need to lookup name again after bootgrid rearranges elements
        var table = $("#browse-stats-table");
        var run_order = experiment_metadata[browse_exp_id].run_order;
        $.each(run_order, function(run_index, run_name) {
            var run_id = run_index + 1;
            var show = selected.includes(run_id);
            $.each(BrowseStatsColumns, function(index, column) {
                var label = run_id + "-" + column[2];
                var th = table.find("th[data-column-id='" + label + "']");
                th.data("visible", (show ? column[3] : false));
            });
        });
        table.bootgrid(BrowseStatsTableOptions)
             .bootgrid("append", browse_raw_rows);
    }

    //
    // fill_browse_raw:
    //   Fill browse raw tab
    //
    var fill_browse_raw = function() {
        if (!browse_exp_id)
            return;
        if (!experiment_stats[browse_exp_id])
            get_experiment_stats(browse_exp_id);
        else
            show_experiment_stats(browse_exp_id);
    }

    //
    // fill_browse_summary:
    //   Fill browse summary tab
    //
    var fill_browse_summary = function() {
        if (!browse_exp_id)
            return;
        if (!experiment_stats[browse_exp_id]) {
            get_experiment_stats(browse_exp_id);
            return;
        }
        // TODO: more here
        console.log("show experiment stats summary")
    }

    //
    // fill_browse:
    //   Fill active browse experiment tab
    //
    var fill_browse = function() {
        if (!browse_exp_id)
            return;
        var active = $("#exp-stats-tabs nav a.active").attr("id");
        if (active == "tab-browse-summary")
            fill_browse_summary();
        else if (active == "tab-browse-raw")
            fill_browse_raw();
        else if (active == "tab-browse-runs")
            fill_browse_runs();
    }

    // -----------------------------------------------------------------
    // Code for various browse buttons
    // -----------------------------------------------------------------

    //
    // download_experiment:
    //   Download raw file for selected experiment
    //
    var download_experiment = function(ev) {
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
    // show_plot:
    //   Update modal plot parameters dialog with plot tabs
    //   suitable for currently selected experiment
    //
    var show_plot = function(ev) {
        // console.log("show_plot");
        var exp = experiment_metadata[browse_exp_id];
        // console.log(exp.exptype);
        // TODO: create UI for this type of experiment
    }

    //
    // make_plot:
    //   Generate new plot tab using currently selected parameters
    //
    var make_plot = function(ev) {
        var basename = "xyzzy";
        var plot_link_name = "tab_plot_" + basename;
        var plot_panel_name = "panel-plot-" + basename;
        var plot_panel = $("<div/>", { "class":"tab-pane fade",
                                       "id": plot_panel_name,
                                       "role": "tabpanel",
                                       "aria-labelledby": plot_link_name });
        var plot_content = $("<div/>");
        plot_panel.append(plot_content);
        $("#frontpage > div.tab-content").append(plot_panel);
        var plot_link = $("<a/>", { "class": "nav-item nav-link",
                                    "id": plot_link_name,
                                    "href": "#" + plot_panel_name,
                                    "data-toggle": "tab",
                                    "role": "tab",
                                    "aria-controls": plot_panel_name,
                                    "aria-selected": false }).text(basename);
        $("#frontpage > nav div").append(plot_link);
        plot_link.tab("show");
        plot_close = $("<button/>", { "class": "close",
                                      "aria-label": "Close" })
                            .append($("<span/>", { "aria-hidden": "true" })
                                        .html("&times;"))
                            .click(function(ev) {
                                console.log("close " + basename)
                                plot_link.remove();
                                plot_panel.remove();
                                $("#frontpage > nav .nav-link:first-child")
                                    .tab("show");
                            });
        plot_content.append(plot_close);
        var plotly_div_name = "plotly-" + basename;
        var plotly_div = $("<div/>", { "id": plotly_div_name,
                                       "css": { "width": "600px",
                                                "height": "250px" } });
        plot_content.append(plotly_div);
        var raw_div = plotly_div.get(0);
        var metadata = experiment_metadata[browse_exp_id];
        var stats = experiment_stats[browse_exp_id];
        // console.log(metadata.exptype);
        // TODO: create plot for this type of experiment
        // make_plot_placeholder(raw_div, plotly_div_name, metadata, stats);
        make_plot_violin(raw_div, plotly_div_name, metadata, stats);
    }

    //
    // make_plot_placeholder:
    //   Only used during development to show generic plot
    //   "div" argument must be a Javascript element, not a jQuery object
    //
    var make_plot_placeholder = function(div, div_name, metadata, stats) {
        Plotly.plot(div, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16] }], {
            margin: { t: 0 } });
    }

    //
    // make_plot_violin:
    //   Create violin plot for abundance experiment.
    //   y = abundance
    //   trace = category name
    //
    var make_plot_violin = function(div, div_name, metadata, stats) {
        normalize_counts(metadata, stats);
        var traces = [];
        Object.keys(stats.category_counts).sort().forEach(function(cat_name) {
            y = [];
            text = [];
            $.each(stats.category_counts[cat_name], function(pid, counts) {
                var protein = stats.proteins[pid];
                var label = protein["Acc #"];
                var gene = protein["Gene"];
                if (gene)
                    label += " (" + gene + ")";
                var sum = counts.reduce(function(a, b) { return a + b; });
                var avg = sum / counts.length;
                y.push(avg);
                text.push(label);
            });
            traces.push({
                legendgroup: cat_name,
                name: cat_name,
                scalegroup: "Yes",
                x0: cat_name,
                type: "violin",
                y: y,
                text: text,
            });
        });
        var layout = {
            showLegend: true,
            legend: { x:1, y:0.5 },
            hovermode: "closest",
            xaxis: { title: "", automargin: true },
            yaxis: { title: "Abundance", automargin: true },
            title: metadata.title,
            violinmode: "overlay",
            violingap: 0,
            violingroupgap: 0,
        };
        Plotly.newPlot(div_name, traces, layout);
        var d3 = Plotly.d3;
        var gd3 = d3.select("#" + div_name)
                    .style({ "width": "94%",
                             "margin-left": "3%",
                             "height": "95vh",
                             "margin-top": "2.5vh", });
        var gd = gd3.node();
        Plotly.Plots.resize(gd);
        window.onresize = function() { Plotly.Plots.resize(gd); }
    }

    //
    // normalize_counts:
    //   Compute normalized peptide counts for run categories
    //
    var normalize_counts = function(metadata, stats) {
        // Create run-category map
        var run2category = {};
        $.each(metadata.runs, function(run_name, run_md) {
            run2category[run_name] = run_md.category;
        });
        // Compute count totals and find normalizing scale factor
        var run_total = {};
        $.each(stats.runs, function(run_name, run) {
            var total = 0;
            $.each(run.protein_stats, function(protein_id, values) {
                var count = values["Peptide Count"];
                total += count;
            });
            run_total[run_name] = total;
        });
        var max_count = Math.max.apply(null, Object.values(run_total));
        // Collect normalized counts for each protein in each category
        var cat_counts = {};
        $.each(stats.runs, function(run_name, run) {
            var scale = run_total[run_name] / max_count;
            var category = cat_counts[run2category[run_name]];
            if (category === undefined)
                category = cat_counts[run2category[run_name]] = {}
            $.each(run.protein_stats, function(protein_id, values) {
                var norm_count = values["Peptide Count"] * scale;
                counts = category[protein_id];
                if (counts === undefined)
                    category[protein_id] = [ norm_count ];
                else
                    counts.push(norm_count);
            });
        });
        stats.category_counts = cat_counts;
        console.log(cat_counts);
    }

    //
    // cancel_plot:
    //   No-op for now
    //
    var cancel_plot = function(ev) {
        // console.log("cancel_plot");
    }

    // =================================================================
    // Edit tab functions
    // =================================================================

    //
    // init_tab_edit:
    //   Initialize all sections of the "edit" tab
    //
    var init_tab_edit = function() {
        // Setup upload file elements
        $("#upload-drop").on("dragover", stop_default)
                         .on("dragenter", stop_default)
                         .on("drop", file_dropped);
        $("#upload-file").change(file_selected);
        $("#upload-button").click(upload_file).attr("disabled", "disabled");

        // Show experiments
        init_edit_experiments();
        init_controlled_vocabulary();
        init_metadata_form();
        init_runs_form();

        // Reset tab callback
        tab_funcs.tab_edit = show_tab_edit;
        show_tab_edit();
    }

    //
    // show_tab_edit:
    //   Display "edit" tab.  Currently does nothing,
    //   but may (in the future), refresh the list of experiments.
    //
    var show_tab_edit = function() {
        fill_edit_experiments(experiment_metadata);
    }

    // --------------------------------------------------------------------
    // Edit upload section
    // --------------------------------------------------------------------

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

    //
    // Last file selected
    //
    var selected_file;

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
                    reload_experiments_tables();
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

    // --------------------------------------------------------------------
    // Edit controlled vocabulary section
    // --------------------------------------------------------------------

    var controlled_vocabulary;
    var cv_exptypes = [ "exptype-vocab" ];

    // 
    // init_controlled_vocabulary:
    //   Initialize controlled vocabulary elements
    //
    var init_controlled_vocabulary = function() {
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
        fill_dropdown(root, "exptype-vocab",
                      controlled_vocabulary.experiment_types);
        $.each(cv_exptypes, function(index, eid) {
            fill_selector(root, eid, controlled_vocabulary.experiment_types);
        });
        experiment_type_changed();
    }

    var fill_dropdown = function(root, eid, list) {
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

    var fill_selector = function(root, eid, values) {
        var select = root.find("#" + eid);
        select.empty();
        select.append($("<option/>", { "value": ""}));
        $.each(values, function(index, val) {
            select.append($("<option/>", { "value": val }).text(val));
        });
    }

    //
    // vocab_changed:
    //   Update button status when vocabulary input field changes
    //
    var vocab_changed = function(v, vid, values) {
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
    var add_editable_vocab = function(input_id, name) {
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
    var add_exptype_vocab = function(input_id) {
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
    var experiment_type_changed = function() {
        if (controlled_vocabulary)
            vocab_changed($("#exptype-vocab").val(), "experiment-type",
                          controlled_vocabulary.experiment_types);
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

    // --------------------------------------------------------------------
    // Edit experiment and runs section
    // --------------------------------------------------------------------

    var EditExperimentsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: false,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
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
    var init_edit_experiments = function() {
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
                tbl.find(".exp-delete").on("click", function(ev) {
                    stop_default(ev);
                    var exp_id = ev.target.dataset.rowId
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
    var fill_edit_experiments = function(results) {
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
    var edit_experiment_selected = function(ev, rows) {
        $("#edit-metadata-fieldset").removeAttr("disabled");
        $(".edit-metadata").removeClass("disabled")
        edit_exp_id = rows[0].id;
        show_metadata(edit_exp_id);
    }

    //
    // edit_experiment_deselected:
    //   Event callback when user deselects row in uploads table or
    //   selects a different row
    //
    var edit_experiment_deselected = function(ev, rows) {
        $("#edit-metadata-fieldset").attr("disabled", "disabled");
        $(".edit-metadata").addClass("disabled")
        edit_exp_id = undefined;
        // XXX: hide metadata?
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
        var div = $("#edit-metadata-exp");
        $.each(data.results, function(index, val) {
            var input_type = val[1];
            var input_id = val[2];
            var label = $("<label/>", { "class": "col-sm-2 col-form-label",
                                        "for": input_id }).text(val[0]);
            var input;
            if (input_type == "exptype") {
                container = input = add_exptype_vocab(input_id);
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
            container.attr("class", "col-sm-10");
            div.append($("<div/>", { "class": "form-group row" })
                        .append(label, container));
        });
        metadata_fields = data.results;
    }

    //
    // show_metadata:
    //   Display experiment attribute values in metadata form
    //
    var show_metadata = function(exp_id) {
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
    var update_metadata = function(ev) {
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
                    show_error(data.status, data.reason, data.cause);
                else
                    reload_experiments_tables();
            },
        });
    }

    //
    // revert_metadata:
    //   Revert metadata values to unchanged values
    //
    var revert_metadata = function() {
        show_metadata(edit_exp_id);
    }

    // -----------------------------------------------------------------
    // Edit runs metadata section
    // -----------------------------------------------------------------

    var cv_runcats = [];

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
    var fill_edit_runs = function(exp_id) {
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
    var add_runcat_vocab = function(input_id) {
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
    var fill_run_category_vocabulary = function(exp_id, categories) {
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
    var run_category_vocab_server = function(action, exp_id, value) {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: BaseURL + "/cgi-bin/upload.py",
            data: {
                action: action,
                exp_id: exp_id,
                run_cat: value,
            },
            success: function(data) {
                if (data.status != "success")
                    show_error(data.status, data.reason, data.cause);
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
    var add_run_category = function() {
        run_category_vocab_server("add_run_category", edit_exp_id,
                                  $("#runcat-vocab").val());
    }

    //
    // remove_run_category:
    //   Upload a new run category to server
    //
    var remove_run_category = function() {
        run_category_vocab_server("remove_run_category", edit_exp_id,
                                  $("#runcat-vocab").val());
    }

    //
    // run_category_changed:
    //   Event callback when user changes value of category input field
    //
    var run_category_changed = function(ev) {
        vocab_changed($("#runcat-vocab").val(), "run-category",
                      experiment_metadata[edit_exp_id].run_categories);
    }

    // =================================================================
    // Analyze tab functions
    // =================================================================

    var show_tab_analyze = function() {
        console.log("show_tab_analyze");
    }

    // =================================================================
    // Main page functions
    // =================================================================

    var tab_funcs = {
        "tab-browse": init_tab_browse,
        "tab-browse-summary": fill_browse_summary,
        "tab-browse-raw": fill_browse_raw,
        "tab-browse-runs": fill_browse_runs,
        "tab-edit": init_tab_edit,
        "tab-analyze": show_tab_analyze,
    };
    var experiment_metadata = {}      // All experiment metadata
    var experiment_stats = {}         // Fetched experiment stats

    //
    // init_main:
    //   Initialize front page
    //
    var init_main = function() {
        get_themes();
        $("#frontpage").on("shown.bs.tab", function(e) {
            var func = tab_funcs[e.target["id"]];
            if (func)
                func();
        });
        /*
        var active = $("#frontpage .nav a.active").attr("id");
        tab_funcs[active]();
        */
        if (window.location.href.indexOf("upload") >= 0) {
            // Make the edit/upload tab active
            $("#tab-edit").tab("show");
        } else {
            // Blow away the edit/upload tabs and make browse tab active
            $("#tab-edit").remove();
            $("#edit-tab").remove();
            $("#tab-browse").tab("show");
        }
        reload_experiments_tables();
    };

    //
    // get_themes:
    //   Fetch list of Bootstrap themes from cdnjs
    //
    var get_themes = function() {
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
                        var link = $("<link/>", { "rel": "stylesheet",
                                                  "type": "text/css",
                                                  "href": url });
                        $("head").append(link);
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
    var reload_experiments_tables = function() {
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

    //
    // show_status:
    //   Display status at status box at top of page
    //
    var show_status = function(msg, busy) {
        $("#top-status-box").text(msg);
        $("body").css("cursor", busy ? "progress" : "default");
    }

    return {
        init: function() {
            init_main();
            console.log("MSWeb initialization complete");
        },
    };
})();

$(window).on("load", frontpage.init);
