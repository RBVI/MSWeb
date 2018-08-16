// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
var datasetIndex = [];
var searchResult = [];
var downloadList = [];
function removeOptions(selectbox) { // removes <option> tags from <select> tags
    if (selectbox.id == "data-selection"){
        $("#data-selection").empty();
        $("#data-selection").multiSelect("refresh");
    }else{
        var i;
        for(i=selectbox.options.length-1;i>=0;i--){
            selectbox.remove(i);
        }
    }
}
function retrieveIndex(){
    $.ajaxSetup({async: false});
    $.getJSON( "/MSWeb/cgi-bin/retrieveIndex.py", function(data){datasetIndex = data});
    $.ajaxSetup({async: true});
}
// function to call the necessary jquery calls to initialize the layout
function initLayout() {
    $('body').layout({
        name: "main",
        south__size: "60%",
        west__size: "25%",
        south__onresize: function() {
            Plotly.Plots.resize(document.getElementById("south-west-plot"));
            Plotly.Plots.resize(document.getElementById("south-center"));
            Plotly.Plots.resize(document.getElementById("south-east"));}
    });
    $("#south").layout({
        name: "south",
        center__paneSelector: "#south-center",
        west__paneSelector: "#south-west",
        east__paneSelector: "#south-east",
        west__resizable: false,
        center__resizable: false,
        east__resizable: false,
        west__size: "33%",
        east__size: "33%"
    });
    $(".controlgroup").controlgroup();
    $(".controlgroup-vert").controlgroup({"direction": "vertical"});
    $("#download").click(function(){center.downloadRaw();});
    $('#data-selection').multiSelect({
        cssClass: "data-selector",
        afterSelect: function(hash){
            downloadList.push(hash[0]);
        },
        afterDeselect: function(hash) {
            var index = downloadList.indexOf(hash[0]);
            downloadList.splice(index, 1);
        }
    });
    $(document).tooltip();
}
// only call declared functions here, DO NOT declare functions in init() otherwise it will get really messy
function init() {
    retrieveIndex();
    initLayout();
    west.init();
    center.init();
    south.init();
    console.log("init.js loaded and initialized")
}
$(window).on("load", init);
