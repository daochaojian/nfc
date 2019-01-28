import React from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Linking,
  ActivityIndicator,
  NetInfo,
  Image,
  NativeModules,
  Platform,
  PermissionsAndroid,
  AsyncStorage,
} from 'react-native';
import { SafeAreaView, NavigationActions } from 'react-navigation';
import { WebView } from "react-native-webview";
import Permissions from 'react-native-permissions';
import NfcManager, { Ndef, NfcTech, NdefParser } from 'react-native-nfc-manager';
import TouchableWithFeedback from '../components/common/TouchableWithFeedback';
import Icon from '../components/common/Icon';
import netErr from '../images/errorNetwork.png';
import scan from '../images/nfc.png';

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
  },
  webView: {
    zIndex: 999,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 99,
  },
  tips: {
    alignItems: 'center',
    marginTop: 20,
  },
  image: {
    height: 220,
    width: 280,
  },
  scanImage: {
    height: 220,
    width: 220,
  },
  indecator: {
    zIndex: 9999,
    position: 'absolute',
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
    // backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsText: {
    fontSize: 14,
    marginTop: 15,
    color: '#000000',
  },
  text: {
    fontSize: 12,
    marginTop: 15,
  },
  touchProfile: {
    width: 40,
    height: 40,
    alignItems:'center',
    justifyContent:'center',
  },
});

class Home extends React.Component {
  static navigationOptions = ({ navigation}) => {
    const title = navigation.getParam('title', '');
    const isLogin = navigation.getParam('isLogin', false);
    const login = navigation.getParam('login', true);
    const onJump = navigation.getParam('onJump', () =>{});
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
      headerRight: (!login && isLogin &&
        <TouchableWithFeedback style={styles.touchProfile} onPress={onJump}>
          <Icon
            name="wheel"
            width="25"
            height="25"
            fill='#000000'
          />
        </TouchableWithFeedback>),
    };
  };

  webview = null;

  state = {
    url: '',
    myBody: '',
    netStatus: true,
    isLogin: false,
    cookie: '',
    fetching: true,
    latitude: 0,
    longitude: 0,
    first: false,
    ip: '',
    uri: '',
    title: '',
    key: '',
    loading: false,
    isBackButtonEnable: false,
    isForwardButtonEnable: false,
  };

  componentWillMount() {
    const { navigation } = this.props;
    this.retrieveCookie();
    this.retrieveStatus();
    const url = navigation.getParam('url', '');
    const login = navigation.getParam('login', false);
    const key = navigation.getParam('key', '');
    const latitude = navigation.getParam('latitude', 0);
    const longitude = navigation.getParam('longitude', 0);
    this.setState({
      url,
      login,
      key,
      latitude,
      longitude,
    });
    navigation.setParams({
      onJump: this.jumpToPro,
      login,
      key,
    });
  }

  componentWillUnmount() {
    const { navigation } = this.props;
    NfcManager.unregisterTagEvent();
    const setParamsAction = NavigationActions.setParams({
      params: { needRefresh: true },
      key: this.state.key,
    });
    navigation.dispatch(setParamsAction);
  }


  jumpToPro = () => {
    const { navigation } = this.props;
    const { key } = this.state;
    navigation.navigate('Settings', {
      url: 'https://oakandbarley.app.dmsj.network/my-account/edit-account',
      login: false,
      key,
    });
  }

  retrieveStatus = async () => {
    const { navigation } = this.props;
    try {
      const value = await AsyncStorage.getItem('isLogin');
      if (value !== null) {
        navigation.setParams({
          isLogin: JSON.parse(value).isLogin,
        });
        this.setState({
          isLogin: JSON.parse(value).isLogin,
        });
      }
      return value;
     } catch (error) {
      console.log(error);
       return null;
       // Error retrieving data
     }
     return null;
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

  storeData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Error saving data
    }
  };

  isSupported = () => {
    NfcManager.start({
      onSessionClosedIOS: () => {
        NfcManager.unregisterTagEvent();
      }
    })
    .then(supported => {
      console.log(supported);
      this.startNFC();
    }).catch(() => {
      Alert.alert(
        'info',
        'Your cell phone handset doesn\'t have the necessary hardware to support our software application',
        [
            { text: 'ok', onPress: () => {} },
        ],
      );
    });
  }

  startNFC = () => {
    const { navigation } = this.props;
    const { url } = this.state;
    NfcManager.registerTagEvent(tag => {
      if (tag.ndefMessage && tag.ndefMessage.length) {
        const text = this.parseUri(tag);
        if (text !== null) {
          if (this.state.login && this.state.first) {
            const params = {
              uid: this.getQueryByName(text, 'uid'),
            }
            this.webview.postMessage(JSON.stringify(params));
          } else {
            console.log('change url');
            this.setState({ url: text, first: true });
          }
          return ;
        }
      }
      Alert.alert(
        'Scan Failed',
        'Unsupported tag detected, please scan a DMSJ TAG',
        [
            { text: 'ok', onPress: () => {} },
        ],
      );
    }, 'Hold your device over the tag', false);
  }

  getQueryByName = (url, name) => {
    var reg = new RegExp('[?&]'+ name + '=([^&#]+)');
    var query = url.match(reg);
    return query ? query[1] : null;
  }

  parseUri = (tag) => {
    try {
        if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
            return Ndef.uri.decodePayload(tag.ndefMessage[0].payload);
        }
    } catch (e) {
        console.log(e);
    }
    return null;
  }

  goToNfcSetting = () => {
    if (Platform.OS === 'android') {
        NfcManager.goToNfcSetting()
          .then(result => {
              console.log('goToNfcSetting OK', result)
          })
          .catch(error => {
              console.warn('goToNfcSetting fail', error)
          });
    }
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

  handleLoadProgress = (e) => {
    if (e && e.nativeEvent) {
      if (e.nativeEvent.progress >= 1) {
        this.setState({ loading: false });
      }
    }
  }

  handleStart = () => {
    this.setState({ loading: true });
  }

  handleMessage = async (event) => {
    const { navigation } = this.props;
    const { url, key, login } = this.state;
    const data = JSON.parse(event.nativeEvent.data);
    console.log(event.nativeEvent.data);
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
        this.setState({
          cookie: cookieStr,
        });
        navigation.setParams({
          isLogin: data.isLogin,
          login: false,
        })
        const setParamsActions = NavigationActions.setParams({
          params: {
            isLogin: data.isLogin
          },
          key,
        });
        navigation.dispatch(setParamsActions);
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
    }
  }

  render() {
    const { navigation } = this.props;
    const { url, netStatus, fetching, loading, latitude, longitude, login, first, cookie } = this.state;
    console.log(this.state);
    return (
      <SafeAreaView style={styles.containerView}>
        {!netStatus && <View style={styles.error}>
          <Image source={netErr} style={styles.image} resizeMode="contain" />
          <Text style={styles.text}>connect error, please connect to internet first!</Text>
        </View>}
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
            // source={require('./test.html')}
            source={{
              uri: login ? 'https://oakandbarley.app.dmsj.network/' : url,
              // headers: cookie ?  { "cookie": cookie } : {}
            }}
            onLoadStart={this.handleStart}
            onMessage={this.handleMessage}
            thirdPartyCookiesEnabled
            onLoadProgress={this.handleLoadProgress}
            onNavigationStateChange={this.onNavigationStateChange}
          />
        }
      </SafeAreaView>
    );
  }
}

export default Home;
