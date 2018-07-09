class Greeting extends React.Component{
  render(){
    return React.createElement("p", null, "Hello World");
  }

  ReactDOM.render(
    React.createElement(Greeting),
    document.getElementById('root')
  );

}
