import React from 'react';
import {
  View,
  Image,
} from 'react-native';
import { createStackNavigator } from 'react-navigation';
import Home from '../containers/Home';
import Web from '../containers/Web';
import ScanDetail from '../containers/ScanDetail';
import Settings from '../containers/Settings';

const StackRouteConfigs = {
  // Web: { screen: Web },
  Home: { screen: Home },
  ScanDetail: { screen: ScanDetail },
  Web: { screen: Web },
  Settings: { screen: Settings },
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
