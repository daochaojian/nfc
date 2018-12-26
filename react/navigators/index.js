import React from 'react';
import {
  View,
  Image,
} from 'react-native';
import { createStackNavigator } from 'react-navigation';
import Home from '../containers/Home';
import Web from '../containers/Web';

const StackRouteConfigs = {
  // Web: { screen: Web },
  Home: { screen: Home },
  Web: { screen: Web },
};

// const StackConfig = {
//   // navigationOptions,
//   initialRouteName: 'Home',
//   cardStyle: {
//     backgroundColor: colors.white,
//   },
// };

const StackNavigator = createStackNavigator(StackRouteConfigs);

export default StackNavigator;
