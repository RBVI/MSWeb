// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
window.onresize = function() {
    var plot1 = document.getElementById("plot1");
    Plotly.Plots.resize(plot1);
}
// only call declared functions here, DO NOT declare functions in init() otherwise it will get really messy
function init() {
    $('body').layout({
        south__size: "60%",
        west__size: "25%",
        west__onresize: function() {
            var plot1 = document.getElementById("plot1");
            Plotly.Plots.resize(plot1);
        }
    });
    west.init();
    center.init();
    south.init();
    console.log("init.js loaded and initialized")
}
$(window).on("load", init);