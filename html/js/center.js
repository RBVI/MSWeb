var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        populateExperimentTable(metadataKeys, datasetIndex);
        $(".tablesorter-blue").tablesorter({widgets:["zebra"]});
        $(".tablesorter-blue").tablesorterPager({container: $("#exppager")});
        updateSelected(selectedExperiments);
        console.log("center.js loaded and initialized");
    }
    function populateExperimentTable(keys, data) {
        $("#experimenttable").empty();
        $("#experimenttable").append("<thead><tr></tr></thead>");
        for (var i=0;i<keys.length;i++) {
            $("#experimenttable > thead > tr").append("<th>"+keys[i]+"</th>");
        }
        $("#experimenttable > thead > tr").append("<th></th>")
        $("#experimenttable").append("<tbody></tbody>");
        for(var i=0;i<data.length;i++) {
            var row = $("<tr></tr>");
            for(var j=0;j<keys.length;j++) {
                row.append("<td>"+data[i][keys[j]]+"</td>");
            }
            var button = $("<td></td>")
            button.append("<button>Select</button>").attr("onclick", "selectExp('"+data[i]["Hash"]+"')");
            row.append(button);
            row.attr("id", data[i]["Hash"])
            $("#experimenttable > tbody").append(row);
        }
    }
    function updateSelected(selected) {
        $(".msweb-selected").empty();
        $(".msweb-selected").append("<strong>Selected Experiments: </strong>");
        $(".msweb-selected").attr("title", "Click experiment to remove\n from selected list.").tooltip();
        if (selected.length>0) {
            var last = selected[selected.length-1];
            for(var i=0;i<selected.length;i++) {
                var a = $("<a>"+getTitle(selected[i])+"</a>").attr("href","#").attr("onclick", "deselectExp('"+selected[i]+"')");
                $(".msweb-selected").append(a);
                if(selected[i]!==last) {
                    $(".msweb-selected").append(", ");
                }
            }
        } else {
            $(".msweb-selected").append("No experiments selected.");
        }
    }
    return {
        init: init,
        populateExperimentTable, populateExperimentTable,
        updateSelected: updateSelected
    }
}();