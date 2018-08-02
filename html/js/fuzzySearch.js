function fuzzySearch() {
    var options = {
        // id: "Hash"? returned result will be a list of the items' identifiers
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchLength: 1,
        keys: [
            "Title",
            "Researcher",
            "Upload",
            "Experiment",
            "Hash"
        ]
    };
    var fuse = new fuse(list, options); // "list" is the item array
    var result = fuse.search(userInput);
}

function retrieveMetaData() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(xhttp.readyState == 4 && xhttp.state == 200) {
            list = this.responseText;
        }
    }
    xhttp.open("GET", "/MSWeb/data/index.json", true);
    xhttp.send();
}

$(document).ready(function() {
    retrieveMetaData();
})