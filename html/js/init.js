// put JS code that needs to connect two layout elements together in here
// declare layout-transcending functions here
function removeOptions(selectbox) { // removes <option> tags from <select> tags 
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--) {
        selectbox.remove(i);
    }
}
function retrieveData(hash) {
    $.ajax({
        method: "GET",
        url: "/MSWeb/cgi-bin/retrieveJSON.py",
        data: { hash: hash },
        success: function(data){
            var jsonData = data;
        },
        error: alert("retrieval of JSON data failed!"),
        dataType: "json"
    })
}
// only call declared functions here, DO NOT declare functions in init() otherwise it will get really messy
function init() {
    $('body').layout({
        south__size: "50%",
        west__size: "25%"
    });
    west.init();
    center.init();
    south.init();
}
$(window).on("load", init);