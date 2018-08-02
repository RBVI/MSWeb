var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        $('#my-select').multiSelect();
        console.log("center.js loaded and initialized");
    }
    //declare functions here
    return {
        init: init
    }
}();
