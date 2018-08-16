var center = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        updateMultiselect(datasetIndex);
        console.log("center.js loaded and initialized");
    }
    //declare functions here
    function updateMultiselect(dataset){
      var selectbox = document.getElementById('data-selection');
      removeOptions(selectbox);
      for(var i=0; i<dataset.length;i++) {
        $("#data-selection").multiSelect("addOption", {value: dataset[i].Hash, text: dataset[i].Title});
        $("#data-selection").children("option").each(function(i){
            $(this).attr("title",
            "Researcher: " + dataset[i].Researcher + "\n" +
            "Uploaded By: " + dataset[i].Upload[0] + "\n" +
            "Uploaded Date: " + dataset[i].Upload[1] + "\n" +
            "Experiment Date: " + dataset[i].Experiment[0] + "\n" +
            "Experiment Type: " + dataset[i].Experiment[1] + "\n" +
            "Experiment Conditions: " + dataset[i].Experiment[2]

          );
        })
      }
      $("#data-selection").multiSelect("refresh");
      console.log("Data selector updated")
    }
    function downloadRaw() {
        if(downloadList.length == 1){
            window.open("/MSWeb/cgi-bin/downloadData.py?hash="+downloadList[0]);
        }else if(downloadList.length > 1){
            var url = "/MSWeb/cgi-bin/downloadData.py?";
            for(var i=0;i<downloadList.length;i++){
                url += "hash=";
                url += downloadList[i];
                url += "&";
            }
            window.open(url);
        }else{
            alert("Cannot download - Select one or more datasets and try again!");
        }
    }
    return {
        init: init,
        updateMultiselect: updateMultiselect,
        downloadRaw: downloadRaw
    }
}();
