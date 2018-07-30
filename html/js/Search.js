const e = React.createElement;

function searchingFor(term) {
    return function (x) {
      return x.first.toLowerCase().includes(term.toLowerCase()) ||
       x.last.toLowerCase().includes(term.toLowerCase()) || 
       x.birth.toLowerCase().includes(term.toLowerCase()) ||
        !term;
    };
  }
  
  class Search extends Component {
    constructor(props) {
      super(props);
      this.state = {
        people: people,
        term: ''
      };
      this.searchHandler = this.searchHandler.bind(this);
    }
  
    searchHandler(event) {
      this.setState({ term: event.target.value });
    }
  
    render() {
      const { term, dataList } = this.state;
      return e(
        "div",
        { className: "App" },
        e(
          "form",
          null,
          e("input", {
            type: "text",
            onChange: this.searchHandler,
            value: term
          }),
          e("input", {
            type: "submit",
            value: "Search" })
        )
        /* { map creates new array with filtered results */
        // dataList.filter(searchingFor(term)).map(dataSet => e(
        //   "div",
        //   {
        //     className: "filtered_list"
        //     // set key to column number?
        //     , key: dataSet.id },
        //   e(
        //     "h1",
        //     null,
        //     dataSet.first
        //   ),
        //  e(
        //     "h1",
        //     null,
        //     dataSet.last
        //   ),
        //   e(
        //     "h3",
        //     null,
        //     dataSet.upload
        //   )
        // ))
      );
    }
  }