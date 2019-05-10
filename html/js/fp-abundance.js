// vim: set expandtab shiftwidth=4 softtabstop=4:

abundance = (function(){

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
        });
    }

    class AbundanceTab {

        constructor(container, exp_id, metadata, stats) {
            this.tab_container = container;
            this.exp_id = exp_id;
            this.metadata = metadata;
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
            var ops_a = $("<div/>", { "class": "col-sm-6" }).appendTo(ops);
            this.make_ops_text(ops_a, "op-normalize", "Normalize",
                               "", this.op_normalize);
            this.make_ops_text(ops_a, "op-diff", "Differential Abundance",
                               "need-normalized", this.op_differential);
            this.make_ops_text(ops_a, "op-enrich", "Enrichment",
                               "need-normalized", this.op_enrichment);
            var ops_p = $("<div/>", { "class": "col-sm-6" }).appendTo(ops);
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
                                "STRING", "need-normalized",
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
                            "class": "col-sm-4 col-form-label" })
                        .text(label).appendTo(row);
            var div = $("<div/>", { "class": "col-sm-8" }).appendTo(row);
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
                            this.stats.norm_method = data.results.name;
                            this.stats.norm_params = data.results.params;
                            this.stats.norm_stats = data.results.stats;
                            this.make_normalized_counts(this.card_container);
                            this.disable(".need-normalized", false);
                        }
                    }.bind(this),
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
                var params = [];
                $.each(this.stats.norm_params, function(key, value) {
                    params.push(key + "=" + value);
                });
                frontpage.show_status("computing differential abundance...", true)
                $.ajax({
                    dataType: "json",
                    method: "POST",
                    traditional: true,
                    url: frontpage.url,
                    data: {
                        action: "differential_abundance",
                        exp_id: this.exp_id,
                        method: this.stats.norm_method,
                        params: params,
                        categories: categories.selectpicker("val"),
                        control: control.val(),
                        fc_cutoff: fc_cutoff.val(),
                        mean_cutoff: mean_cutoff.val(),
                    },
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
            plot.make_plot_heatmap_da(div, this.metadata, this.stats);
            var pop_out = function() {
                plot.pop_out(div, this.metadata.title + " - Differential Abundance")
            }.bind(this);
            var close_card = function() {
                card.remove();
            }.bind(this);
            this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ],
                                          [ "fa-times-circle", close_card ] ]);
        }

        plot_volcano(ev) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("Volcano Plot");
            var control = this.stats.da_params.control;
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var cat_names = this.metadata.run_categories.slice();
            cat_names.splice(cat_names.indexOf(control), 1);
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
                var title = "Normalized Counts (method: " + this.stats.norm_method + ")";
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
            show_differential_table(this.differential_table_id, this.metadata, this.stats);
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
                var value = row[column.id];
                if (value == "-")
                    return value;
                else {
                    var sd = row[column.id + "_sd"];
                    return value.toFixed(2) + " &plusmn; " + sd.toFixed(2);
                    // console.log(value + '+' + sd);
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
        var exp = metadata;
        var raw = stats.raw;
        var norm = stats.norm_stats;
        var cat_order = Object.keys(norm).sort();
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
        $.each(raw.proteins, function(protein_index, protein) {
            var row = { id: protein_index };
            row["protein"] = protein["Acc #"] ? protein["Acc #"].toString() : "-";
            row["gene"] = protein["Gene"] ? protein["Gene"].toString() : "-";
            $.each(cat_order, function(cat_index, cat_name) {
                // Matches loop above
                var column_id = "nc-" + cat_name;
                var counts = norm[cat_name][protein_index];
                if (!counts)
                    row[column_id] = "-";
                else {
                    row[column_id] = counts[0];
                    row[column_id + "_sd"] = counts[1];
                }
            });
            rows.push(row);
        });
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
    // show_differential_table:
    //   Display differential abundance for given experiment.
    //
    function show_differential_table(table_id, metadata, stats) {
        var selector = "#" + table_id;
        $(selector).bootgrid("destroy");
        var table = $(selector).empty();
        var htr = $("<tr/>");
        htr.append($("<th/>", { "data-column-id": "id",
                                "data-identifier": true,
                                "data-type": "numeric",
                                "data-searchable": false,
                                "data-visible": false })
                        .text("Id"));
        $.each(stats.da_stats.columns, function(col_index, col_name) {
            if (col_name == "Rows") {
                htr.append($("<th/>", { "data-column-id": "protein" })
                                .text("Protein"));
                htr.append($("<th/>", { "data-column-id": "gene" })
                                .text("Gene"));
            } else {
                var id = "nc-" + col_name;
                htr.append($("<th/>", { "data-column-id": id,
                                        "data-converter": "numeric",
                                        "data-formatter": "nullmeric",
                                        "data-visible": true,
                                        "data-searchable": false })
                                .text(col_name));
            }
        });

        var rows = [];
        $.each(stats.da_stats.data, function(row_index, row_data) {
            var row = {};
            $.each(stats.da_stats.columns, function(col_index, col_name) {
                // Matches loop above
                var value = row_data[col_index];
                if (col_name == "Rows") {
                    var protein_index = parseInt(value);
                    var protein = stats.raw.proteins[protein_index];
                    row["id"] = protein_index;
                    row["protein"] = protein["Acc #"] ? protein["Acc #"].toString() : "-";
                    row["gene"] = protein["Gene"] ? protein["Gene"].toString() : "-";
                } else {
                    var column_id = "nc-" + col_name;
                    if (value === null)
                        row[column_id] = Infinity;
                    else
                        row[column_id] = value;
                }
            });
            rows.push(row);
        });
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(DifferentialAbundanceTableOptions)
             .bootgrid("append", rows);
    }

    return {
        init: init,
        create_tab: create_tab,
    };
})();
