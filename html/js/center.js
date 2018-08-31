var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        populateExperimentTable(metadataKeys, datasetIndex);
        $(".tablesorter-blue").tablesorter();
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
            for(var j=0;j<keys.length;j++) {
                row.append("<td>"+data[i][keys[j]]+"</td>");
            }
            row.attr("id", data[i]["Hash"])
            $("#experimenttable > tbody").append(row);
        }
    }
    return {
        init: init,
        populateExperimentTable, populateExperimentTable
    }
}();