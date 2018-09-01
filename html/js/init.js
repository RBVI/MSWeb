// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
var datasetIndex = [];
var metadataKeys = ["Title", "Researcher", "Uploaded By", "Uploaded On", "Experiment Type", "Experiment Date", "Experiment Conditions"]
var selectedExperiments = [];
function retrieveIndex(){
    $.ajaxSetup({async: false});
    $.getJSON( "/MSWeb/cgi-bin/retrieveIndex.py", function(data){datasetIndex = data});
    $.ajaxSetup({async: true});
}
function selectExp(hash) {
    if(selectedExperiments.indexOf(hash)<0) {
        selectedExperiments.push(hash);
        center.updateSelected(selectedExperiments);
    } else {
        alert("Experiment already selected! Choose another experiment");
    }
}
function deselectExp(hash) {
    var index = selectedExperiments.indexOf(hash[0]);
    selectedExperiments.splice(index, 1);
    center.updateSelected(selectedExperiments);
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
// function to initialize layout with jquery calls
function initLayout() {
    $("body").layout({
        name: "main",
        west__size: "20%"
    });
    $("#tabs").tabs();
    $(".msweb-ctrlgrp").controlgroup();
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