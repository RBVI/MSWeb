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
