// vim: set expandtab shiftwidth=4 softtabstop=4:

abundance = (function(){

    //
    // Options for raw stats table and stats column information
    //
    var BrowseStatsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [10, 20, 50, 100, -1],
    };
    var AbundanceColumns = [
        [ "Rank", false ],
        [ "Gene", true ],
        [ "Protein Name", true ],
        [ "Acc #", true ],
        [ "Protein MW", false ],
        [ "Species", true ],
        [ "Uniq Pep", false ],
        [ "Num Unique", false ],
        [ "% Cov", true ],
        [ "Best Expect Val", true ],
        [ "Count Total", false ]
    ];

    var serial = 0;
    var normalization_methods;

    function init() {
        $.ajax({
            dataType: "json",
            method: "POST",
            url: frontpage.url,
            data: {
                action: "normalization_methods",
                exptype: "abundance",
            },
            success: function(data) {
                if (data.status != "success")
                    frontpage.show_ajax_error(data.status, data.reason,
                                              data.cause);
                else
                    normalization_methods = data.results.methods;
            },
            error: function(xhr, status, error) {
                alert("Fetching normalization methods failed.");
                frontpage.show_status(error);
            },
        });
    }

    class AbundanceTab {

        constructor(container, exp_id, metadata, stats) {
            this.tab_container = container;
            this.exp_id = exp_id;
            this.metadata = metadata;
            // Fix up metadata run_categories so that it contains only
            // categories that are in use
            var runs = metadata.runs;
            var used_categories = {};
            for (var run in runs)
                used_categories[runs[run].category] = 1;
            metadata.run_categories = Object.keys(used_categories).sort();
            this.stats = stats;
            this.volcano = 0;
            this.initialize();
            this.tab.tab("show");
        }

        initialize() {
            serial += 1;
            this.serial = serial;
            var tab_id = "tab-abundance-" + serial;
            var pane_id = "abundance-tab-" + serial;
            var close_id = "abundance-close-" + serial;

            // Create pane
            var pane = $("<div/>", { "class": "tab-pane fade",
                                     "id": pane_id,
                                     "role": "tabpanel",
                                     "aria-labelledby": tab_id })
                            .appendTo(this.tab_container.children(".tab-content"));
            var container = $("<div/>", { "class": "container-fluid" }).appendTo(pane);
            this.card_container = container;
            this.make_title(container);
            this.make_operations(container);
            this.disable(".need-normalized", true);
            this.disable(".need-differential", true);
            this.disable(".need-TODO", true);

            // Create tab
            var tab = $("<a/>", { "class": "nav-item nav-link",
                                  "id": tab_id,
                                  "data-toggle": "tab",
                                  "href": "#" + pane_id,
                                  "role": "tab",
                                  "aria-controls": pane_id,
                                  "aria-selected": "false" })
                            .append($("<span/>").text("Analyze: " + this.metadata.title))
                            .append($("<span/>", { "id": close_id,
                                                   "class": "tab-close-button"})
                                            .html("&times;")
                                        .click(ev => this.close_tab(ev)))
                            .appendTo(this.tab_container.children("nav")
                                                        .find(".nav-tabs"));

            // Save references
            this.tab = tab;
            this.pane = pane;
            this.normalized_counts_table_id = undefined;
            this.differential_table_id = undefined;
        }

        make_title(container) {
            $("<h1/>").text(this.metadata.title).appendTo(container);
        }

        make_operations(container) {
            var ops = $("<div/>", { "class": "row op-row" }).appendTo(container);
            var ops_a = $("<div/>", { "class": "col-6" }).appendTo(ops);
            this.make_ops_text(ops_a, "op-normalize", "Normalize",
                               "", this.op_normalize);
            this.make_ops_text(ops_a, "op-diff", "Differential Abundance",
                               "need-normalized", this.op_differential);
            this.make_ops_text(ops_a, "op-enrich", "Enrichment",
                               "need-TODO", this.op_enrichment);
            var ops_p = $("<div/>", { "class": "col-6" }).appendTo(ops);
            this.make_ops_image(ops_p, "plot-violin", "violin.png",
                                "Violin", "need-normalized",
                                this.plot_violin);
            this.make_ops_image(ops_p, "plot-heatmap", "heatmap.svg",
                                "Heat Map", "need-differential",
                                this.plot_heatmap);
            this.make_ops_image(ops_p, "plot-volcano", "volcano.svg",
                                "Volcano", "need-differential",
                                this.plot_volcano);
            this.make_ops_image(ops_p, "plot-string", "string.png",
                                "STRING", "need-TODO",
                                this.plot_string);
        }

        make_ops_text(parent, id, name, classes, method) {
            var klass = "btn btn-outline-secondary op-button " + classes
            $("<button/>", { "type": "button", "class": klass, "id":id })
                .text(name)
                .click(method.bind(this))
                .appendTo(parent);
        }

        make_ops_image(parent, id, icon_file, name, classes, method) {
            var klass = "btn btn-outline-primary op-button " + classes
            var button = $("<button/>", { "type": "button",
                                          "class": klass,
                                          "id": id });
            $("<img/>", { "class": "op-icon",
                          "src": "icons/" + icon_file }).appendTo(button);
            button.append($("<br/>"))
                  .append($("<span/>").text(name))
                  .click(method.bind(this))
                  .appendTo(parent);
        }

        make_collapsible_card(container, name, title) {
            var card_id = this.make_id(name, "card");
            var body_id = this.make_id(name, "body");
            var card = $("<div/>", { "class": "card",
                                     "id": card_id });
            var header = $("<div/>", { "class": "card-header" }).appendTo(card);
            $("<button/>", { "class": "btn btn-link",
                             "data-toggle": "collapse",
                             "data-target": "#" + body_id,
                             "aria-expanded": "true",
                             "aria-controls": body_id })
                    .append($("<span/>", { "class": "fa" }))
                    .append($("<span/>").text(title))
                    .appendTo(header);
            $("<div/>", { "class": "card-body collapse show",
                          "id": body_id }).appendTo(card);
            var first_card = container.find("> .card:first");
            if (first_card.length == 0)
                card.appendTo(container);
            else
                card.insertBefore(first_card);
            return card;
        }

        add_card_buttons(card, buttons) {
            var header = card.find(".card-header");
            var div = $("<div/>", { "class": "float-right btn" })
                            .css("font-size", "large")
                            .appendTo(header);
            $.each(buttons, function(index, v) {
                var klasses = ["fa", v[0]].join(' ');
                var span = $("<span/>", { "class": klasses })
                                .click(v[1])
                                .appendTo(div);
            });
        }

        add_field(form, target_id, label) {
            var row = $("<div/>", { "class": "form-group form-row" })
                        .appendTo(form);
            $("<label/>", { "for": target_id,
                            "class": "col-4 col-form-label" })
                        .text(label).appendTo(row);
            var div = $("<div/>", { "class": "col-8" }).appendTo(row);
            return div;
        }

        add_select(div, sid, options) {
            var sel = $("<select/>", { "id": sid,
                                       "class": "form-control" }).appendTo(div);
            $.each(options, function(index, name) {
                $("<option/>", { "value": name }).text(name).appendTo(sel);
            });
            sel.val(options[0]);
            return sel;
        }

        add_multi_select(div, msid, options) {
            var ms = $("<select/>", { "id": msid,
                                      "class": "form-control selectpicker",
                                      "multiple": "multiple" }).appendTo(div);
            ms.selectpicker();
            $.each(options, function(index, name) {
                $("<option/>", { "value": name,
                                 "selected": "selected" }).text(name).appendTo(ms);
            });
            ms.selectpicker("refresh");
            return ms;
        }

        add_float_input(div, input_id, default_value, step) {
            var input = $("<input/>",  { "id": input_id,
                                         "class": "form-control",
                                         "type": "number",
                                         "min": 0.0,
                                         "step": step })
                            .val(default_value).appendTo(div);
            return input;
        }

        add_int_input(div, input_id, default_value, step) {
            var input = $("<input/>",  { "id": input_id,
                                         "class": "form-control",
                                         "type": "number",
                                         "min": 4,
                                         "step": step })
                            .val(default_value).appendTo(div);
            return input;
        }

        make_id(name, subtype) {
            return "abundance-" + name + "-" + subtype + "-" + this.serial;
        }

        disable(klass, disabled) {
            if (disabled)
                this.card_container.find(klass)
                                   .addClass("disabled")
                                   .attr("disabled", "disabled");
            else
                this.card_container.find(klass)
                                   .removeClass("disabled")
                                   .removeAttr("disabled");
        }

        close_tab(ev) {
            ev.stopPropagation();
            var prev = this.tab.prev();
            this.tab.remove();
            this.pane.remove();
            prev.tab("show");
        }

        op_normalize(ev, a, b) {
            function do_norm(method) {
                // console.log("normalize using " + sel.val());
                frontpage.show_status("normalizing counts...", true)
                $.ajax({
                    dataType: "json",
                    method: "POST",
                    url: frontpage.url,
                    data: {
                        action: "normalize",
                        exp_id: this.exp_id,
                        method: method,
                    },
                    success: function(data) {
                        frontpage.show_status("", false)
                        if (data.status != "success")
                            frontpage.show_ajax_error(data.status, data.reason,
                                                      data.cause);
                        else {
                            this.stats.norm_params = data.results.params;
                            this.stats.norm_stats = data.results.stats;
                            this.make_normalized_counts(this.card_container);
                            this.disable(".need-normalized", false);
                        }
                    }.bind(this),
                    error: function(xhr, status, error) {
                        alert("Fetching normalized counts failed.");
                        show_status(error);
                    },
                });
            }
            if (normalization_methods.length == 1)
                do_norm.call(this, normalization_methods[0]);
            else {
                var dialog = $("#modal-dialog");
                dialog.find(".modal-title").text("Normalize Counts");
                var body = dialog.find(".modal-body").empty();
                var sid = this.make_id("normalize", "select")
                var field = this.add_field(body, sid, "Method");
                var sel = this.add_select(field, sid, normalization_methods);
                var okay = dialog.find(".modal-okay-button");
                okay.off("click").on("click", function(ev) {
                    do_norm.call(this, sel.val());
                }.bind(this));
                dialog.modal();
            }
        }

        op_differential(ev, a, b) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("Differential Abundance");
            var cat_names = this.metadata.run_categories;
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var cat_id = this.make_id("differential", "cat");
            var cat_field = this.add_field(form, cat_id, "Categories");
            var categories = this.add_multi_select(cat_field, cat_id, cat_names);
            var control_id = this.make_id("differential", "control");
            var control_field = this.add_field(form, control_id, "Control");
            var control = this.add_select(control_field, control_id, cat_names);
            $.each(cat_names, function(index, name) {
                if (name.toLowerCase() == "control")
                    control.val(name);
            });
            var fc_id = this.make_id("differential", "fc");
            var fc_field = this.add_field(form, fc_id, "Fold Change Cutoff");
            var fc_cutoff = this.add_float_input(fc_field, fc_id, 1.0, 0.5);
            var mean_id = this.make_id("differential", "mean");
            var mean_field = this.add_field(form, mean_id, "Mean Cutoff");
            var mean_cutoff = this.add_float_input(mean_field, mean_id, 0.0, 0.5);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click");
            okay.on("click", function(ev) {
                frontpage.show_status("computing differential abundance...", true)
                var data = {
                    action: "differential_abundance",
                    exp_id: this.exp_id,
                    method: "default",
                    categories: categories.selectpicker("val"),
                    control: control.val(),
                    fc_cutoff: fc_cutoff.val(),
                    mean_cutoff: mean_cutoff.val(),
                }
                for (var nc_prop in this.stats.norm_params)
                    data["nc_" + nc_prop] = this.stats.norm_params[nc_prop];
                $.ajax({
                    dataType: "json",
                    method: "POST",
                    traditional: true,
                    url: frontpage.url,
                    data: data,
                    success: function(data) {
                        frontpage.show_status("", false)
                        if (data.status != "success")
                            frontpage.show_ajax_error(data.status, data.reason,
                                                      data.cause);
                        else {
                            this.stats.da_params = data.results.params;
                            this.stats.da_stats = data.results.stats;
                            this.make_differential(this.card_container);
                            this.disable(".need-differential", false);
                        }
                    }.bind(this),
                    error: function(xhr, status, error) {
                        alert("Fetching differential abundance failed.");
                        frontpage.show_status(error);
                    },
                });
            }.bind(this));
            dialog.modal();
        }

        op_enrichment(ev) {
            this.unimplemented("Enrichment");
        }

        op_string(ev) {
            this.unimplemented("STRING");
        }

        plot_violin(ev) {
            if (!this.stats.da_stats)
                this.plot_violin_norm();
            else {
                var dialog = $("#modal-dialog");
                dialog.find(".modal-title").text("Violin Plot");
                var body = dialog.find(".modal-body").empty();
                var sid = this.make_id("violin-plot", "select")
                var field = this.add_field(body, sid, "Data");
                var sel = this.add_select(field, sid, [ "Differential Abundance",
                                                        "Normalized Counts" ]);
                var okay = dialog.find(".modal-okay-button");
                okay.off("click").on("click", function(ev) {
                    var data = sel.val();
                    if (data == "Differential Abundance")
                        this.plot_violin_da();
                    else if (data == "Normalized Counts")
                        this.plot_violin_norm();
                    else
                        alert("Unknown violin plot type: " + data);
                }.bind(this));
                dialog.modal();
            }
        }

        plot_violin_norm() {
            var container = this.pane.children(".container-fluid");
            var card = this.make_collapsible_card(container, "violin",
                                                  "Violin Plot - Normalized Counts");
            var body = card.find(".card-body");
            var plot_id = this.make_id("violin", "plot");
            var div = $("<div/>", { "id": plot_id,
                                    "css": { "resize": "vertical",
                                             "overflow": "hidden",
                                             "width": "600px",
                                             "height": "250px" } })
                            .appendTo(body);
            plot.make_plot_violin_norm(div, this.metadata, this.stats);
            var pop_out = function() {
                plot.pop_out(div, this.metadata.title + " - Normalized Counts")
            }.bind(this);
            var close_card = function() {
                card.remove();
            }.bind(this);
            this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ],
                                          [ "fa-times-circle", close_card ] ]);
        }

        plot_violin_da() {
            var container = this.pane.children(".container-fluid");
            var card = this.make_collapsible_card(container, "violin",
                                                  "Violin Plot - Differential Abundance");
            var body = card.find(".card-body");
            var plot_id = this.make_id("violin", "plot");
            var div = $("<div/>", { "id": plot_id,
                                    "css": { "resize": "vertical",
                                             "overflow": "hidden",
                                             "width": "600px",
                                             "height": "250px" } })
                            .appendTo(body);
            plot.make_plot_violin_da(div, this.metadata, this.stats);
            var pop_out = function() {
                plot.pop_out(div, this.metadata.title + " - Differential Abundance")
            }.bind(this);
            var close_card = function() {
                card.remove();
            }.bind(this);
            this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ],
                                          [ "fa-times-circle", close_card ] ]);
        }

        plot_heatmap(ev) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("Heatmap");
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var topn_id = this.make_id("heatmap", "topn");
            var topn_field = this.add_field(form, topn_id, "Show Top N");
            var topn_cutoff = this.add_int_input(topn_field, topn_id, 10, 1);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click");
            okay.on("click", function(ev) {
                var container = this.pane.children(".container-fluid");
                var card = this.make_collapsible_card(container, "heatmap",
                                                      "Heat Map - Differential Abundance");
                var body = card.find(".card-body");
                var plot_id = this.make_id("heatmap", "plot");
                var div = $("<div/>", { "id": plot_id,
                                        "css": { "resize": "vertical",
                                                 "overflow": "hidden",
                                                 "width": "600px",
                                                 "height": "500px" } })
                                .appendTo(body);
                plot.make_plot_heatmap_da(div, this.metadata, this.stats, topn_cutoff.val());
                var pop_out = function() {
                    plot.pop_out(div, this.metadata.title + " - Differential Abundance")
                }.bind(this);
                var close_card = function() {
                    card.remove();
                }.bind(this);
                this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ],
                                              [ "fa-times-circle", close_card ] ]);
            }.bind(this));
            dialog.modal();
        }

        plot_volcano(ev) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("Volcano Plot");
            var control = this.stats.da_params.control;
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var da_stats = this.stats.da_stats;
            var cat_names = this.metadata.run_categories.filter(function(cat) {
                return (da_stats[cat + " pValue"] !== undefined &&
                        da_stats[cat + " log2FC"] !== undefined);
            });
            var cat_id = this.make_id("volcano", "cat");
            var cat_field = this.add_field(form, cat_id, "Category");
            var cat = this.add_select(cat_field, cat_id, cat_names);
            var pvalue_id = this.make_id("volcano", "pvalue");
            var pvalue_field = this.add_field(form, pvalue_id, "p-Value threshold");
            var pvalue = this.add_float_input(pvalue_field, pvalue_id, 0.05, 0.05);
            var fc_id = this.make_id("volcano", "fc");
            var fc_field = this.add_field(form, fc_id, "Fold change threshold");
            var fc = this.add_float_input(fc_field, fc_id, 2.0, 0.5);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click");
            okay.on("click", function(ev) {
                var container = this.pane.children(".container-fluid");
                var title = "Volcano Plot (" + cat.val() + " vs. " + control + ")";
                var card = this.make_collapsible_card(container, "volcano", title);
                var body = card.find(".card-body");
                this.volcano += 1;
                var plot_id = this.make_id("volcano", "plot" + this.volcano);
                var div = $("<div/>", { "id": plot_id,
                                        "css": { "resize": "vertical",
                                                 "overflow": "hidden",
                                                 "width": "600px",
                                                 "height": "250px" } })
                                .appendTo(body);
                if (plot.make_plot_volcano(div, this.metadata, this.stats,
                                           cat.val(), pvalue.val(), fc.val())) {
                    var pop_out = function() {
                        plot.pop_out(div, this.metadata.title + " - " + title)
                    }.bind(this);
                    var close_card = function() {
                        card.remove();
                    }.bind(this);
                    this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ],
                                                  [ "fa-times-circle", close_card ] ]);
                } else {
                    card.remove();
                }
            }.bind(this));
            dialog.modal();
        }

        plot_string(ev) {
            this.unimplemented("STRING plot");
        }

        unimplemented(name) {
            alert(name + " has not been implemented yet.");
        }

        make_normalized_counts(container) {
            if (this.normalized_counts_table_id === undefined) {
                var title = "Normalized Counts (method: " + this.stats.norm_params.method + ")";
                var card = this.make_collapsible_card(container, "nc", title);
                var body = card.find(".card-body");
                var div = $("<div/>", { "class": "table-responsive" })
                            .appendTo(body);
                var table_id = this.make_id("nc", "table");
                $("<table/>", { "class": "table table-condensed table-hover table-striped",
                                "id": table_id }).appendTo(div);
                var close_card = function() {
                    card.remove();
                    this.normalized_counts_table_id = undefined;
                }.bind(this);
                this.add_card_buttons(card, [ [ "fa-times-circle", close_card ] ]);
                this.normalized_counts_table_id = table_id;
            }
            show_normalized_counts_table(this.normalized_counts_table_id, this.metadata, this.stats);
            // body.collapse("hide");
        }

        make_differential(container) {
            if (this.differential_table_id === undefined) {
                var title = "Differential Abundance (reference: " +
                            this.stats.da_params.control + ")";
                var card = this.make_collapsible_card(container, "da", title);
                var body = card.find(".card-body");
                var div = $("<div/>", { "class": "table-responsive" })
                            .appendTo(body);
                var table_id = this.make_id("da", "table");
                $("<table/>", { "class": "table table-condensed table-hover table-striped",
                                "id": table_id }).appendTo(div);
                var close_card = function() {
                    card.remove();
                    this.differential_table_id = undefined;
                }.bind(this);
                this.add_card_buttons(card, [ [ "fa-times-circle", close_card ] ]);
                this.differential_table_id = table_id;
            }
            show_differential_abundance_table(this.differential_table_id, this.metadata, this.stats);
            // body.collapse("hide");
        }

    };

    function create_tab(container, exp_id, metadata, stats) {
        return new AbundanceTab(container, exp_id, metadata, stats);
    }

    var NormalizedCountsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        formatters: {
            floats: function(column, row) {
                var mean = row[column.id];
                if (mean === null)
                    return "-";
                else {
                    var sd = row[column.id + "_sd"];
                    if (sd === null)
                        return mean.toFixed(2)
                    else
                        return mean.toFixed(2) + " &plusmn; " + sd.toFixed(2);
                    // console.log(mean + '+' + sd);
                }
            }
        },
    };

    //
    // show_normalized_counts_table:
    //   Display normalized counts for given experiment.
    //
    function show_normalized_counts_table(table_id, metadata, stats) {
        var selector = "#" + table_id;
        $(selector).bootgrid("destroy");
        var table = $(selector).empty();
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-converter": "numeric",
                                "data-searchable": false,
                                "data-visible": false })
                        .text("Id"));
        htr.append($("<th/>", { "data-column-id": "protein" })
                        .text("Protein"));
        htr.append($("<th/>", { "data-column-id": "gene" })
                        .text("Gene"));
        var raw = stats.raw;
        var norm = stats.norm_stats;
        var cat_order = metadata.run_categories;
        $.each(cat_order, function(cat_index, cat_name) {
            var id = "nc-" + cat_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "floats",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text(cat_name));
        });

        var rows = [];
        var accs = raw.proteins["Acc #"];
        var genes = raw.proteins["Gene"];
        for (var pid = 0; pid < accs.length; pid++) {
            var row = { id: pid };
            row["protein"] = accs[pid] ? accs[pid].toString() : "-";
            row["gene"] = genes[pid] ? genes[pid].toString() : "-";
            $.each(cat_order, function(cat_index, cat_name) {
                // Matches loop above
                var column_id = "nc-" + cat_name;
                row[column_id] = norm[cat_name + " Mean"][pid];
                row[column_id + "_sd"] = norm[cat_name + " SD"][pid];
            });
            rows.push(row);
        }
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(NormalizedCountsTableOptions)
             .bootgrid("append", rows);
    }

    var DifferentialAbundanceTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        formatters: {
            nullmeric: function(column, row) {
                var v = row[column.id];
                return isFinite(v) ? v.toFixed(6) : "-" },
        },
    };

    //
    // show_differential_abundance_table:
    //   Display differential abundance for given experiment.
    //
    function show_differential_abundance_table(table_id, metadata, stats) {
        var selector = "#" + table_id;
        $(selector).bootgrid("destroy");
        var table = $(selector).empty();
        var htr = $("<tr/>");
        var da_stats = stats.da_stats;
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
        for (var col_name in da_stats) {
            if (col_name == "Rows")
                continue
            var id = "nc-" + col_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "nullmeric",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text(col_name));
        }

        var rows = [];
        var accs = stats.raw.proteins["Acc #"];
        var genes = stats.raw.proteins["Gene"];
        for (var pid = 0; pid < accs.length; pid++) {
            var row = { id: pid };
            row["protein"] = accs[pid] ? accs[pid].toString() : "-";
            row["gene"] = genes[pid] ? genes[pid].toString() : "-";
            for (var col_name in da_stats) {
                // Matches loop above
                if (col_name == "Rows")
                    continue;
                var value = da_stats[col_name][pid];
                var column_id = "nc-" + col_name;
                if (value === null)
                    row[column_id] = Infinity;
                else
                    row[column_id] = value;
            }
            rows.push(row);
        }
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(DifferentialAbundanceTableOptions)
             .bootgrid("append", rows);
    }

    //
    // download_csv:
    //   Download raw table data
    //
    function download_csv(only_selected, md, stats, table) {
        function quote(s) {
            return /[,"]/.test(s) ?  '"' + s.replace(/"/g, '""') + '"' : s;
        }
        var proteins = stats.raw.proteins;
        var headers = [];
        var columns = []
        for (var ci = 0; ci < AbundanceColumns.length; ci++) {
            var column = AbundanceColumns[ci];
            columns.push(proteins[column[0]]);
            headers.push(quote(column[0]));
        }
        for (var ci = 0; ci < md.run_order.length; ci++) {
            var run_name = md.run_order[ci];
            columns.push(proteins[run_name + " Count"]);
            headers.push(quote(run_name));
        }
        var lines = [ headers.join(',') + '\n' ];
        var which_rows;
        if (!only_selected || table === null)
            which_rows = Array(proteins["Acc #"].length).keys();
        else {
            which_rows = table.bootgrid("getSelectedRows");
            if (which_rows.length == 0) {
                alert("No rows have been selected");
                return;
            }
        }
        var rows = [];
        for (var ri of which_rows) {
            var fields = [];
            for (var ci = 0; ci < columns.length; ci++)
                fields.push(quote(columns[ci][ri]));
            rows.push(fields);
        }
        for (var i = 0; i < rows.length; i++)
            lines.push(rows[i].join(',') + '\n');
        var blob = new Blob(lines, {type:"text/csv"})
        var filename = md.datafile;
        if (filename.endsWith(".xlsx") || filename.endswith(".xls"))
            // Remove suffix
            filename = filename.split('.').slice(0, -1).join('.');
        filename += ".csv";
        saveAs(blob, filename);
    }

    function show_raw(md, stats, table_id, container_id) {
        var table_sel = "#" + table_id;
        $(table_sel).bootgrid("destroy");
        $(table_sel).remove();
        var table = $("<table/>", { "class": "table table-condensed table-hover table-striped",
                                    "id": table_id })
                            .appendTo("#" + container_id);
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-searchable": false,
                                "data-visible": false })
                        .text("Id"));
        for (var i = 0; i < AbundanceColumns.length; i++) {
            var title = AbundanceColumns[i][0];
            var visible = AbundanceColumns[i][1];
            htr.append($("<th/>", { "data-column-id": title,
                                    "data-visible": visible })
                            .text(title));
        }
        var run_order = md.run_order;
        var run_label = md.run_label;
        $.each(run_order, function(run_index, run_name) {
            var run_id = run_index + 1;
            var id = run_id + "-count";
            // var label = run_label[run_name];
            var label = run_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-type": "numeric",
                                    "data-visible": true,
                                    "data-searchable": false,
                                    "data-header-css-class":"abundance-count-column" })
                            .text(label));
        });

        var raw = stats.raw;
        var rows = [];
        for (var pid = 0; pid < raw.proteins["Gene"].length; pid++) {
            var row = { id: pid };
            for (var i = 0; i < AbundanceColumns.length; i++) {
                var title = AbundanceColumns[i][0];
                row[title] = raw.proteins[title][pid];
            }
            // Matches loop above
            $.each(run_order, function(run_index, run_name) {
                var run_id = run_index + 1;
                var id = run_id + "-count";
                var column = raw.proteins[run_name + " Count"];
                if (column[pid] !== null)
                    row[id] = column[pid];
                else
                    row[id] = "-";
            });
            rows.push(row);
        }
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(BrowseStatsTableOptions)
             .bootgrid("append", rows);
    }

    return {
        init: init,
        create_tab: create_tab,
        download_csv: download_csv,
        show_raw: show_raw,
    };
})();
