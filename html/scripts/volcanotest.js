TESTER = document.getElementById('volcanotest'); 
var leftrightbound = {
    x:[1,1,-1,-1],
    y:[0,10,0,10],
    mode:'lines',
    type:'scatter'
};
var upperbound = {
    x:[-3,3],
    y:[5,5],
    mode:'lines',
    type:'scatter'
};
var layout = {
    title: 'Volcano Plot', 
    xaxis: {
        showgrid: false,
        title: 'log2(fold change)'
    },
    yaxis: {
        showgrid: true,
        title: '-log10(p value)'
    }
};
var data = [leftrightbound,upperbound];
Plotly.plot(TESTER, data, layout);