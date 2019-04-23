// vim: set expandtab shiftwidth=4 softtabstop=4:

plot = (function(){

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
    function make_plot_violin(div, metadata, stats) {
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
        var div_id = div.attr("id");
        Plotly.newPlot(div_id, traces, layout);
        var d3 = Plotly.d3;
        var gd3 = d3.select("#" + div_id)
                    .style({ "width": "94%",
                             "height": "40vh",
                             "margin-left": "3%",
                             "margin-top": "2.5vh", });
        var gd = gd3.node();
        Plotly.Plots.resize(gd);

        // Simulate detecting resize by looking for style changes
        div.observer = new MutationObserver(function(mutations) {
            $.each(mutations, function(m) {
                Plotly.Plots.resize(gd);
            });
        });
        div.each(function() {
            div.observer.observe(this, { attributes: true,
                                         attributeFilter: [ "style" ] });
        });
    }

    function pop_out(div, title) {
        Plotly.toImage(div.attr("id"), { format: "svg" })
              .then(function(dataurl) {
                var doc = $("<html/>");
                var head = $("<head/>").appendTo(doc);
                $("<title/>").text(title).appendTo(head);
                var body = $("<body/>").appendTo(doc);
                $("<img/>", { "src": dataurl })
                    .css("width", "100%")
                    .appendTo(body);
                var win = window.open("", "");
                var d = win.document;
                d.open();
                d.write(doc.html());
                d.close();
              });
    }

    return {
        pop_out: pop_out,
        make_plot_placeholder: make_plot_placeholder,
        make_plot_violin: make_plot_violin,
    };
})();
