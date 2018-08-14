var west = function() {
    // put code in init() if you need it to run at runtime
    // call previously declared functions, do not declare functions in init()
    function init() {
        $("#search").click(function(){
            var toSearch = filterSearch(datasetIndex);
            fuzzySearch(toSearch, document.getElementById("userInput").value);
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

    function filterList(tempData, searchFor, searchWith){
      var data = [];
      if(searchFor === "Title"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Title.toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }
      else if(searchFor === "Researcher"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Researcher.toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }
      else if(searchFor === "UploadBy"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Upload[0].toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }
      else if(searchFor === "UploadDate"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Upload[1].toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }
      else if(searchFor === "ExperimentDate"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Experiment[0].toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }
      else if(searchFor === "ExperimentType"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Experiment[1].toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }
      else if(searchFor === "ExperimentConditions"){
        for(var i = 0; i < tempData.length; i++){
          if(tempData[i].Experiment[2].toUpperCase().includes(searchWith.toUpperCase())){
            data.push(tempData[i]);
          }
        }
      }

      return data;
    }

    function filterSearch(tempData){
      var data = tempData;


      doc = document.getElementById("title");
      if (doc && doc.value) {
        data = filterList(data, "Title", doc.value)
      }

      doc = document.getElementById("researcher");
      if (doc && doc.value) {
        data = filterList(data, "Researcher", doc.value)
      }

      doc = document.getElementById("uploadby");
      if (doc && doc.value) {
        data = filterList(data, "UploadBy", doc.value)
      }

      doc = document.getElementById("uploaddate");
      if (doc && doc.value) {
        data = filterList(data, "UploadDate", doc.value)
      }

      doc = document.getElementById("experimentdate");
      if (doc && doc.value) {
        data = filterList(data, "ExperimentDate", doc.value)
      }

      doc = document.getElementById("experimenttype");
      if (doc && doc.value) {
        data = filterList(data, "ExperimentType", doc.value)
      }

      doc = document.getElementById("experimentcond");
      if (doc && doc.value) {
        data = filterList(data, "ExperimentConditions", doc.value)
      }

      return data;

    }
    return {
        init: init,
        fuzzySearch: fuzzySearch,
        filterList: filterList,
        filterSearch: filterSearch
    }
}();
