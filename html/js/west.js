var west = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        $(".expfilter").on("change", experimentFilter);
        console.log("west.js loaded and initialized")
    }
    function experimentFilter(e) {
        console.log(e.target.name + ' ' + e.target.value);
    }
    return {
        init: init
    }
}();
