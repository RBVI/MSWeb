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
                            .appendTo(this.tab_container.children("nav")
                                                        .find(".nav-tabs"));
            $("#" + close_id).click(ev => this.close(ev));

            // Save references
            this.tab = tab;
            this.pane = pane;
        }

        make_title(container) {
            $("<h1/>").text(this.exp.title).appendTo(container);
        }

        make_operations(container) {
            var ops = $("<div/>", { "class": "row" }).appendTo(container);
            var ops_a = $("<div/>", { "class": "col-sm-6" }).appendTo(ops);
            this.make_ops_text(ops_a, "op-diff", "Differential Abundance");
            this.make_ops_text(ops_a, "op-enrich", "Enrichment");
            this.make_ops_text(ops_a, "op-string", "STRING");
            var ops_p = $("<div/>", { "class": "col-sm-6" }).appendTo(ops);
            this.make_ops_image(ops_p, "plot-violin", "violin.png", "Violin");
            this.make_ops_image(ops_p, "plot-heatmap", "heatmap.svg", "Heat Map");
            this.make_ops_image(ops_p, "plot-volcano", "volcano.svg", "Volcano");
        }

        make_ops_text(parent, id, name) {
            $("<button/>", { "type": "button",
                             "class": "btn btn-outline-secondary op-button",
                             "id":id })
                    .text(name)
                    .appendTo(parent);
        }

        make_ops_image(parent, id, icon_file, name) {
            var button = $("<button/>", { "type": "button",
                                          "class": "btn btn-outline-primary op-button",
                                          "id": id });
            $("<img/>", { "class": "an-op-icon",
                          "src": "icons/" + icon_file }).appendTo(button);
            button.append($("<br/>"))
                  .append($("<span/>").text(name))
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

    };

    function create_tab(container, exp, stats) {
        return new AnalyzeTab(container, exp, stats);
    }

    return {
        create_tab: create_tab,
    };
})();
