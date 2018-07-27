/*

class Welcome extends React.Component {
  render() {
    return React.createElement(
      "h1",
      null,
      "Hello, ", this.props.name);
  }
}

const element = React.createElement(Welcome, {name: "World"});

function init(){
ReactDOM.render(element, document.getElementById('root'));
}
$(document).ready(init);

*/


/*


function App() {
  return React.createElement(
    "ul",
    null,
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk1" },
        React.createElement("input", { type: "checkbox", name: "chk1", id: "chk1" }),
        "First"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk2" },
        React.createElement("input", { type: "checkbox", name: "chk2", id: "chk2" }),
        "Second"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk3" },
        React.createElement("input", { type: "checkbox", name: "chk3", id: "chk3" }),
        "Third"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk4" },
        React.createElement("input", { type: "checkbox", name: "chk4", id: "chk4" }),
        "Fourth"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk5" },
        React.createElement("input", { type: "checkbox", name: "chk5", id: "chk5" }),
        "Fifth"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk6" },
        React.createElement("input", { type: "checkbox", name: "chk6", id: "chk6" }),
        "Sixth"
      )
    ),
    React.createElement(
      "li",
      null,
      React.createElement(
        "label",
        { "for": "chk7" },
        React.createElement("input", { type: "checkbox", name: "chk7", id: "chk7" }),
        "Seventh"
      )
    )
  );
}





const element = React.createElement(App);



function init(){
ReactDOM.render(element, document.getElementById('root'));
}
$(document).ready(init);
*/



/*

function App() {
  return React.createElement(
    "h1",
    null,
    "Hello World!"
  );
}


const element = React.createElement(App);

function init(){
  ReactDOM.render(element, document.getElementById('root'));
}
$(document).ready(init);

*/
function App(){

return React.createElement("div", {className: "page"}, React.createElement(
    "div",
    { className: "wrap" },
    React.createElement("div", { className: "floatleft" },
    React.createElement("h1", null, "hello")),
    React.createElement("div", { className: "floatright" },
    React.createElement("h1", null, "hello2"))),
    React.createElement("div", {className: "floatbottom"}, React.createElement("h1", null, "hello3"))
);
}



const element = React.createElement(App);

function init(){
  ReactDOM.render(element, document.getElementById('root'));
}
$(document).ready(init);
