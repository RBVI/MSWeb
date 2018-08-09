var west = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        $("#search").click(function(){
            fuzzySearch(datasetIndex, document.getElementById("userInput").value);
        });
        console.log("west.js loaded and initialized");
    }
    //declare functions here
    function fuzzySearch(list, search) {
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
        var fuse = new Fuse(list, options); // "list" is the item array
        if(search === ""){
            center.updateMultiselect(list);
        }else{
            searchResult = fuse.search(search);
            center.updateMultiselect(searchResult);
        }
    }
    return {
        init: init,
        fuzzySearch: fuzzySearch
    }
}();
