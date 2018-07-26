TESTER = document.getElementById('bartest');
var data = [{
    x:['x1','x2','x3','x4','x5','x6'],
    y:[2,3,6,5,4,2],
    type:'bar'
}];
Plotly.plot(TESTER, data);