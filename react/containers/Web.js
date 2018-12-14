import React from 'react';
import {
  WebView,
} from 'react-native';
import { SafeAreaView, Header } from 'react-navigation';


class Index extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { title } = navigation.state.params;
    return (
      {
        headerTitle: title,
      }
    );
  }

  render() {
    const { navigation } = this.props;
    return (
      <SafeAreaView style={styles.containView}>

      </SafeAreaView>
    );
  }
}

export default Index;
