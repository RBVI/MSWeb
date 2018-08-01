var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        console.log("center.js loaded and initialized");

          $( "#number" ).multilineSelectmenu()
      .multilineSelectmenu( "menuWidget" ).addClass( "overflow" );


    }
    //declare functions here
    return {
        init: init
    }
}();
