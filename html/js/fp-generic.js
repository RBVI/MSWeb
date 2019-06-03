// vim: set expandtab shiftwidth=4 softtabstop=4:

generic = (function(){

    function show_raw(md, stats, table_id, container_id) {
        var table_sel = "#" + table_id;
        $(table_sel).bootgrid("destroy");
        $(table_sel).remove();
        var table = $("<table/>", { "id": table_id }).appendTo("#" + container_id);
        var htr = $("<tr/>");
        htr.append($("<th/>").text("Unable to display generic data set"));
        table.append($("<thead/>").append(htr))
             .append($("<tbody/>"));
    }

    return {
        show_raw: show_raw,
    };
})();
