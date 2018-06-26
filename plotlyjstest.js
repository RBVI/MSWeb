TESTER = document.getElementById('tester');
var trace1 = {
    x: [1, 2, 3, 4],
    y: [10, 15, 13, 17],
    mode: 'markers',
    type: 'scatter'
  };

var data = [trace1]
Plotly.plot(TESTER, data);