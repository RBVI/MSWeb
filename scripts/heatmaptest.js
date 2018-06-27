TESTER = document.getElementById('heatmaptest');
var data = [{
    x:[1,2,3,4,5,6],
    y:[1,2,3,4,5,6],
    z:[[0,6,12,18,24,30],[6,12,18,24,30,36],[12,18,24,30,36,42],[18,24,30,36,42,48],[24,30,36,42,48,54],[30,36,42,48,54,60]],
    type: 'heatmap'
}];
Plotly.plot(TESTER, data);