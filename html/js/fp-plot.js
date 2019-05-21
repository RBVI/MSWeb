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
        var accs = raw.proteins["Acc #"];
        var genes = raw.proteins["Gene"];
        var categories = metadata.run_categories.sort();
        var norm_stats = stats.norm_stats;
        var traces = [];
        for (var i = 0; i < categories.length; i++) {
            var cat_name = categories[i];
            var y = [];
            var text = [];
            var means = norm_stats[cat_name + " Mean"];
            var sds = norm_stats[cat_name + " SD"];
            for (var pid = 0; pid < accs.length; pid++) {
                var mean = means[pid];
                if (mean === null)
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
            xaxis: { title: "", automargin: true },
            yaxis: { title: "Average Normalized Counts", automargin: true },
            title: metadata.title,
        };
        make_plotly(div, traces, layout);
    }

    //
    // make_plot_violin_da:
    //   Create violin plot of differential abundance for abundance experiment.
    //   y = abundance
    //   trace = category name
    //
    function make_plot_violin_da(div, metadata, stats) {
        var raw = stats.raw;
        var accs = raw.proteins["Acc #"];
        var genes = raw.proteins["Gene"];
        var categories = stats.da_params.categories.sort();
        var da_stats = stats.da_stats;
        var traces = [];
        for (var i = 0; i < categories.length; i++) {
            var cat_name = categories[i];
            var log2FC = da_stats[cat_name + " log2FC"];
            if (log2FC === undefined)
                continue;
            var y = [];
            var text = [];
            for (var pid = 0; pid < accs.length; pid++) {
                var value = log2FC[pid];
                if (value === null)
                    continue;
                y.push(value);
                var label = accs[pid];
                var gene = genes[pid];
                if (gene)
                    label += " (" + gene + ")";
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
            xaxis: { title: "", automargin: true },
            yaxis: { title: "Differential Abundance (log2FC)", automargin: true },
            title: metadata.title,
            violinmode: "overlay",
            violingap: 0,
            violingroupgap: 0,
        };
        make_plotly(div, traces, layout);
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
        var accs = raw.proteins["Acc #"];
        var genes = raw.proteins["Gene"];
        var da_stats = stats.da_stats;
        var pvalue_column = da_stats[cat + " pValue"];
        var fc_column = da_stats[cat + " log2FC"];
        if (pvalue_column === undefined || fc_column === undefined) {
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
        for (var pid = 0; pid < accs.length; pid++) {
            var pvalue = pvalue_column[pid];
            var log2FC = fc_column[pid];
            if (pvalue === null || log2FC === null)
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
        make_plotly(div, traces, layout);
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
        var accs = raw.proteins["Acc #"];
        var genes = raw.proteins["Gene"];
        var da_stats = stats.da_stats;
        var categories = stats.da_params.categories.filter(function(cat_name) {
            return da_stats[cat_name + " log2FC"] !== undefined;
        }).sort();
        var columns = categories.map(function(cat_name) {
            return da_stats[cat_name + " log2FC"];
        });

        var N = 10;
        var protein_indices = [];
        if (accs.length < N * 3) {
            // Display all proteins
            for (var i = 0; i < accs.length; i++)
                protein_indices.push(i);
        } else {
            // Display top/bottom N for each category
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
                var pairs = sorted_indices(columns[ci]);
                for (var i = 0; i < N; i++)
                    protein_indices.push(pairs[i][1]);
                for (var i = pairs.length - N; i < pairs.length; i++)
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
            colorbar: { title: { text: "Log2FC", side: "right", }, },
        }];
        var layout = {
            title: metadata.title,
            automargin: true,
            xaxis: { side: 'top', ticks: '' },
            yaxis: { side: 'left', automargin: true,
                     tick0: 0, dtick: 1, ticks: '', ticksuffix: ' ' },
        };
        var height = (texts.length * 1.3) + "vh";
        make_plotly(div, data, layout, height);
    }

    function make_plotly(div, data, layout, height) {
        Plotly.newPlot(div.attr("id"), data, layout);
        make_resizable(div, height);
        div.data({ data: data, layout: layout, height: height });
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

    function pop_out(div, title) {
        var data = div.data("data");
        var layout = div.data("layout");
        var height = div.data("height");
        var html = '<!DOCTYPE html><html><head>';
        html += '<title>' + title + '</title>';
        html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>';
        html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/plotly.js/1.45.2/plotly.min.js"></script>';
        html += '<script src="js/fp-plot.js"></script>'
        html += '<style>html { height:95%; } body { height:100%; }</style>';
        html += '</head><body>';
        html += '<div id="plot"></div>';
        html += '</body>';
        html += '<script>';
        html += 'data = ' + JSON.stringify(data) + ';';
        html += 'layout = ' + JSON.stringify(layout) + ';';
        html += 'plot.make_plotly($("#plot"), data, layout, "100%");';
        html += '</script></html>';
        new_window(html);
    }

    function new_window(html) {
        var win = window.open("", "");
        var d = win.document;
        d.open();
        d.write(html);
        d.close();
    }

    return {
        pop_out: pop_out,
        make_plot_placeholder: make_plot_placeholder,
        make_plot_violin_norm: make_plot_violin_norm,
        make_plot_violin_da: make_plot_violin_da,
        make_plot_heatmap_da: make_plot_heatmap_da,
        make_plot_volcano: make_plot_volcano,
        make_plotly: make_plotly,
    };
})();
