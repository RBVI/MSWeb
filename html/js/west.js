var west = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        console.log("west.js loaded and initialized")
    }
    return {
        init: init
    }
}();