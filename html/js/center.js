var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        $('#data-selection').multiSelect({
            cssClass: "data-selector"
        });
        updateMultiselect(datasetIndex);
        console.log("center.js loaded and initialized");
    }
    //declare functions here
    function updateMultiselect(dataset){
      var selectbox = document.getElementById('data-selection');
      removeOptions(selectbox);
      for(var i=0; i<dataset.length;i++) {
        $("#data-selection").multiSelect("addOption", {value: dataset[i].Hash, text: dataset[i].Title});
      }
      console.log("Data selector updated")
    }
    return {
        init: init,
        updateMultiselect: updateMultiselect
    }
}();
