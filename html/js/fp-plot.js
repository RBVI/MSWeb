// vim: set expandtab shiftwidth=4 softtabstop=4:

plot = (function(){

    //
    // make_plot:
    //   Generate new plot tab using currently selected parameters
    //
    function make_plot(ev) {
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
    function make_plot_placeholder(div, div_name, metadata, stats) {
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
    function make_plot_violin(div, div_name, metadata, stats) {
        var raw = stats.raw;
        var normalized = stats.normalized;
        var traces = [];
        Object.keys(normalized).sort().forEach(function(cat_name) {
            y = [];
            text = [];
            $.each(normalized[cat_name], function(pid, counts) {
                var protein = raw.proteins[pid];
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
    // cancel_plot:
    //   No-op for now
    //
    function cancel_plot(ev) {
        // console.log("cancel_plot");
    }

    return {
        make_plot: make_plot,
        cancel_plot: cancel_plot,
        make_plot_placeholder: make_plot_placeholder,
        make_plot_violin: make_plot_violin,
    };
})();
