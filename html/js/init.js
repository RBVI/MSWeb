// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
var datasetIndex = [];
function retrieveIndex(){
    $.ajaxSetup({async: false});
    $.getJSON( "/MSWeb/cgi-bin/retrieveIndex.py", function(data){datasetIndex = data});
    $.ajaxSetup({async: true});
}
// function to initialize layout with jquery calls
function initLayout() {
    $("body").layout({
        name: "main",
        west__size: "20%"
    });
    $("#tabs").tabs();
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