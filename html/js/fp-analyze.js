// vim: set expandtab shiftwidth=4 softtabstop=4:

analyze = (function(){

    var serial = 0;

    class AnalyzeTab {

        constructor(container, metadata, stats) {
            this.tab_container = container;
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
            this.make_summary(container);

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
        }

        make_title(container) {
            $("<h1/>").text(this.metadata.title).appendTo(container);
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
            var card = this.make_collapsible_card(container, "summary", "Summary Table");
            var body = card.find(".card-body");
            var table_id = this.make_id("summary", "table");
            $("<table/>", { "class": "table table-condensed table-hover table-striped",
                            "id": table_id }).appendTo(body);
            this.summary_table_id = table_id;
            frontpage.show_summary_table(table_id, this.metadata, this.stats);
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
                                    "css": { "width": "600px",
                                             "height": "250px" } })
                            .appendTo(body);
            var raw_div = div.get(0);
            plot.make_plot_violin(raw_div, plot_id, this.metadata, this.stats);
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

    function create_tab(container, metadata, stats) {
        return new AnalyzeTab(container, metadata, stats);
    }

    return {
        create_tab: create_tab,
    };
})();
