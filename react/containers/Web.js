import React from 'react';
import {
  WebView,
  Text,
  StyleSheet,
  Dimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    // flex: 1,
  },
});

class Web extends React.Component {
  static navigationOptions =  {
    header: null,
  };

  webview = null;

  state = {
    url: '',
  }

  componentWillMount() {
    const { navigation } = this.props;
    const { url } = navigation.state && navigation.state.params || null;
    if (url) {
      this.setState({
        url,
      })
    }
  }

  render() {
    const { navigation } = this.props;
    const { url } = this.state;
    console.log(url);
    return (
      <View style={styles.containerView}>
      </View>
    );
  }
}

export default Web;
