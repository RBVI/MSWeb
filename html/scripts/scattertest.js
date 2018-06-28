TESTER = document.getElementById('scattertest');
var trace1 = {
    x:[1,2,3,4,5,6],
    y:[3,5,2,6,4,8],
    mode:'lines+markers',
    type:'scatter',
    colorscale: [[0,'#ff0000'],[0.5,'#ff0000'],[0.5, '#ff6e00'],[1.0,'#ff6e00']]
};
var trace2 = {
    x:[1,2,3,4,5,6],
    y:[2,8,4,7,3,6],
    mode:'lines',
    type:'scatter'
};
var trace3 = {
    x:[1,2,3,4,5,6],
    y:[2,4,2,5,7,6],
    mode:'markers',
    type:'scatter'
};
var data = [trace1,trace2,trace3];
Plotly.plot(TESTER, data);