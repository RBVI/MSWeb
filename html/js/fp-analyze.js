// vim: set expandtab shiftwidth=4 softtabstop=4:

analyze = (function(){

    var serial = 0;

    class AnalyzeTab {

        constructor(container, exp, stats) {
            this.tab_container = container;
            this.exp = exp;
            this.stats = stats;
            this.initialize();
            this.tab.tab("show");
        }

        initialize() {
            serial += 1;
            var tab_id = "tab-analyze-" + serial;
            var pane_id = "analyze-tab-" + serial;
            var close_id = "analyze-close-" + serial;

            // Create pane
            var pane = $("<div/>", { "class": "tab-pane fade",
                                     "id": pane_id,
                                     "role": "tabpanel",
                                     "aria-labelledby": tab_id })
                            .appendTo(this.tab_container.children(".tab-content"));
            var container = $("<div/>", { "class": "container" }).appendTo(pane);
            this.make_title(container);
            this.make_operations(container);
            this.make_summary(container);

            // Create tab
            var tab = $("<a/>", { "class": "nav-item nav-link",
                                  "id": tab_id,
                                  "data-toggle": "tab",
                                  "href": "#" + pane_id,
                                  "role": "tab",
                                  "aria-controls": pane_id,
                                  "aria-selected": "false" })
                            .append($("<span/>").text("Analyze: " + this.exp.title))
                            .append($("<span/>", { "id": close_id,
                                                   "class": "tab-close-button"})
                                            .html("&times;"))
                            .click(ev => this.close(ev))
                            .appendTo(this.tab_container.children("nav")
                                                        .find(".nav-tabs"));

            // Save references
            this.tab = tab;
            this.pane = pane;
        }

        make_title(container) {
            $("<h1/>").text(this.exp.title).appendTo(container);
        }

        make_operations(container) {
            var ops = $("<div/>", { "class": "row op-row" }).appendTo(container);
            var ops_a = $("<div/>", { "class": "col-sm-6" }).appendTo(ops);
            this.make_ops_text(ops_a, "op-diff", "Differential Abundance",
                               this.op_differential);
            this.make_ops_text(ops_a, "op-enrich", "Enrichment",
                               this.op_enrichment);
            this.make_ops_text(ops_a, "op-string", "STRING",
                               this.op_string);
            var ops_p = $("<div/>", { "class": "col-sm-6" }).appendTo(ops);
            this.make_ops_image(ops_p, "plot-violin", "violin.png", "Violin",
                                this.plot_violin);
            this.make_ops_image(ops_p, "plot-heatmap", "heatmap.svg", "Heat Map",
                                this.plot_heatmap);
            this.make_ops_image(ops_p, "plot-volcano", "volcano.svg", "Volcano",
                                this.plot_volcano);
        }

        make_ops_text(parent, id, name, method) {
            $("<button/>", { "type": "button",
                             "class": "btn btn-outline-secondary op-button",
                             "id":id })
                    .text(name)
                    .click(method.bind(this))
                    .appendTo(parent);
        }

        make_ops_image(parent, id, icon_file, name, method) {
            var button = $("<button/>", { "type": "button",
                                          "class": "btn btn-outline-primary op-button",
                                          "id": id });
            $("<img/>", { "class": "op-icon",
                          "src": "icons/" + icon_file }).appendTo(button);
            button.append($("<br/>"))
                  .append($("<span/>").text(name))
                  .click(method.bind(this))
                  .appendTo(parent);
        }
        
        make_summary(container) {
            var card_id = "analyze-summary-" + serial;
            var body_id = "analyze-summary-body-" + serial;
            var table_id = "analyze-summary-table-" + serial;
            var card = $("<div/>", { "class": "card",
                                     "id": card_id }).appendTo(container);
            var header = $("<div/>", { "class": "card-header" }).appendTo(card);
            $("<button/>", { "class": "btn btn-link",
                             "data-toggle": "collapse",
                             "data-target": "#" + body_id,
                             "aria-expanded": "true",
                             "aria-controls": body_id })
                    .append($("<span/>", { "class": "fa" }))
                    .append($("<span/>").text("Summary Table"))
                    .appendTo(header);
            var body = $("<div/>", { "class": "card-body collapse show",
                                     "id": body_id }).appendTo(card);
            $("<table/>", { "class": "table table-condensed table-hover table-striped",
                            "id": table_id }).appendTo(body);
            this.summary_table_id = table_id;
        }

        close(ev) {
            ev.stopPropagation();
            var prev = this.tab.prev();
            this.tab.remove();
            this.pane.remove();
            prev.tab("show");
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
            this.unimplemented("Violin plot");
        }

        plot_heatmap(ev) {
            this.unimplemented("Heatmap");
        }

        plot_volcano(ev) {
            this.unimplemented("Volcano plot");
        }

        unimplemented(name) {
            alert(name + " has not been implemented yet.");
        }

    };

    function create_tab(container, exp, stats) {
        return new AnalyzeTab(container, exp, stats);
    }

    return {
        create_tab: create_tab,
    };
})();
