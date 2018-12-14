import React from 'react';
import {
  View,
  Image,
} from 'react-native';
import { createStackNavigator, createBottomTabNavigator, createSwitchNavigator } from 'react-navigation';
import Home from '../../App';
import Web from '../containers/Web';

const StackAppNavigator = createStackNavigator(StackAppConfigs, StackAppConfig);

const StackRouteConfigs = {
  Home: { screen: Home },
  Web: { screen: Web },
};

const StackConfig = {
  // navigationOptions,
  initialRouteName: 'Home',
  headerMode: 'none',
  cardStyle: {
    backgroundColor: colors.white,
  },
};

const StackNavigator = createStackNavigator(StackRouteConfigs, StackConfig);

export default StackNavigator;
