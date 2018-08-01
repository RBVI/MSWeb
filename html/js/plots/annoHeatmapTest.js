TESTER = document.getElementById('annoHeatmapTest');
var colors = [
  [0, "#f92525"],
  [0.5, "#fc9919"],
  [1, "#fcec19"]
]
var xEle = ['A', 'B', 'C', 'D', 'E'];

var yEle = ['W', 'X', 'Y', 'Z'];

var zEle = [
  [0,6,12,18,24],
  [6,12,18,24,30],
  [12,18,24,30,36],
  [18,24,30,36,42]
];


var data = [{
  x: xEle,
  y: yEle,
  z: zEle,
  type: 'heatmap',
  colorscale: colors,
}];

var layout = {
  title: 'title name',
  annotations: [],
  xaxis: {
    title: 'x-axis name'
  },
  yaxis: {
    title: 'y-axis name'
  }
};

for ( var i = 0; i < yEle.length; i++ ) {
  for ( var j = 0; j < xEle.length; j++ ) {
    var currentEle = zEle[i][j];
    if (currentEle != 0.0) {
      var textColor = 'white';
    }else{
      var textColor = 'black';
    }
    var result = {
      xref: 'x1',
      yref: 'y1',
      x: xEle[j],
      y: yEle[i],
      text: zEle[i][j],
      font: {
        family: 'Arial',
        size: 12,
        color: textColor
      },
      showarrow: false,
    };
    layout.annotations.push(result);
  }
}

Plotly.plot(TESTER, data, layout);
