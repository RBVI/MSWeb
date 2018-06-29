function loadList() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("datalist").innerHTMl = this.responseText;
        }
    };
    xhttp.open("GET", "/MSWeb/cgi-bin/index.py", true);
    xhttp.send();
}