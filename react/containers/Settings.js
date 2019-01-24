import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AsyncStorage,
} from 'react-native';
import { SafeAreaView, StackActions } from 'react-navigation';
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
});

export default class Settings extends React.Component {
  static navigationOptions = ({ navigation}) => {
    const title = navigation.getParam('title', '');
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

  storeData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Error saving data
    }
  };

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

  handleMessage = async (event) => {
    const { navigation } = this.props;
    const { url, key, login } = this.state;
    const data = JSON.parse(event.nativeEvent.data);
    console.log(event);
    if (data.isLogin) {
      this.storeData('isLogin', { isLogin: true});
      let cookieStr = '';
      Object.keys(data).forEach(k => {
        if (k !== 'isLogin') {
          cookieStr += k + '=' + data[k] + ';';
        }
      });
      try {
        await AsyncStorage.setItem('cookie', cookieStr);
        if (login) {
          navigation.navigate('Home', {
            isLogin: data.isLogin,
          });
        } else {
          navigation.setParams({
            isLogin: data.isLogin,
          })
          const setParamsAction = NavigationActions.setParams({
            params: {
              isLogin: data.isLogin
            },
            key,
          });
          navigation.dispatch(setParamsAction);
        }
      } catch (error) {
        console.log(error);
      }
    } else if (data.isLogin === false) {
      this.storeData('isLogin', { isLogin: false});
      try {
        await AsyncStorage.setItem('cookie', '');
      } catch (error) {
        console.log(error);
      }
      this.setState({
        cookie: '',
      });
      navigation.setParams({
        isLogin: data.isLogin,
      })
      const setParamsAction = NavigationActions.setParams({
        params: { isLogin: data.isLogin },
        key,
      });
      navigation.dispatch(setParamsAction);
      navigation.dispatch(StackActions.popToTop());
    }
  }

  handleEnd = () => {
    this.setState({
      loading: false,
    })
  }


  render() {
    const { navigation } = this.props;
    const { url, fetching, loading, cookie } = this.state;
    console.log(loading || fetching);
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
              headers: cookie ? {
                "cookie": `${cookie}`,
              }: {},
            }}
            onLoadStart={this.handleStart}
            onLoadEnd={this.handleEnd}
            onMessage={this.handleMessage}
            thirdPartyCookiesEnabled
            onNavigationStateChange={this.onNavigationStateChange}
          />
        }
      </SafeAreaView>
    );
  }
}
