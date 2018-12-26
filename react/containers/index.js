// import { observer } from 'mobx-react/native';
import React, { Component } from 'react';
import AppNavigator from '../navigators';
import { createAppContainer } from 'react-navigation';

const AppContainer = createAppContainer(AppNavigator);

export default class App extends Component {
  render() {
    return (
      <AppContainer
        ref={nav => {
          this.navigator = nav;
        }}
      />
    );
  }
}
