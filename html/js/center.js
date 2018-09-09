var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        populateExperimentTable(metadataKeys, datasetIndex);
        $(".tablesorter-blue").tablesorter({widgets: ["pager"]});
        //$(".tablesorter-blue").tablesorterPager({container: $("#exppager")});
        updateSelected(selectedExperiments);
        console.log("center.js loaded and initialized");
    }
    function populateExperimentTable(keys, data) {
        $("#experimenttable").empty();
        $("#experimenttable").append("<thead><tr></tr></thead>");
        for (var i=0;i<keys.length;i++) {
            $("#experimenttable > thead > tr").append("<th>"+keys[i]+"</th>");
        }
        $("#experimenttable").append("<tbody></tbody>");
        for(var i=0;i<data.length;i++) {
            var row = $("<tr></tr>");
            row.click(function() {
                if($(this).hasClass("msweb-selected-exp")) {
                    deselectExp($(this).attr("id"));
                } else {
                    selectExp($(this).attr("id"))
                }
                $(this).toggleClass("msweb-selected-exp");
            });
            for(var j=0;j<keys.length;j++) {
                row.append("<td>"+data[i][keys[j]]+"</td>");
            }
            row.attr("id", data[i]["Hash"])
            $("#experimenttable > tbody").append(row);
        }
    }
    function updateStatus(selected) {
        center.updateSelected(selectedExperiments);
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
    return {
        init: init,
        populateExperimentTable, populateExperimentTable,
        updateSelected: updateSelected
    }
}();