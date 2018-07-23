// used to populate <select> tag with <option> tags containing file names of all files ending in .txt in /MSWeb/data/
function loadList() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            select = document.getElementById("datalist");
            text = this.responseText;
            items = text.split("|");
            for(var i=0; i<(items.length);i++){
                var opt = document.createElement("option");
                opt.innerHTML = items[i];
                opt.value = items[i];
                select.appendChild(opt);
            }
            loadHeader(document.getElementById("datalist"));
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
            status.value = 50;
            select = document.getElementById("dataload");
            data = this.responseText.split("\n");
            status.value = 75;
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
            select.innerHTML = "";
            select.appendChild(table);
            status.value = 100;
        }
    };
    var dataset = document.getElementById("datalist").value;
    var data1 = document.getElementById("header1").value;
    var data2 = document.getElementById("header2").value;
    var status = document.getElementById("status");
    status.value = 25;
    xhttp.open("GET", "/MSWeb/cgi-bin/loadData.py?data="+dataset+"&data1="+data1+"&data2="+data2, true);
    xhttp.send();
};
function loadHeader(selectObj) {
    var xhttp = new XMLHttpRequest();
    var value = selectObj.value;
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            select1 = document.getElementById("header1");
            select2 = document.getElementById("header2");
            removeOptions(select1);
            removeOptions(select2);
            headers = this.responseText.split("|");
            for(var i=0;i<(headers.length);i++) {
                var opt = document.createElement("option");
                var opt2 = document.createElement("option");
                opt.innerHTML = headers[i];
                opt.value = headers[i];
                opt2.innerHTML = headers[i];
                opt2.value = headers[i];
                select1.appendChild(opt);
                select2.appendChild(opt2);
            }
        }
    }
    xhttp.open("GET", ("/MSWeb/cgi-bin/loadHeader.py?data="+value), true);
    xhttp.send();
}
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
    xhttp.open("GET","/MSWeb/cgi-bin/loadData.py?data1=m/z&data2=ppm&data=phosphoMSViewerDataSet.txt", true);
    xhttp.send();
};
function removeOptions(selectbox) {
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--) {
        selectbox.remove(i);
    }
}