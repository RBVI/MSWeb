// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here

// only call declared functions here, DO NOT declare functions in init() otherwise it will get really messy
function init() {
    $('body').layout({
        south__size: "60%",
        west__size: "25%"
    });
    west.init();
    center.init();
    south.init();
    console.log("init.js loaded and initialized")
}
$(window).on("load", init);