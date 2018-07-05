const e = React.createElement;
function Test() {
    return e('h1',null,'test');
}
ReactDOM.render(
    e(Test), 
    document.getElementById("root")
);