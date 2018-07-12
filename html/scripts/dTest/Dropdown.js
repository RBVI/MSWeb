class Dropdown extends React.Component {
    constructor(props) {
      super(props)
         this.state = {
          displayMenu: false,
        };
     this.showDropdownMenu = this.showDropdownMenu.bind(this);
     this.hideDropdownMenu = this.hideDropdownMenu.bind(this);
     }

    showDropdownMenu(event) {
      event.preventDefault();
      this.setState({ displayMenu: true }, () => {
      document.addEventListener('click', this.hideDropdownMenu);
      });
    }

    hideDropdownMenu() {
      this.setState({ displayMenu: false }, () => {
        document.removeEventListener('click', this.hideDropdownMenu);
      });
    }

    render() {
      return (
        <div className="Drop">
          <h1>MSWeb</h1>
          <div className="dropdown">
    	        <div className="button" onClick={this.showDropdownMenu}> Select Data</div>
                {
                  this.state.displayMenu ? (
                    <ul>
              		   <li><a className="active" href="#Create Page">Create Page</a></li>
                     <li><a href="redirect to page w/ plotly and data table">Data Set 1</a></li>
                    </ul>
              	  ):
                    ( null )
                }
    	      </div>
          </div>
      );
    }
}

export default Dropdown;
