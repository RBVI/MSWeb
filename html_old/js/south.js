var south = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        console.log("south.js loaded and initialized");
    }
    //declare functions here
    function initReactChartEditor() {
        dataSources = {
            col1: [1, 2, 3],
            col2: [4, 3, 2],
            col3: [17, 13, 9]
        };
        reactChartEditor = ReactDOM.render(React.createElement(app.App.default, { dataSources: dataSources }), document.getElementById("south"));
    }
    return {
        init: init,
        initReactChartEditor: initReactChartEditor
    }
}();
