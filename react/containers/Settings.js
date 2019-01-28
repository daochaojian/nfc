import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AsyncStorage,
} from 'react-native';
import { SafeAreaView, StackActions, NavigationActions } from 'react-navigation';
import TouchableWithFeedback from '../components/common/TouchableWithFeedback';
import Icon from '../components/common/Icon';
import { WebView } from "react-native-webview";

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
  },
  indecator: {
    zIndex: 9999,
    position: 'absolute',
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    zIndex: 999,
  },
  touchProfile: {
    width: 40,
    height: 40,
    alignItems:'center',
    justifyContent:'center',
  },
});

class Settings extends React.Component {
  static navigationOptions = ({ navigation}) => {
    const title = navigation.getParam('title', '');
    const loading = navigation.getParam('loading', true);
    const onJump = navigation.getParam('logOut', null);
    return {
      headerTitle: title,
      headerBackTitle: null,
      headerTitleStyle: {
        color: '#000000',
      },
      headerBackTitleStyle: {
        color: '#000000',
        backgroundColor: '#000000',
      },
      headerTintColor: '#000000',
      headerRight: (!loading &&
        <TouchableWithFeedback
          style={styles.touchProfile}
          onPress={onJump}
        >
          <Icon
            name="logOut"
            width="20"
            height="20"
            fill='#000000'
          />
        </TouchableWithFeedback>),
    };
  };

  webview = null;

  state = {
    url: '',
    cookie: '',
    key: '',
    loading: false,
    fetching: false,
  };

  componentWillMount() {
    const { navigation } = this.props;
    this.retrieveCookie();
    const url = navigation.getParam('url', '');
    const login = navigation.getParam('login', false);
    const key = navigation.getParam('key', '');
    this.setState({
      url,
      login,
      key,
    });
  }

  onLogOut = async () => {
    const { navigation } = this.props;
    const { key } = this.state;
    console.log(key);
    try {
      await AsyncStorage.setItem('isLogin', JSON.stringify({ isLogin: false}));
      await AsyncStorage.setItem('cookie', '');
      // const script = 'var list = document.getElementsByClassName("button");Array.prototype.forEach.call(list, function (obj) {if (obj.tagName === "A") {obj.click();} });';
      const localScript = 'goToLogout();';
      if (this.webview) {
        this.webview.injectJavaScript(localScript);
      }
      setTimeout(() => {
        const setParamsAction = NavigationActions.setParams({
          params: { isLogin: false },
          key,
        });
        navigation.dispatch(setParamsAction);
        const popAction = StackActions.pop({
          n: 2,
        });
        navigation.dispatch(popAction);
      }, 1000);
    } catch (error) {
      // Error saving data
    }
  }



  retrieveCookie = async () => {
    try {
      const value = await AsyncStorage.getItem('cookie');
      console.log("cookie = "+ value);
      if (value !== null) {
        this.setState({
          cookie: value,
          fetching: false,
        });
      } else {
        this.setState({
          fetching: false,
        });
      }
     } catch (error) {
      this.setState({
        fetching: false,
      });
     }
  }

  handleStart = (navState) => {
    this.setState({ loading: true });
  }

  onNavigationStateChange = (navState) => {
    const { navigation } = this.props;
    const { url } = this.state;
    console.log(navState);
    if (navState.title && navState.title !== '') {
      navigation.setParams({
        title: navState.title,
      });
    }
    this.setState({
      uri: navState.url,
      title: navState.title,
      loading: navState.loading,
      isBackButtonEnable: navState.canGoBack,
      isForwardButtonEnable: navState.canGoForward,
    });
  }

  handleEnd = () => {
    const { navigation } = this.props;
    navigation.setParams({
      logOut: this.onLogOut,
      loading: false,
    });
    this.setState({
      loading: false,
    })
  }

  handleShouldStart = (navState) => {
    console.log(navState);
    return true;
  }

  render() {
    const { navigation } = this.props;
    const { url, fetching, loading, cookie } = this.state;
    return (
      <SafeAreaView style={styles.containerView}>
        {(loading || fetching) &&
          <View style={styles.indecator}>
              <ActivityIndicator
                animating
                color="#1BAF8F"
                size="large"
              />
            </View>
          }
        {url && !fetching &&
        <WebView
            style={styles.webView}
            javaScriptEnabled
            useWebKit
            geolocationEnabled
            originWhitelist={['*']}
            ref={(ref) => this.webview = ref}
            source={{
              uri: url,
              // headers: cookie ? {
              //   "cookie": `${cookie}`,
              // }: {},
            }}
            onLoadStart={this.handleStart}
            onLoadEnd={this.handleEnd}
            onShouldStartLoadWithRequest={this.handleShouldStart}
            thirdPartyCookiesEnabled
            onNavigationStateChange={this.onNavigationStateChange}
          />
        }
      </SafeAreaView>
    );
  }
}

export default Settings;
