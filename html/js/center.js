var center = function() {

    ExperimentsGridOptions = {
        selection: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        /* Adds title property so hovering over header show entire text */
        /*
        templates: {
            headerCell: "<th title=\"{{ctx.column.id}}\"data-column-id=\"{{ctx.column.id}}\" class=\"{{ctx.css}}\" style=\"{{ctx.style}}\"><a href=\"javascript:void(0);\" class=\"{{css.columnHeaderAnchor}} {{ctx.sortable}}\"><span class=\"{{css.columnHeaderText}}\">{{ctx.column.text}}</span>{{ctx.icon}}</a></th>",
        },
        */
    };
    DataGridOptions = {
        selection: true,
        multiSelect: true,
        keepSelection: true,
        rowCount: [20, 50, 100, -1],
        url: "/MSWeb/cgi-bin/bootgridJSON.py",
        ajax: true,
        formatters: {
            url: function (column, row) {
                var s = row[column.id];
                return '<a href="' + s + '" target="_blank">link</a>';
            }
        },
        post: function () {         // Must be replaced before use
            return { id: "experiment_hash" };
        },
    };

    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        populateExperimentTable(metadataKeys, datasetIndex);
        $("#experimenttable").bootgrid(ExperimentsGridOptions)
            .on("selected.rs.jquery.bootgrid", function(e, rows) {
                selectExp(rows[0]["Hash"]); })
            .on("deselected.rs.jquery.bootgrid", function(e, rows) {
                deselectExp(rows[0]["Hash"]); });
        $("#center").on("shown.bs.tab", function(e) {
            var tabId = e.target["id"];
            if (tabId == "tab_experiments") {
                experimentsTabShow();
            } else if (tabId == "tab_data") {
                dataTabShow();
            } else if (tabId == "tab_plots") {
                plotsTabShow();
            } else {
                alert("Unknown tab!");
            }
        });
        $("#download").click(function(e) {
            download_raw();
        });
        $("#showdata").click(function(e) {
            activate_tab("tab_data");
        });
        $("#showplot").click(function(e) {
            activate_tab("tab_plots");
        });
        updateStatus(selectedExperiments);
        console.log("center.js loaded and initialized");
    }

    function download_raw() {
        if (selectedExperiments.length < 1) {
            alert("No experiments selected");
            return;
        }
        var hashes = [];
        for (var i = 0; i < selectedExperiments.length; i++)
            hashes.push("hash=" + selectedExperiments[i])
        var url = "/MSWeb/cgi-bin/downloadData.py?" + hashes.join('&');
        window.location.href = url;
    }

    function activate_tab(tab) {
        $('#' + tab).tab("show");
    }

    /*
     * Experiments tab functions
     */

    function experimentsTabShow() {
        $("#datafilters").empty()
                         .append($("<p/>").text("Filters shown when " +
                                                "Data tab is selected"))
    }

    function populateExperimentTable(keys, data) {
        $("#experimenttable").empty();
        $("#experimenttable").append("<thead><tr></tr></thead>");
        for (var i=0;i<keys.length;i++) {
            var attr = { "data-column-id": keys[i] };
            if (keys[i] == "Rows" || keys[i] == "Columns")
                attr["data-type"] = "numeric";
            if (keys[i] == "Hash") {
                attr["data-identifier"] = true;
                attr["data-visible"] = false;
            }
            var th = $("<th/>", attr).text(keys[i]);
            $("#experimenttable > thead > tr").append(th);
        }
        $("#experimenttable").append("<tbody></tbody>");
        for(var i=0;i<data.length;i++) {
            var row = $("<tr/>");
            for(var j=0;j<keys.length;j++)
                row.append($("<td/>").text(data[i][keys[j]]));
            row.attr("id", data[i]["Hash"])
            $("#experimenttable > tbody").append(row);
        }
    }
    function updateStatus(selected) {
        updateSelected(selected);
        updateRows(selected);
    }
    function updateRows(selected) {
        $(".msweb-selectedrows").empty();
        $(".msweb-selectedrows").append("<strong>Number of rows in selected experiments: </strong>");
        if(selectedRows == 0){
            $(".msweb-selectedrows").append("No experiments selected.");
        } else {
            $(".msweb-selectedrows").append(selectedRows);
        }
    }
    function updateSelected(selected) {
        $(".msweb-selectedlist").empty();
        $(".msweb-selectedlist").append("<strong>Selected Experiments: </strong>");
        if (selected.length>0) {
            var last = selected[selected.length-1];
            for(var i=0;i<selected.length;i++) {
                $(".msweb-selectedlist").append(getTitle(selected[i]));
                if(selected[i]!==last) {
                    $(".msweb-selectedlist").append(", ");
                }
            }
        } else {
            $(".msweb-selectedlist").append("No experiments selected.");
        }
    }


    /*
     * Data tab functions
     */

    // Global "selectedExperiments" is what gets selected in Experiments tab.
    // These variables are what is currently shown in the Data tab.
    // When Data tab is brought to front, the latter need to be updated
    // to match the former.
    var dataTabExperiments = [];
    var dataTabExpContents = {};
    var dataTabGrid = null;

    function dataTabShow() {
        $("#datafilters").empty()
            .append($("<p/>").text("Data filters not supported yet"))
        if (selectedExperiments.length == 0) {
            dataTabExperiments = [];
            dataTabExpContents = {};
            if (dataTabGrid) {
                dataTabGrid.destroy();
                dataTabGrid = null;
            }
            $("#data").empty()
                      .append($("<h3/>").text("No experiments selected."));
            return;
        }
        var changed = false;
        var newExps = [];
        for (var i = 0; i < dataTabExperiments.length; i++) {
            var hash = dataTabExperiments[i];
            if (selectedExperiments.indexOf(hash) == -1) {
                // Remove rows from experiment
                delete dataTabExpContents[hash];
                changed = true;
            } else {
                newExps.push(hash);
            }
        }
        for (var i = 0; i < selectedExperiments.length; i++) {
            var hash = selectedExperiments[i];
            if (newExps.indexOf(hash) == -1) {
                newExps.push(hash);
                // Add rows from experiment
                console.time("retrieveData");
                var exp = retrieveData([hash])[0];
                console.timeEnd("retrieveData");
                var data = exp["Data"];
                var columns = [];
                for (var c in data)
                    columns.push(c);
                columns.sort(); // Not needed if combining columns later
                var numRows = data[columns[0]].length;
                dataTabExpContents[hash] = {
                    numRows: numRows,
                    columns: columns,
                    data: data,
                    metadata: exp["Metadata"],
                    filter: null
                }
                changed = true;
            }
        }
        if (!changed)
            return;
        dataTabExperiments = newExps;
        if (dataTabGrid) {
            dataTabGrid.destroy();
            dataTabGrid = null;
        }
        populateDataTable(dataTabExperiments, dataTabExpContents);
    }

    /* Combine all experiments into a single table */
    /* NOT USED
    function populateDataTable(hashes, exps) {
        console.time("create table");
        var table = $("<table/>", { id: "datatable",
                                    class: "table table-condensed " +
                                           "table-hover table-striped" });
        var htr = $("<tr/>");
        var allColumns = [];
        for (var hash in exps) {
            var expCols = exps[hash].columns;
            for (var i = 0; i < expCols.length; i++)
                if (allColumns.indexOf(expCols[i]) == -1)
                    allColumns.push(expCols[i]);
        }
        // TODO: Need to get unique row identifiers for selection
        allColumns.sort();
        var name2index = {};
        for (var i = 0; i < allColumns.length; i++) {
            var columnName = allColumns[i];
            name2index[columnName] = i;
            var attr = { "data-column-id": columnName };
            // TODO: check if column is numeric
            var th = $("<th/>", attr).text(columnName);
            htr.append(th);
        }
        table.append($("<thead/>").append(htr));
        var tbody = $("<tbody/>");
        for(var i = 0; i < hashes.length; i++) {
            var exp = exps[hashes[i]];
            var data = exp.data;
            for (var n = 0; n < exp.numRows; n++) {
                var row = $("<tr/>");
                for (var j = 0; j < allColumns.length; j++) {
                    var cell = data[allColumns[j]][n];
                    if (cell == undefined)
                        cell = "-";
                    row.append($("<td/>").text(cell));
                }
                tbody.append(row);
            }
        }
        table.append(tbody);
        console.timeEnd("create table");
        console.time("add table");
        $("#data").empty().append(table);
        console.timeEnd("add table");
        console.time("grid table");
        table.bootgrid(DataGridOptions);
        console.timeEnd("grid table");
    }
    */

    /* Generate a table for each experiment */
    /* NOT USED
    function populateDataTable(hashes, exps) {
        $("#data").empty();
        for(var i = 0; i < hashes.length; i++) {
            var exp = exps[hashes[i]];
            // Create table element
            console.time("create table");
            var table = $("<table/>", { id: "datatable_" + hashes[i],
                                        class: "table table-condensed " +
                                               "table-hover table-striped" });
            var tr = $("<tr/>");
            tr.append($("<th/>", { "data-column-id": "RowIndex",
                                   "data-type": "numeric",
                                   "data-visible": false,
                                   "data-identifier": true }));
            $.each(exp.columns, function(n, columnName) {
                var attr = { "data-column-id": columnName };
                // TODO: check if column is numeric
                tr.append($("<th/>", attr).text(columnName));
            });
            table.append($("<thead/>").append(tr));
            var tbody = $("<tbody/>");
            var data = exp.data;
            for (var i = 0; i < exp.numRows; i++) {
                var tr = $("<tr/>");
                tr.append($("<td/>").text(i));
                $.each(exp.columns, function(n, columnName) {
                    var cell = data[columnName][i];
                    tr.append($("<td/>").text(cell));
                });
                tbody.append(tr);
            }
            table.append(tbody);
            console.timeEnd("create table");
            console.time("add table");
            $("#data").append(table);
            console.timeEnd("add table");
            console.time("grid table");
            table.bootgrid(DataGridOptions);
            console.timeEnd("grid table");
        }
    }
    */

    /* Generate a table for each experiment using server-side population */
    function populateDataTable(hashes, exps) {
        $("#data").empty();
        for(var i = 0; i < hashes.length; i++) {
            var hash = hashes[i];
            // Create table element
            console.time("create table");
            var table = $("<table/>", { id: "datatable_" + hashes[i],
                                        class: "table table-condensed " +
                                               "table-hover table-striped" });
            var columns = _retrieveColumns(hash);
            var tr = $("<tr/>");
            tr.append($("<th/>", { "data-column-id": "RowIndex",
                                   "data-type": "numeric",
                                   "data-visible": false,
                                   "data-identifier": true }));
            $.each(columns, function(n, columnData) {
                var columnName = columnData[0];
                var attr = { "data-column-id": columnName };
                var columnType = columnData[1];
                if (columnType == "numeric")
                    attr["data-type"] = "numeric"
                else if (columnType == "url")
                    attr["data-formatter"] = "url"
                tr.append($("<th/>", attr).text(columnName));
            });
            table.append($("<thead/>").append(tr));
            console.timeEnd("create table");
            console.time("add table");
            $("#data").append(table);
            console.timeEnd("add table");
            console.time("grid table");
            DataGridOptions.post = function() { return {id: hash}; };
            table.bootgrid(DataGridOptions);
            console.timeEnd("grid table");
        }
    }

    function _retrieveColumns(hash) {
        var output = null;
        $("body").css("cursor", "progress");
        $.ajaxSetup({async: false});
        $.getJSON("/MSWeb/cgi-bin/bootgridJSON.py", {id: hash},
                  function(data) { output = data; });
        $.ajaxSetup({async: true});
        $("body").css("cursor", "default");
        return output;
    }


    /*
     * Plots tab functions
     */

    var plotlyEditor = null;

    function plotsTabShow() {
        var dataSources = {};
        for (var i = 0; i < dataTabExperiments.length; i++) {
            // TODO: support multiple experiments.  For now,
            // we just take the data from the first one.
            var exp = dataTabExpContents[dataTabExperiments[i]];
            dataSources = exp.data;
            break;
        }
        var plotlyOptions = {
            dataSources: dataSources
        };
        /*
         * TODO: Need to reinitialize widget or destroy and recreate.
        if (plotlyEditor)
            plotlyEditor.destroy();
        */
        plotlyEditor = React.createElement(app.App.default, plotlyOptions);
        var root = $("<div/>", { id: "plotly_editor" });
        $("#plots").empty().append(root);
        ReactDOM.render(plotlyEditor, root[0]);
        $("#datafilters").empty()
                         .append($("<p/>").text("Filters shown when " +
                                                "Data tab is selected"))
    }


    /*
     * Return public functions
     */

    return {
        init: init,
        populateExperimentTable, populateExperimentTable,
        updateSelected: updateSelected,
        updateStatus: updateStatus,
        updateRows: updateRows,
    }
}();
