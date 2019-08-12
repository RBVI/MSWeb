// vim: set expandtab shiftwidth=4 softtabstop=4:

tmt = (function(){

    // Although everything is named "tmt", this module works
    // for both TMT and iTRAQ experiments.

    //
    // Options for stats table and stats column information
    //
    var BrowseStatsTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [10, 20, 50, 100, -1],
    };
    var TmtColumns = [
        [ "Search ID", false ],
        [ "Uniq Pep", false ],
        [ "Acc #", true ],
        [ "Gene", true ],
        [ "Num Unique", false ],
        [ "% Cov", false ],
        [ "Best Disc Score", false ],
        [ "Best Expect Val", false ],
        [ "Score", true ],
        [ "Expect", true ],
        [ "m/z", false ],
        [ "z", false ],
        [ "RT", false ],
        [ "DB Peptide", false ],
        [ "Peptide", true ],
        [ "Protein Name", true ],
        [ "Protein MW", false ],
        [ "Species", true ],
    ];

    var serial = 0;

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    class TmtTab {

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
            var tab_id = "tab-tmt-" + serial;
            var pane_id = "tmt-tab-" + serial;
            var close_id = "tmt-close-" + serial;

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
            // Proteins, peptides and spectra are dictionaries
            // whose key is the control category and whose value
            // is the table of data
            this.proteins = {}
            this.proteins_table_id = undefined;
            this.peptides = {}
            this.peptides_table_id = undefined;
            this.spectra = {}
            this.spectra_table_id = undefined;
        }

        make_title(container) {
            $("<h1/>").text(this.metadata.title).appendTo(container);
        }

        make_operations(container) {
            var ops = $("<div/>", { "class": "row op-row" }).appendTo(container);
            var ops_a = $("<div/>", { "class": "col-6" }).appendTo(ops);
            this.make_ops_text(ops_a, "op-proteins", "Proteins",
                               "", this.op_proteins);
            this.make_ops_text(ops_a, "op-peptides", "Peptides",
                               "", this.op_peptides);
            this.make_ops_text(ops_a, "op-spectra", "Spectra",
                               "", this.op_spectra);
            var ops_p = $("<div/>", { "class": "col-6" }).appendTo(ops);
            this.make_ops_image(ops_p, "plot-violin", "violin.png",
                                "Violin", "",
                                this.plot_violin);
            this.make_ops_image(ops_p, "plot-heatmap", "heatmap.svg",
                                "Heat Map", "",
                                this.plot_heatmap);
            this.make_ops_image(ops_p, "plot-volcano", "volcano.svg",
                                "Volcano", "",
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
            return "tmt-" + name + "-" + subtype + "-" + this.serial;
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

        add_control(form, title="control") {
            var cat_names = this.metadata.run_categories;
            var control_id = this.make_id("proteins", title);
            var control_field = this.add_field(form, control_id, capitalize(title));
            var control = this.add_select(control_field, control_id, cat_names);
            $.each(cat_names, function(index, name) {
                if (name.toLowerCase() == title)
                    control.val(name);
            });
            return control;
        }

        do_data_type(data_type, control, cb, extra) {
            // console.log("proteins using control " + control);
            frontpage.show_status("fetching " + data_type + "...", true)
            $.ajax({
                dataType: "json",
                method: "POST",
                url: frontpage.url,
                data: {
                    action: "tmt_data",
                    exp_id: this.exp_id,
                    type: data_type,
                    control: control,
                },
                success: function(data) {
                    frontpage.show_status("", false)
                    if (data.status != "success")
                        frontpage.show_ajax_error(data.status, data.reason,
                                                  data.cause);
                    else {
                        this[data_type][control] = data.results.stats;
                        cb.call(this, this.card_container, control, extra);
                    }
                }.bind(this),
                error: function(xhr, status, error) {
                    alert("Fetching proteins failed.");
                    frontpage.show_status(error);
                },
            });
        }

        make_table_card(container, data_type, control) {
            var title = capitalize(data_type) + " (control: " + control + ")";
            var card = this.make_collapsible_card(container, data_type, title);
            var body = card.find(".card-body");
            var div = $("<div/>", { "class": "table-responsive" }).appendTo(body);
            var table_id = this.make_id(data_type, "table");
            $("<table/>", { "class": "table table-condensed table-hover table-striped",
                            "id": table_id }).appendTo(div);
            var table_id_attr = data_type + "_table_id";
            var close_card = function() {
                card.remove();
                this[table_id_attr] = undefined;
            }.bind(this);
            this.add_card_buttons(card, [ [ "fa-times-circle", close_card ] ]);
            this[table_id_attr] = table_id;
        }

        op_proteins(ev, a, b) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("TMT Proteins");
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var control = this.add_control(form);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click").on("click", function(ev) {
                var control_val = control.val();
                if (!this.proteins[control_val])
                    this.do_data_type("proteins", control_val, this.make_table_proteins);
                else {
                    frontpage.show_status("using cached proteins", true)
                    this.make_table_proteins(this.card_container, control_val);
                    frontpage.show_status("", false)
                }
            }.bind(this));
            dialog.modal();
        }

        make_table_proteins(container, control) {
            if (this.proteins_table_id == null)
                this.make_table_card(container, "proteins", control);
            show_proteins_table(this.proteins_table_id, this.metadata,
                                control, this.proteins[control]);
        }

        op_peptides(ev, a, b) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("TMT Peptides");
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var control = this.add_control(form);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click").on("click", function(ev) {
                var control_val = control.val();
                if (!this.peptides[control_val])
                    this.do_data_type("peptides", control_val, this.make_tablepeptides);
                else {
                    frontpage.show_status("using cached peptides", true)
                    this.make_tablepeptides(this.card_container, control_val);
                    frontpage.show_status("", false)
                }
            }.bind(this));
            dialog.modal();
        }

        make_tablepeptides(container, control) {
            if (this.peptides_table_id == null)
                this.make_table_card(container, "peptides", control);
            show_peptides_table(this.peptides_table_id, this.metadata,
                                control, this.peptides[control]);
        }

        op_spectra(ev, a, b) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("TMT Peptides");
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var control = this.add_control(form);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click").on("click", function(ev) {
                var control_val = control.val();
                if (!this.spectra[control_val])
                    this.do_data_type("spectra", control_val, this.make_table_spectra);
                else {
                    frontpage.show_status("using cached spectra", true)
                    this.make_table_spectra(this.card_container, control_val);
                    frontpage.show_status("", false)
                }
            }.bind(this));
            dialog.modal();
        }

        make_table_spectra(container, control) {
            if (this.spectra_table_id == null)
                this.make_table_card(container, "spectra", control);
            show_spectra_table(this.spectra_table_id, this.metadata,
                                control, this.spectra[control]);
        }

        plot_violin(ev) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("Violin Plot");
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var sid = this.make_id("violin-plot", "select")
            var field = this.add_field(form, sid, "Data");
            var sel = this.add_select(field, sid, [ "Proteins",
                                                    "Peptides",
                                                    "Spectra", ]);
            var control = this.add_control(form);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click").on("click", function(ev) {
                var data = sel.val();
                var control_val = control.val();
                if (data == "Proteins") {
                    if (!this.proteins[control_val])
                        this.do_data_type("proteins", control_val, this.plot_violin_proteins);
                    else
                        this.plot_violin_proteins(this.card_container, control_val);
                } else if (data == "Peptides") {
                    if (!this.peptides[control_val])
                        this.do_data_type("peptides", control_val, this.plot_violin_peptides);
                    else
                        this.plot_violin_peptides(control.val());
                } else if (data == "Spectra") {
                    if (!this.spectra[control_val])
                        this.do_data_type("spectra", control_val, this.plot_violin_spectra);
                    else
                        this.plot_violin_spectra(control.val());
                } else
                    alert("Unknown violin plot type: " + data);
            }.bind(this));
            dialog.modal();
        }

        make_plot_card(container, data_type, control, plot_type) {
            var title = capitalize(plot_type) + " Plot - " + capitalize(data_type);
            var card = this.make_collapsible_card(container, plot_type, title);
            var body = card.find(".card-body");
            var plot_id = this.make_id(plot_type, "plot");
            var div = $("<div/>", { "id": plot_id,
                                    "css": { "resize": "vertical",
                                             "overflow": "hidden",
                                             "width": "600px",
                                             "height": "250px" } })
                            .appendTo(body);
            var pop_out = function() {
                plot.pop_out(div, this.metadata.title + " - " + capitalize(data_type))
            }.bind(this);
            var close_card = function() {
                card.remove();
            }.bind(this);
            this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ],
                                          [ "fa-times-circle", close_card ] ]);
            return div;
        }

        plot_violin_proteins(container, control) {
            var div = this.make_plot_card(container, "proteins", control, "violin");
            make_plot_violin_proteins.call(this, div, control);
        }

        plot_violin_peptides(container, control) {
            var div = this.make_plot_card(container, "peptides", control, "violin");
            make_plot_violin_peptides.call(this, div, control);
        }

        plot_violin_spectra(container, control) {
            var div = this.make_plot_card(container, "spectra", control, "violin");
            make_plot_violin_spectra.call(this, div, control);
        }

        plot_heatmap(ev) {
            var dialog = $("#modal-dialog");
            dialog.find(".modal-title").text("Heatmap");
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var control = this.add_control(form);
            var topn_id = this.make_id("heatmap", "topn");
            var topn_field = this.add_field(form, topn_id, "Show Top N");
            var topn_cutoff = this.add_int_input(topn_field, topn_id, 10, 1);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click").on("click", function(ev) {
                var control_val = control.val();
                var topn_val = topn_cutoff.val()
                if (!this.proteins[control_val])
                    this.do_data_type("proteins", control_val,
                                      this.make_heatmap_proteins, topn_val);
                else
                    this.make_heatmap_proteins(this.card_container, control_val, topn_val);
            }.bind(this));
            dialog.modal();
        }

        make_heatmap_proteins(container, control, topn_cutoff) {
            var container = this.pane.children(".container-fluid");
            var card = this.make_collapsible_card(container, "heatmap",
                                                  "Heat Map - Protein Ratios");
            var body = card.find(".card-body");
            var plot_id = this.make_id("heatmap", "plot");
            var div = $("<div/>", { "id": plot_id,
                                    "css": { "resize": "vertical",
                                             "overflow": "hidden",
                                             "width": "600px",
                                             "height": "500px" } })
                            .appendTo(body);
            make_plot_heatmap_proteins.call(this, div, control, topn_cutoff);
            var pop_out = function() {
                plot.pop_out(div, this.metadata.title + " - Protein Ratios")
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
            var body = dialog.find(".modal-body").empty();
            var form = $("<form/>").appendTo(body);
            var control = this.add_control(form);
            var category = this.add_control(form, "category");
            var pvalue_id = this.make_id("volcano", "pvalue");
            var pvalue_field = this.add_field(form, pvalue_id, "p-Value threshold");
            var pvalue = this.add_float_input(pvalue_field, pvalue_id, 0.05, 0.05);
            var fc_id = this.make_id("volcano", "fc");
            var fc_field = this.add_field(form, fc_id, "Ratio threshold");
            var fc = this.add_float_input(fc_field, fc_id, 2.0, 0.5);
            var okay = dialog.find(".modal-okay-button");
            okay.off("click").on("click", function(ev) {
                var control_val = control.val();
                var cat_val = category.val();
                if (control_val == cat_val) {
                    alert("Control and category must be distinct.");
                    return;
                }
                var extra = {
                    "category": cat_val,
                    "pvalue": pvalue.val(),
                    "fc": fc.val(),
                }
                if (!this.proteins[control_val])
                    this.do_data_type("proteins", control_val,
                                      this.make_volcano_proteins, extra);
                else
                    this.make_volcano_proteins(this.card_container, control_val, extra);
            }.bind(this));
            dialog.modal();
        }

        make_volcano_proteins(container, control, extra) {
            var category = extra["category"];
            var pvalue_threshold = extra["pvalue"];
            var fc = extra["fc"];
            var title = "Volcano Plot (" + category + " vs. " + control + ")";
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
            if (make_plot_volcano_proteins.call(this, div, control, category,
                                                pvalue_threshold, fc)) {
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
        }

        plot_string(ev) {
            this.unimplemented("STRING plot");
        }

        unimplemented(name) {
            alert(name + " has not been implemented yet.");
        }

    };

    //
    //-----------------------------------------------------------------------
    // Functions for displaying tables
    //-----------------------------------------------------------------------
    //

    var DataTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        formatters: {
            fixed4: function(column, row) {
                var value = row[column.id];
                if (value == null)
                    return "-";
                else
                    return row[column.id].toFixed(4);
            },
            average: function(column, row) {
                var avg = row[column.id];
                if (avg == null)
                    return "-";
                else {
                    var sd = row[column.id + "_sd"];
                    if (sd == null)
                        return avg.toFixed(2)
                    else
                        return avg.toFixed(2) + " &plusmn; " + sd.toFixed(2);
                    // console.log(avg + '+' + sd);
                }
            }
        },
    };

    //
    // show_proteins_table:
    //   Display protein statistics for given experiment.
    //
    function show_proteins_table(table_id, metadata, control, proteins) {
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
        htr.append($("<th/>", { "data-column-id": "protein" }).text("Protein"));
        htr.append($("<th/>", { "data-column-id": "gene" }).text("Gene"));
        var cat_order = metadata.run_categories.sort().filter(
                                function(cat_name) { return cat_name != control; });
        var cat_mean = function(cat_name) {
            return "Mean Log2 Ratio " + cat_name;
        }
        var cat_sd = function(cat_name) {
            return "StDev Log2 Ratio " + cat_name;
        }
        var cat_pvalue = function(cat_name) {
            return "p-value " + cat_name;
        }
        var cat_cols = {}
        $.each(cat_order, function(cat_index, cat_name) {
            var cols = {};
            cols.mean = proteins[cat_mean(cat_name)];
            cols.sd = proteins[cat_sd(cat_name)];
            cols.pvalue = proteins[cat_pvalue(cat_name)];
            cat_cols[cat_name] = cols;
            var id = "ratio-" + cat_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "average",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text(cat_name));
            if (cols.pvalue) {
                id = "pvalue-" + cat_name;
                htr.append($("<th/>", { "data-column-id": id,
                                        "data-converter": "numeric",
                                        "data-formatter": "fixed4",
                                        "data-visible": true,
                                        "data-searchable": false })
                                .text("pValue " + cat_name));
            }
        });

        var rows = [];
        var accs = proteins["Acc #"];
        var genes = proteins["Gene"];
        for (var pid = 0; pid < accs.length; pid++) {
            var row = { id: pid };
            row["protein"] = accs[pid] ? accs[pid].toString() : "-";
            row["gene"] = genes[pid] ? genes[pid].toString() : "-";
            $.each(cat_order, function(cat_index, cat_name) {
                // Matches loop above
                var column_id = "ratio-" + cat_name;
                var cols = cat_cols[cat_name];
                row[column_id] = cols.mean[pid];
                if (cols.sd)
                    row[column_id + "_sd"] = cols.sd[pid];
                if (cols.pvalue)
                    row["pvalue-" + cat_name] = cols.pvalue[pid];
            });
            rows.push(row);
        }
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(DataTableOptions)
             .bootgrid("append", rows);
    }

    //
    // show_peptides_table:
    //   Display peptides statistics for given experiment.
    //
    function show_peptides_table(table_id, metadata, control, peptides) {
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
        htr.append($("<th/>", { "data-column-id": "protein" }).text("Protein"));
        htr.append($("<th/>", { "data-column-id": "gene" }).text("Gene"));
        htr.append($("<th/>", { "data-column-id": "peptide" }).text("Peptide"));
        var run_order = metadata.run_order.sort();
        $.each(run_order, function(run_index, run_name) {
            var id = "ratio-" + run_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "fixed4",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text("Ratio " + run_name));
            id = "log2ratio-" + run_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "fixed4",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text("Log2 Ratio " + run_name));
        });

        var run_ratio = function(run_name) {
            return "Median Ratio " + run_name;
        }
        var run_log2 = function(run_name) {
            return "Median Log2 Ratio " + run_name;
        }
        var rows = [];
        var accs = peptides["Acc #"];
        var genes = peptides["Gene"];
        var db_peptides = peptides["DB Peptide"];
        for (var pid = 0; pid < accs.length; pid++) {
            var row = { id: pid };
            row["protein"] = accs[pid] ? accs[pid].toString() : "-";
            row["gene"] = genes[pid] ? genes[pid].toString() : "-";
            row["peptide"] = db_peptides[pid] ? db_peptides[pid].toString() : "-";
            $.each(run_order, function(run_index, run_name) {
                // Matches loop above
                var column_id = "ratio-" + run_name;
                row[column_id] = peptides[run_ratio(run_name)][pid];
                column_id = "log2ratio-" + run_name;
                row[column_id] = peptides[run_log2(run_name)][pid];
            });
            rows.push(row);
        }
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(DataTableOptions)
             .bootgrid("append", rows);
    }

    //
    // show_spectra_table:
    //   Display spectra statistics for given experiment.
    //
    function show_spectra_table(table_id, metadata, control, spectra) {
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
        htr.append($("<th/>", { "data-column-id": "protein" }).text("Protein"));
        htr.append($("<th/>", { "data-column-id": "gene" }).text("Gene"));
        htr.append($("<th/>", { "data-column-id": "peptide" }).text("Peptide"));
        var run_order = metadata.run_order;
        $.each(run_order, function(run_index, run_name) {
            var id = "ratio-" + run_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "fixed4",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text("Ratio " + run_name));
            id = "log2ratio-" + run_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    "data-converter": "numeric",
                                    "data-formatter": "fixed4",
                                    "data-visible": true,
                                    "data-searchable": false })
                            .text("Log2 Ratio " + run_name));
        });

        var run_ratio = function(run_name) {
            return "Ratio " + run_name;
        }
        var run_log2 = function(run_name) {
            return "Log2 Ratio " + run_name;
        }
        var rows = [];
        var accs = spectra["Acc #"];
        var genes = spectra["Gene"];
        var db_peptides = spectra["DB Peptide"];
        for (var pid = 0; pid < accs.length; pid++) {
            var row = { id: pid };
            row["protein"] = accs[pid] ? accs[pid].toString() : "-";
            row["gene"] = genes[pid] ? genes[pid].toString() : "-";
            row["peptide"] = db_peptides[pid] ? db_peptides[pid].toString() : "-";
            $.each(run_order, function(run_index, run_name) {
                // Matches loop above
                var column_id = "ratio-" + run_name;
                row[column_id] = spectra[run_ratio(run_name)][pid];
                column_id = "log2ratio-" + run_name;
                row[column_id] = spectra[run_log2(run_name)][pid];
            });
            rows.push(row);
        }
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(DataTableOptions)
             .bootgrid("append", rows);
    }

    //
    //-----------------------------------------------------------------------
    // Functions for displaying violin plots
    //-----------------------------------------------------------------------
    //

    //
    // make_plot_violin_proteins:
    //   Create violin plot of protein ratios in TMT experiment.
    //   y = ratio
    //   trace = category name
    //
    function make_plot_violin_proteins(div, control) {
        metadata = this.metadata;
        proteins = this.proteins[control];
        var accs = proteins["Acc #"];
        var genes = proteins["Gene"];
        var categories = metadata.run_categories.sort().filter(
                                function(cat_name) { return cat_name != control; });
        var traces = [];
        var cat_mean = function(cat_name) {
            return "Mean Log2 Ratio " + cat_name;
        }
        var cat_sd = function(cat_name) {
            return "StDev Log2 Ratio " + cat_name;
        }
        for (var i = 0; i < categories.length; i++) {
            var cat_name = categories[i];
            var y = [];
            var text = [];
            var means = proteins[cat_mean(cat_name)];
            var sds = proteins[cat_sd(cat_name)];
            for (var pid = 0; pid < accs.length; pid++) {
                var mean = means[pid];
                if (mean == null)
                    continue;
                y.push(mean);
                var label = accs[pid];
                var gene = genes[pid];
                if (gene)
                    label += " (" + gene + ")";
                var sd = sds[pid];
                if (sd !== null)
                    label += " SD:&plusmn; " + sd.toFixed(2);
                text.push(label);
            }
            traces.push({
                legendgroup: cat_name,
                name: cat_name,
                scalegroup: "Yes",
                x0: cat_name,
                type: "violin",
                y: y,
                text: text,
            });
        }
        var layout = {
            showLegend: true,
            legend: { x:1, y:0.5 },
            hovermode: "closest",
            xaxis: { title: "Control: " + control, automargin: true },
            yaxis: { title: "Log2(Mean Protein Ratios)", automargin: true },
            title: metadata.title,
        };
        plot.make_plotly(div, traces, layout);
    }

    //
    // make_plot_violin_peptides:
    //   Create violin plot of peptide intensities in TMT experiment.
    //   y = ratio
    //   trace = run name
    //
    function make_plot_violin_peptides(div, control) {
        metadata = this.metadata;
        peptides = this.peptides[control];
        var accs = peptides["Acc #"];
        var genes = peptides["Gene"];
        var peps = peptides["DB Peptide"];
        var run_order = metadata.run_order.sort();
        var traces = [];
        var run_median = function(run_name) {
            return "Median Log2 Ratio " + run_name;
        }
        for (var i = 0; i < run_order.length; i++) {
            var run_name = run_order[i];
            var y = [];
            var text = [];
            var medians = peptides[run_median(run_name)];
            for (var pid = 0; pid < accs.length; pid++) {
                var median = medians[pid];
                if (median == null)
                    continue;
                y.push(median);
                var label = peps[pid] + " - " + accs[pid];
                var gene = genes[pid];
                if (gene)
                    label += " (" + gene + ")";
                text.push(label);
            }
            traces.push({
                legendgroup: run_name,
                name: run_name,
                scalegroup: "Yes",
                x0: run_name,
                type: "violin",
                y: y,
                text: text,
            });
        }
        var layout = {
            showLegend: true,
            legend: { x:1, y:0.5 },
            hovermode: "closest",
            xaxis: { title: "Control: " + control, automargin: true },
            yaxis: { title: "Median Log2(Peptide Ratios)", automargin: true },
            title: metadata.title,
        };
        plot.make_plotly(div, traces, layout);
    }

    //
    // make_plot_violin_spectra:
    //   Create violin plot of spectra intensities in TMT experiment.
    //   y = ratio
    //   trace = run name
    //
    function make_plot_violin_spectra(div, control) {
        metadata = this.metadata;
        spectra = this.spectra[control];
        var accs = spectra["Acc #"];
        var genes = spectra["Gene"];
        var peps = spectra["DB Peptide"];
        var run_order = metadata.run_order.sort();
        var traces = [];
        var run_median = function(run_name) {
            return "Log2 Ratio " + run_name;
        }
        for (var i = 0; i < run_order.length; i++) {
            var run_name = run_order[i];
            var y = [];
            var text = [];
            var medians = spectra[run_median(run_name)];
            for (var pid = 0; pid < accs.length; pid++) {
                var median = medians[pid];
                if (median == null)
                    continue;
                y.push(median);
                var label = peps[pid] + " - " + accs[pid];
                var gene = genes[pid];
                if (gene)
                    label += " (" + gene + ")";
                text.push(label);
            }
            traces.push({
                legendgroup: run_name,
                name: run_name,
                scalegroup: "Yes",
                x0: run_name,
                type: "violin",
                y: y,
                text: text,
            });
        }
        var layout = {
            showLegend: true,
            legend: { x:1, y:0.5 },
            hovermode: "closest",
            xaxis: { title: "Control: " + control, automargin: true },
            yaxis: { title: "Log2(Ratios)", automargin: true },
            title: metadata.title,
        };
        plot.make_plotly(div, traces, layout);
    }

    //
    //-----------------------------------------------------------------------
    // Functions for displaying heatmap
    //-----------------------------------------------------------------------
    //

    //
    // make_plot_heatmap_proteins:
    //   Create volcano plot for protein ratios.
    //   x = category
    //   y = protein
    //   z = ???
    //
    function make_plot_heatmap_proteins(div, control, topn) {
        var metadata = this.metadata;
        var proteins = this.proteins[control];
        var accs = proteins["Acc #"];
        var genes = proteins["Gene"];
        var categories = metadata.run_categories.sort().filter(
                                function(cat_name) { return cat_name != control; });
        var cat_mean = function(cat_name) {
            return "Mean Log2 Ratio " + cat_name;
        }
        var columns = categories.map(function(cat_name) {
            return proteins[cat_mean(cat_name)];
        }).filter(function(column) { return column != null; });

        var protein_indices = [];
        function sorted_indices(rows) {
            // Return an array of indices that would sort the given array,
            // of values (while ignoring nulls)
            var pairs = []
            for (var i = 0; i < rows.length; i++) {
                var value = rows[i];
                if (value !== null)
                    pairs.push([ value, i ]);
            }
            // Sort LOW-to-HIGH.  All values _should_ be floats.
            pairs.sort((a, b) => a[0] - b[0]);
            return pairs;
        }
        // Loop over columns in reverse order because plotly heatmap
        // displays bottom to top.  Sorting is already low-to-high
        // so no need to reverse direction.
        for (var ci = columns.length - 1; ci >= 0; ci--) {
            if (accs.length <= topn * 2) {
                // Display all proteins
                var pairs = sorted_indices(columns[ci]);
                for (var i = 0; i < pairs.length; i++)
                    protein_indices.push(pairs[i][1]);
            } else {
                // Display top/bottom N
                var pairs = sorted_indices(columns[ci]);
                for (var i = 0; i < topn; i++)
                    protein_indices.push(pairs[i][1]);
                for (var i = pairs.length - topn; i < pairs.length; i++)
                    protein_indices.push(pairs[i][1]);
            }
        }
        var dups = {};
        var texts = [];
        var zvalues = [];
        for (var i = 0; i < protein_indices.length; i++) {
            var protein_index = protein_indices[i];
            // plotly heatmap wants all y labels to be unique, so
            // we prepend a Unicode zero width space to non-unique
            // labels until they are unique
            var label = accs[protein_index];
            var gene = genes[protein_index];
            if (gene)
                label += " (" + gene + ")";
            while (dups[label] !== undefined)
                label = "&#8203;" + label;
            dups[label] = 1;
            texts.push(label);
            zvalues.push(columns.map(col => col[protein_index]));
        }

        var data = [{
            x: categories,
            y: texts,
            z: zvalues,
            zmid: 0.0,
            type: "heatmap",
            colorscale: [ [ 0, '#FF0000'], [ 0.5, '#FFFFFF' ], [ 1, '#0000FF' ] ],
            showscale: true,
            colorbar: { title: { text: "Log2 Ratio", side: "right", }, },
        }];
        var layout = {
            automargin: true,
            title: metadata.title,
            xaxis: { side: 'top', automargin: true, ticks: '' },
            yaxis: { side: 'left', automargin: true,
                     tick0: 0, dtick: 1, ticks: '', ticksuffix: ' ' },
        };
        var height = (texts.length * 1.3) + "vh";
        plot.make_plotly(div, data, layout, height);
    }

    //
    //-----------------------------------------------------------------------
    // Functions for displaying volcano plot
    //-----------------------------------------------------------------------
    //

    //
    // make_plot_volcano_proteins:
    //   Create volcano plot for abundance experiment.
    //   y = -log(p-value)
    //   x = log(fold change)
    //   traces = [significant +, significant -, insignificant]
    //   shapes = p-value and fold change thresholds
    //
    function make_plot_volcano_proteins(div, control, cat, pvalue_threshold, fc) {
        var metadata = this.metadata;
        var proteins = this.proteins[control];
        var fc_threshold = Math.log2(fc);
        var accs = proteins["Acc #"];
        var genes = proteins["Gene"];
        var pvalue_column = proteins["p-value " + cat];
        var fc_column = proteins["Mean Log2 Ratio " + cat];
        if (pvalue_column == null || fc_column == null) {
            alert("No data found for category: " + cat);
            return false;
        }
        sig_plus_x = [];
        sig_plus_y = [];
        sig_plus_text = [];
        sig_minus_x = [];
        sig_minus_y = [];
        sig_minus_text = [];
        insig_x = [];
        insig_y = [];
        insig_text = [];
        for (var pid = 0; pid < accs.length; pid++) {
            var pvalue = pvalue_column[pid];
            var log2FC = fc_column[pid];
            if (pvalue == null || log2FC == null)
                continue;
            var pv = -Math.log10(pvalue);
            var label = accs[pid];
            var gene = genes[pid];
            if (gene)
                label += " (" + gene + ")";
            if (pvalue > pvalue_threshold) {
                insig_x.push(log2FC);
                insig_y.push(pv);
            } else {
                if (log2FC > fc_threshold) {
                    sig_plus_x.push(log2FC);
                    sig_plus_y.push(pv);
                    sig_plus_text.push(label);
                } else if (log2FC < -fc_threshold) {
                    sig_minus_x.push(log2FC);
                    sig_minus_y.push(pv);
                    sig_minus_text.push(label);
                } else {
                    insig_x.push(log2FC);
                    insig_y.push(pv);
                    insig_text.push(label);
                }
            }
        }
        var traces = [
            {
                x: sig_plus_x,
                y: sig_plus_y,
                text: sig_plus_text,
                hoverinfo: "x+y+text",
                name: "FC >= " + fc + " and p-value < " + pvalue_threshold,
                mode: "markers",
                type: "scatter",
                marker: {
                    color: "red",
                }
            },
            {
                x: sig_minus_x,
                y: sig_minus_y,
                text: sig_minus_text,
                hoverinfo: "x+y+text",
                name: "FC <= " + (1 / fc) + " and p-value < " + pvalue_threshold,
                mode: "markers",
                type: "scatter",
                marker: {
                    color: "blue",
                }
            },
            {
                x: insig_x,
                y: insig_y,
                text: insig_text,
                hoverinfo: "x+y+text",
                name: (1 / fc) + " < FC < " + fc + " or p-value > " + pvalue_threshold,
                mode: "markers",
                type: "scatter",
                marker: {
                    color: "gray",
                }
            },
        ];
        var layout = {
            hovermode: "closest",
            xaxis: { title: "log2(fold change)", automargin: true },
            yaxis: { title: "-log10(p-value)", automargin: true },
            title: cat + " vs. " + control,
            shapes: [
                {
                    type: "line",
                    xref: "paper",
                    x0: 0,
                    x1: 1,
                    y0: -Math.log10(pvalue_threshold),
                    y1: -Math.log10(pvalue_threshold),
                    line: {
                        color: "lightgray",
                        dash: "dash",
                    },
                },
                {
                    type: "line",
                    yref: "paper",
                    y0: 0,
                    y1: 1,
                    x0: fc_threshold,
                    x1: fc_threshold,
                    line: {
                        color: "lightgray",
                        dash: "dot",
                    },
                },
                {
                    type: "line",
                    yref: "paper",
                    y0: 0,
                    y1: 1,
                    x0: -fc_threshold,
                    x1: -fc_threshold,
                    line: {
                        color: "lightgray",
                        dash: "dot",
                    },
                },
            ],
        };
        plot.make_plotly(div, traces, layout);
        return true;
    }

    //
    //-----------------------------------------------------------------------
    // Public functions
    //-----------------------------------------------------------------------
    //

    //
    // init:
    //   Initialize package
    //
    function init() {
        return;
    }

    //
    // create_tab:
    //   Create tab in main HTML page
    //
    function create_tab(container, exp_id, metadata, stats) {
        return new TmtTab(container, exp_id, metadata, stats);
    }

    //
    // download_csv:
    //   Download raw table data
    //
    function download_csv(only_selected, md, stats, table) {
        function quote(s) {
            return /[,"]/.test(s) ?  '"' + s.replace(/"/g, '""') + '"' : s;
        }
        var spectra = stats.raw.spectra;
        var headers = [];
        var columns = []
        for (var ci = 0; ci < TmtColumns.length; ci++) {
            var column = TmtColumns[ci];
            columns.push(spectra[column[0]]);
            headers.push(quote(column[0]));
        }
        for (var ci = 0; ci < md.run_order.length; ci++) {
            var run_name = md.run_order[ci];
            columns.push(spectra[run_name + " Count"]);
            headers.push(quote(run_name));
        }
        var lines = [ headers.join(',') + '\n' ];
        var which_rows;
        if (!only_selected || table == null)
            which_rows = Array(spectra["Acc #"].length).keys();
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

    //
    // show_raw:
    //   Display raw data table
    //
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
        for (var i = 0; i < TmtColumns.length; i++) {
            var title = TmtColumns[i][0];
            var visible = TmtColumns[i][1];
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
                                    "data-header-css-class":"tmt-count-column" })
                            .text(label));
        });

        var raw = stats.raw;
        var rows = [];
        for (var pid = 0; pid < raw.spectra["Gene"].length; pid++) {
            var row = { id: pid };
            for (var i = 0; i < TmtColumns.length; i++) {
                var title = TmtColumns[i][0];
                row[title] = raw.spectra[title][pid];
            }
            // Matches loop above
            $.each(run_order, function(run_index, run_name) {
                var run_id = run_index + 1;
                var id = run_id + "-count";
                var column = raw.spectra[run_name];
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
