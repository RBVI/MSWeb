var south = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        histogramTest();
        console.log("south.js loaded and initialized");
    }  
    //declare functions here 
    function histogramTest() {
        var y = [];
        for (var i=0;i<500;i++) {
            y[i] = Math.random();
        }
        var data = [{
            y: y,
            type: "histogram",
            marker: {
                color: 'blue',
                opacity: 0.8,
                line: {
                    color: "black",
                    width: 1
                }
            },
        }];
        Plotly.newPlot("plot1", data);
    }
    function heatmapTest() {
        var x = [];
        var y = [];
        var z = [];
    }
    return {
        init: init
    }
}();