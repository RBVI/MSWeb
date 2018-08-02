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
        method: "POST",
        contentType: "text/plain; charset=UTF-8",
        url: "/MSWeb/cgi-bin/retrieveJSON.py",
        data: { hash: hash },
        dataType: "json",
        success: function(data){
            var jsonData = data;
        },
        error: alert("retrieval of JSON data failed!")
    })
}
function retrieveDataXHR() {
    var xhttp = new XMLHttpRequest;
    xhttp.onreadystatechane = function() {
        if(this.readyState ==4 && this.status == 200) {
            alert("JSON retrieval successful");
        }
    };
    xhttp.open("GET", "/MSWeb/cgi-bin/retrieveJSON.py?hash=7d33054904636bcc644b14224e2386cd5f9d220dc056acfd723b660a9747ee02")
    xhttp.send();
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