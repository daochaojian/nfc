import React from 'react';
import ReactPropTypes from 'prop-types';
import { TouchableNativeFeedback, View, Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    borderColor: '#ffffff',
  },
});
// const pressColor = 'rgba(0, 0, 0, .32)';
// function if (Platform['Version'] >= 21) {
//   background = TouchableNativeFeedback.Ripple(props.backgroundColor);
// } else {
//   background = TouchableNativeFeedback.SelectableBackground();
// }
/* eslint-disable dot-notation */
const background = Platform['Version'] >= 21
  ? TouchableNativeFeedback.SelectableBackgroundBorderless()
  : TouchableNativeFeedback.SelectableBackground();

const TouchableWithFeedback = ({ children, ...rest }) => (
  <View style={styles.container}>
    <TouchableNativeFeedback
      {...rest}
      background={background}
    >
      <View {...rest}>
        {children}
      </View>
    </TouchableNativeFeedback>
  </View>
);

TouchableWithFeedback.propTypes = {
  children: ReactPropTypes.node.isRequired,
};

export default TouchableWithFeedback;
