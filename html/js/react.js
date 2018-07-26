const e = React.createElement; // creates an alias of React.createElement for easier writing of code
// begin react component declaration

<<<<<<< HEAD:html/scripts/react.js

=======
class TestTable extends React.Component {
    render() {
        var tableheader = e("tr", null, e("th",null,"Test1"), e("th",null,"Test2"));
        var tablerow = e("tr", null, e("td", null, "1"), e("td", null, "2"));
        return (
            e("table", null, tableheader, tablerow)
        );
    }
}
>>>>>>> develop:html/js/react.js
// end react component declaration
class App extends React.Component {
    render() {
        return ( 
           // implementation of components goes here
           e(TestTable)
        );
    }
}
ReactDOM.render(
    e(App),
    document.getElementById("root")
);
