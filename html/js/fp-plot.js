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
    // make_plot_violin_norm:
    //   Create violin plot of normalized counts for abundance experiment.
    //   y = abundance
    //   trace = category name
    //
    function make_plot_violin_norm(div, metadata, stats) {
        var raw = stats.raw;
        var norm_stats = stats.norm_stats;
        var traces = [];
        Object.keys(norm_stats).sort().forEach(function(cat_name) {
            y = [];
            text = [];
            $.each(norm_stats[cat_name], function(pid, counts) {
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
            yaxis: { title: "Average Normalized Counts", automargin: true },
            title: metadata.title,
            violinmode: "overlay",
            violingap: 0,
            violingroupgap: 0,
        };
        Plotly.newPlot(div.attr("id"), traces, layout);
        make_resizable(div);
    }

    //
    // make_plot_violin_da:
    //   Create violin plot of differential abundance for abundance experiment.
    //   y = abundance
    //   trace = category name
    //
    function make_plot_violin_da(div, metadata, stats) {
        var raw = stats.raw;
        var categories = stats.da_params.categories;
        var da_stats = stats.da_stats;
        var traces = [];
        categories.sort().forEach(function(cat_name) {
            var column_index = da_stats.columns.indexOf(cat_name + " log2FC");
            if (column_index < 0)
                return;
            var y = [];
            var text = [];
            $.each(da_stats.data, function(pid, row_data) {
                var protein = raw.proteins[pid];
                var label = protein["Acc #"];
                var gene = protein["Gene"];
                if (gene)
                    label += " (" + gene + ")";
                y.push(row_data[column_index]);
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
            yaxis: { title: "Differential Abundance (log2FC)", automargin: true },
            title: metadata.title,
            violinmode: "overlay",
            violingap: 0,
            violingroupgap: 0,
        };
        Plotly.newPlot(div.attr("id"), traces, layout);
        make_resizable(div);
    }

    //
    // make_plot_volcano:
    //   Create volcano plot for abundance experiment.
    //   y = -log(p-value)
    //   x = log(fold change)
    //   traces = [significant +, significant -, insignificant]
    //   shapes = p-value and fold change thresholds
    //
    function make_plot_volcano(div, metadata, stats, cat, pvalue_threshold, fc) {
        var raw = stats.raw;
        var da_stats = stats.da_stats;
        var row_index = da_stats.columns.indexOf("Rows");
        var pvalue_index = da_stats.columns.indexOf(cat + " pValue");
        var fc_index = da_stats.columns.indexOf(cat + " log2FC");
        if (pvalue_index < 0 || fc_index < 0) {
            alert("No data found for category: " + cat);
            return false;
        }
        var fc_threshold = Math.log2(fc);
        sig_plus_x = [];
        sig_plus_y = [];
        sig_plus_text = [];
        sig_minus_x = [];
        sig_minus_y = [];
        sig_minus_text = [];
        insig_x = [];
        insig_y = [];
        insig_text = [];
        $.each(da_stats.data, function(index, row_data) {
            var pvalue = row_data[pvalue_index];
            if (pvalue === null)
                return;
            var log2FC = row_data[fc_index];
            if (log2FC === null)
                return;
            var pv = -Math.log10(pvalue);
            var protein = raw.proteins[parseInt(row_data[row_index])];
            var label = protein["Acc #"];
            var gene = protein["Gene"];
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
        });
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
            title: cat + " vs. " + stats.da_params.control,
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
        Plotly.newPlot(div.attr("id"), traces, layout);
        make_resizable(div);
        return true;
    }

    //
    // make_plot_heatmap_da:
    //   Create volcano plot for abundance experiment.
    //   x = category
    //   y = protein
    //   z = ???
    //
    function make_plot_heatmap_da(div, metadata, stats) {
        var raw = stats.raw;
        var da_stats = stats.da_stats;
        var categories = stats.da_params.categories.filter(function(cat_name) {
            return da_stats.columns.indexOf(cat_name + " log2FC") >= 0;
        }).sort();
        var columns = categories.map(function(cat_name) {
            return da_stats.columns.indexOf(cat_name + " log2FC");
        });
        // plotly heatmap wants all y labels to be unique, so
        // we prepend a space to non-unique labels until they are
        var dups = {};
        var texts = raw.proteins.map(function(protein) {
            var label = protein["Acc #"];
            var gene = protein["Gene"];
            if (gene)
                label += " (" + gene + ")";
            while (dups[label] !== undefined)
                label = " " + label;
            dups[label] = 1;
            return label;
        });
        var zvalues = [];
        da_stats.data.forEach(function(row_data) {
            zvalues.push(columns.map(n => row_data[n]));
        });
        var data = [{
            x: categories,
            y: texts,
            z: zvalues,
            zmid: 0.0,
            type: "heatmap",
            colorscale: [ [ 0, '#FF0000'], [ 0.5, '#FFFFFF' ], [ 1, '#0000FF' ] ],
            showscale: true,
            colorbar: { title: { text: "Log2FC", side: "right", }, },
        }];
        var layout = {
            title: metadata.title,
            automargin: true,
            xaxis: { side: 'top', ticks: '' },
            yaxis: { side: 'left', automargin: true, ticks: '', ticksuffix: ' ' },
        };
        Plotly.newPlot(div.attr("id"), data, layout);
        make_resizable(div, "80vh");
    }

    function make_resizable(div, size) {
        var div_id = div.attr("id");
        var d3 = Plotly.d3;
        if (!size)
            size = "40vh";
        var gd3 = d3.select("#" + div_id)
                    .style({ "width": "94%",
                             "height": size,
                             "margin-left": "3%",
                             "margin-top": "2.5vh", });
        var gd = gd3.node();
        Plotly.Plots.resize(gd);

        $(window).resize(function(m) { Plotly.Plots.resize(gd); });
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

    function sorted_indices(arr, cmp) {
        // Return an array of indices that would sort the given array of values
        var tmp = $.map(arr, function(v, i) { return [v, i]; });
        tmp.sort(function(a, b) { return cmp(a[0], b[0]); });
        return $map(tmp, function(v, i) { return v[1]; });
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
        make_plot_violin_norm: make_plot_violin_norm,
        make_plot_violin_da: make_plot_violin_da,
        make_plot_heatmap_da: make_plot_heatmap_da,
        make_plot_volcano: make_plot_volcano,
    };
})();
