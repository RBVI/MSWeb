import Field from './Field';
import React, {Component} from 'react';

export default class Info extends Component {
  render() {
    return (
      <Field {...this.props}>
        <div className="js-test-info">{this.props.children}</div>
      </Field>
    );
  }
}

Info.plotly_editor_traits = {
  no_visibility_forcing: true,
};

Info.propTypes = {
  ...Field.propTypes,
};
