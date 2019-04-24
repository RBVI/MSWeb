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

    class AnalyzeTab {

        constructor(container, exp_id, metadata, stats) {
            this.tab_container = container;
            this.exp_id = exp_id;
            this.metadata = metadata;
            this.stats = stats;
            this.initialize();
            this.tab.tab("show");
        }

        initialize() {
            serial += 1;
            this.serial = serial;
            var tab_id = "tab-analyze-" + serial;
            var pane_id = "analyze-tab-" + serial;
            var close_id = "analyze-close-" + serial;

            // Create pane
            var pane = $("<div/>", { "class": "tab-pane fade",
                                     "id": pane_id,
                                     "role": "tabpanel",
                                     "aria-labelledby": tab_id })
                            .appendTo(this.tab_container.children(".tab-content"));
            var container = $("<div/>", { "class": "container-fluid" }).appendTo(pane);
            this.make_title(container);
            this.make_operations(container);
            container.find(".need-normalized")
                     .addClass("disabled")
                     .attr("disabled", "disabled");

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
                                        .click(ev => this.close(ev)))
                            .appendTo(this.tab_container.children("nav")
                                                        .find(".nav-tabs"));

            // Save references
            this.tab = tab;
            this.pane = pane;
            this.summary_table_id = undefined;
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
                                "Heat Map", "need-normalized",
                                this.plot_heatmap);
            this.make_ops_image(ops_p, "plot-volcano", "volcano.svg",
                                "Volcano", "need-normalized",
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
        
        make_summary(container) {
            if (this.summary_table_id === undefined) {
                var card = this.make_collapsible_card(container, "summary", "Summary Table");
                var body = card.find(".card-body");
                var table_id = this.make_id("summary", "table");
                $("<table/>", { "class": "table table-condensed table-hover table-striped",
                                "id": table_id }).appendTo(body);
                this.summary_table_id = table_id;
            }
            show_summary_table(this.summary_table_id, this.metadata, this.stats);
            body.collapse("hide");
        }

        make_collapsible_card(container, name, title) {
            var card_id = this.make_id(name, "card");
            var body_id = this.make_id(name, "body");
            var card = $("<div/>", { "class": "card",
                                     "id": card_id }).appendTo(container);
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

        make_id(name, subtype) {
            return "analyze-" + name + "-" + subtype + "-" + this.serial;
        }

        close(ev) {
            ev.stopPropagation();
            var prev = this.tab.prev();
            this.tab.remove();
            this.pane.remove();
            prev.tab("show");
        }

        op_normalize(ev, a, b) {
            var dialog = $("#modal-dialog");
            var body = dialog.find(".modal-body").empty();
            var sid = this.make_id("normalize", "select")
            var sel = $("<select/>", { "id": sid }).appendTo(body);
            $.each(normalization_methods, function(index, name) {
                $("<option/>", { "value": name }).text(name).appendTo(sel);
            });
            sel.val(normalization_methods[0]);
            var okay = dialog.find(".modal-okay-button");
            okay.on("click", function(ev) {
                okay.off("click");
                // console.log("normalize using " + sel.val());
                $.ajax({
                    dataType: "json",
                    method: "POST",
                    url: frontpage.url,
                    data: {
                        action: "normalize",
                        exp_id: this.exp_id,
                        method: sel.val(),
                    },
                    success: function(data) {
                        if (data.status != "success")
                            frontpage.show_ajax_error(data.status, data.reason,
                                                      data.cause);
                        else {
                            this.stats.norm_method = data.results.name;
                            this.stats.norm_params = data.results.params;
                            this.stats.norm_stats = data.results.stats;
                            // console.log(this.stats.norm_stats);
                            var container = this.pane.find(".container-fluid");
                            this.make_summary(container);
                            container.find(".need-normalized")
                                     .removeClass("disabled")
                                     .removeAttr("disabled");
                        }
                    }.bind(this),
                });
            }.bind(this));
            dialog.modal();
        }

        op_differential(ev, a, b) {
            this.unimplemented("Differential abundance");
        }

        op_enrichment(ev) {
            this.unimplemented("Enrichment");
        }

        op_string(ev) {
            this.unimplemented("STRING");
        }

        plot_violin(ev) {
            var container = this.pane.children(".container-fluid");
            var card = this.make_collapsible_card(container, "violin", "Violin Plot");
            var body = card.find(".card-body");
            var plot_id = this.make_id("violin", "plot");
            var div = $("<div/>", { "id": plot_id,
                                    "css": { "resize": "vertical",
                                             "overflow": "hidden",
                                             "width": "600px",
                                             "height": "250px" } })
                            .appendTo(body);
            plot.make_plot_violin(div, this.metadata, this.stats);
            var pop_out = function() {
                plot.pop_out(div, this.metadata.title + " - Violin Plot")
            }.bind(this);
            this.add_card_buttons(card, [ [ "fa-arrow-circle-up", pop_out ] ]);
        }

        plot_heatmap(ev) {
            this.unimplemented("Heatmap");
        }

        plot_volcano(ev) {
            this.unimplemented("Volcano plot");
        }

        plot_string(ev) {
            this.unimplemented("STRING plot");
        }

        unimplemented(name) {
            alert(name + " has not been implemented yet.");
        }

    };

    function create_tab(container, exp_id, metadata, stats) {
        return new AnalyzeTab(container, exp_id, metadata, stats);
    }

    var SummaryTableOptions = {
        selection: true,
        rowSelect: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        converters: {
            floats: {
                from: function(value) {
                    return value;
                },
                to: function(value) {
                    if (value == "-")
                        return value;
                    else
                        return value[0];
                },
            }
        },
        formatters: {
            floats: function(column, row) {
                var value = row[column.id];
                if (value == "-")
                    return value;
                else {
                    // console.log(value[0] + '+' + value[1]);
                    return value[0].toFixed(2) + " &plusmn; " + value[1].toFixed(2);
                }
            }
        },
    };

    //
    // show_summary_table:
    //   Display summary for given data.
    //   Used from fp-analyze.js as well
    //
    function show_summary_table(table_id, metadata, stats) {
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
        htr.append($("<th/>", { "data-column-id": "protein" })
                        .text("Protein"));
        htr.append($("<th/>", { "data-column-id": "gene" })
                        .text("Gene"));
        var exp = metadata;
        var raw = stats.raw;
        var norm = stats.norm_stats;
        var cat_order = Object.keys(norm).sort();
        $.each(cat_order, function(cat_index, cat_name) {
            var id = "summary-" + cat_name;
            htr.append($("<th/>", { "data-column-id": id,
                                    // "data-converter": "string",
                                    // Really array of two floats
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
                var column_id = "summary-" + cat_name;
                var counts = norm[cat_name][protein_index];
                if (!counts)
                    row[column_id] = "-";
                else {
                    /*
                    var n = counts.length;
                    var mean = counts.reduce((a, b) => a + b) / n;
                    var sd = Math.sqrt(counts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
                    row[column_id] = [mean, sd];
                    */
                    row[column_id] = [counts[0], counts[1]];
                }
            });
            rows.push(row);
        });
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"))
             .bootgrid(SummaryTableOptions)
             .bootgrid("append", rows);
    }

    return {
        init: init,
        create_tab: create_tab,
    };
})();
