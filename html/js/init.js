// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
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
}
// only call declared functions here, DO NOT declare functions in init() otherwise it will get really messy
function init() {
    initLayout();
    west.init();
    center.init();
    south.init();
    console.log("init.js loaded and initialized")
}
$(window).on("load", init);