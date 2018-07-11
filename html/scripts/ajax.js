// used to populate <select> tag with <option> tags containing file names of all files ending in .txt in /MSWeb/data/
function loadList() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            select = document.getElementById("datalist");
            text = this.responseText;
            items = text.split("\n");
            for(var i=0; i<(items.length);i++){
                var opt = document.createElement("option");
                opt.innerHTML = items[i];
                select.appendChild(opt);
            }
        }
    };
    xhttp.open("GET", "/MSWeb/cgi-bin/index.py", true);
    xhttp.send();
};
// used to load data from two columns of phosphoMSViewerDataSet.txt, specified in the get request parameters with data1 and data2
function loadData() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            select = document.getElementById("dataload");
            data = this.responseText.split("\n");
            var table = document.createElement("table");
            for(var i=0;i<(data.length-1);i++){
                line = data[i].split("|");
                var tablerow = document.createElement("tr");
                if(i==0){
                    for(var j=0;j<(line.length);j++){
                        var tableheader = document.createElement("th");
                        tableheader.innerHTML = line[j];
                        tablerow.appendChild(tableheader);
                    }
                }else{
                    for(var j=0;j<(line.length);j++){
                        var tabledata = document.createElement("td");
                        tabledata.innerHTML = line[j];
                        tablerow.appendChild(tabledata);
                    }
                }
                table.appendChild(tablerow);
            }
            select.appendChild(table);
        }
    };
    xhttp.open("GET", "/MSWeb/cgi-bin/loadData.py?data1=m/z&data2=ppm", true);
    xhttp.send();
};
// used to test retrieval of data from server with loadData.py
function cgiTest() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            select = document.getElementById("cgitest");
            data = this.responseText.split("\n");
            for(var i=0;i<(data.length);i++){
                var p = document.createElement("p");
                p.innerHTML = data[i];
                select.appendChild(p);
            }
        }
    };
    xhttp.open("GET","/MSWeb/cgi-bin/loadData.py?data1=m/z&data2=ppm", true);
    xhttp.send();
};