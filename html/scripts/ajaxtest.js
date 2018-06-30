function loadList() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            select = document.getElementById("datalist");
            text = this.responseText;
            items = text.split("\n");
            for(var i=0; i<(items.length-1);i++){
                var opt = document.createElement("option");
                opt.innerHTML = items[i];
                select.appendChild(opt);
            }
        }
    };
    xhttp.open("GET", "/MSWeb/cgi-bin/index.py", true);
    xhttp.send();
}