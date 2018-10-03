// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
var datasetIndex = [];
var experimentalData = [];
var metadataKeys = ["Hash", "Title", "Researcher", "Uploaded By", "Uploaded On", "Experiment Type", "Experiment Date", "Experiment Conditions", "Columns", "Rows"]
var selectedExperiments = [];
var selectedRows = 0;
var reactChartEditor;
function retrieveIndex(){
    $("body").css("cursor", "progress");
    $.ajaxSetup({async: false});
    $.getJSON("/MSWeb/cgi-bin/retrieveIndex.py", function(data){datasetIndex = data});
    $.ajaxSetup({async: true});
    $("body").css("cursor", "default");
}

function retrieveData(hashes) {
    if(typeof hashes == "undefined") {
        return undefined;
    } else if (hashes.length > 0) {
        var output = [];
        $("body").css("cursor", "progress");
        $.ajaxSetup({async: false});
        for (var i = 0; i < hashes.length; i++) {
            var tempData = {};
            $.getJSON("/MSWeb/cgi-bin/retrieveJSON.py?hash="+hashes[i],
                      function(data) { tempData = data; });
            output.push(tempData);
        }
        $.ajaxSetup({async: true});
        $("body").css("cursor", "default");
        return output;
    }
}
function selectExp(hash) {
    if(selectedExperiments.indexOf(hash)<0) {
        selectedExperiments.push(hash);
        selectedRows = selectedRows + getRows(hash);
        center.updateStatus(selectedExperiments);
    } else {
        alert("Experiment already selected! Choose another experiment");
    }
}
function deselectExp(hash) {
    var index = selectedExperiments.indexOf(hash);
    if (index>=0) {
        selectedExperiments.splice(index, 1);
        selectedRows = selectedRows - getRows(hash);
        center.updateStatus(selectedExperiments);
    }
}
function getTitle(hash) {
    var title;
    for(var i=0;i<datasetIndex.length;i++) {
        if(hash==datasetIndex[i]["Hash"]) {
            title = datasetIndex[i]["Title"]
        }
    } 
    if(typeof title !== "undefined") {
        return title;
    } else {
        return "Experiment title not found!";
    }
}
function getRows(hash) {
    var rows = 0;
    for(var i=0;i<datasetIndex.length;i++) {
        if(hash==datasetIndex[i]["Hash"]) {
            rows = parseInt(datasetIndex[i]["Rows"]);
        }
    }
    if (typeof rows !== "undefined") {
        return rows;
    } else {
        return 0;
    }
}
// function to initialize layout with jquery calls
function initLayout() {
    $("body").layout({
        name: "main",
        west__size: "20%"
    });
}
// only call previously declared functions here, do NOT declare functions here
function init() {
    retrieveIndex();
    initLayout();
    west.init();
    center.init();
    console.log("MSWeb initialization complete");
}
$(window).on("load", init);
