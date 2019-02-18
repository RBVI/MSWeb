var west = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        $("#searchbutton").click(search);
        $(".expfilter").on("change", experimentFilter);
        console.log("west.js loaded and initialized")
    }
    function search() {
        fuzzy_search(filter_search(datasetIndex), $("#searchtext").val());
    }
    function filter_search(search_data) {
        // TODO: Limit search to experiments that already pass filters
        return search_data;
        var doc_names = ["title", "researcher", "uploadby", "updatedate",
                         "experimentdate", "experimenttype", "experimentcond"];
        var search_for = ["Title", "Researcher", "UploadBy", "UploadDate",
                          "ExperimentDate", "ExperimentType",
                          "ExperimentCondition"];
    }
    function fuzzy_search(search_data, value) {
        var options = {
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
                "Hash",
            ]
        };
        if (value === "") {
            alert("need to select all");
        } else {
            var fuse = new Fuse(search_data, options);
            var result = fuse.search(value);
            alert("need to select: " + result);
            for (var k in result[0])
                console.log(k + ': ' + result[0][k]);
        }
    }
    function experimentFilter(e) {
        console.log(e.target.name + ' ' + e.target.value);
    }
    return {
        init: init
    }
}();
