import React from 'react';
import { Provider } from 'mobx-react';
import Container from './containers';

export default class App extends React.PureComponent {
  render() {
    return (
      <Provider >
        <Container />
      </Provider>
    );
  }
}
