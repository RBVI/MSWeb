TESTER = document.getElementById('heatmaptest');
var colors = [
  [0, "#f92525"],
  [0.5, "#fc9919"],
  [1, "#fcec19"]
]
var data = [{
    x:[1,2,3,4,5,6],
    y:[1,2,3,4,5,6],
    z:[[0,6,12,18,24,30],[6,12,18,24,30,36],[12,18,24,30,36,42],[18,24,30,36,42,48],[24,30,36,42,48,54],[30,36,42,48,54,60]],
    type: 'heatmap',
    colorscale: colors
}];
Plotly.plot(TESTER, data);