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
import netErr from '../images/errorNetwork.png';
import scan from '../images/nfc.png';

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
  },
  touch: {
    marginHorizontal: 50,
    marginTop: 15,
    borderRadius: 20,
    flexDirection: 'row',
    height: 45,
    backgroundColor: '#1BAF8F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  touchText: {
    fontSize: 14,
    color: '#ffffff',
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
});

class Home extends React.Component {
  static navigationOptions =  {
    headerTitle: '',
  };

  webview = null;

  state = {
    url: '',
    netStatus: true,
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
    console.log('scan detail');
    this.retrieveCookie();
    const url = navigation.getParam('url', '');
    const key = navigation.getParam('key', '');
    const latitude = navigation.getParam('latitude', 0);
    const longitude = navigation.getParam('longitude', 0);
    this.setState({
      url: `${url}&latitude=${latitude}&longitude=${longitude}`,
      key,
      latitude,
      longitude,
    });
    this.isSupported();
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
        'your device don\'t support NFC or don\'t have permission, please check!',
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
          const params = {
            uid: this.getQueryByName(text, 'uid'),
          }
          this.webview.postMessage(JSON.stringify(params));
          return ;
        }
      }
      Alert.alert(
        'failed',
        'unsupport tag, please check your tag!',
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
    // if (navState.url === url) {
    //   this.setState({
    //     url: `${navState.url}`,
    //     title: navState.title,
    //     loading: navState.loading,
    //     isBackButtonEnable: navState.canGoBack,
    //     isForwardButtonEnable: navState.canGoForward,
    //   });
    //   return ;
    // }
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

  handleStart = (navState) => {
    console.log('here');
    this.setState({ loading: true });
  }

  handleMessage = async (event) => {
    const { navigation } = this.props;
    const { url } = this.state;
    const data = JSON.parse(event.nativeEvent.data);
    if (data.isLogin) {
      this.storeData('isLogin', { isLogin: true});
      let cookieStr = '';
      Object.keys(data).forEach(key => {
        if (key !== 'isLogin') {
          cookieStr += key + '=' + data[key] + ';';
        }
      });
      try {
        await AsyncStorage.setItem('cookie', cookieStr);
        navigation.navigate('Home', {
          isLogin: data.isLogin,
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  refersh = () => {
    if (this.webview) {
      this.webview.reload();
    }
  }

  render() {
    const { navigation } = this.props;
    const { url, netStatus, fetching, loading, latitude, longitude, cookie } = this.state;
    console.log(url);
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
            // useWebKit
            geolocationEnabled
            ref={(ref) => this.webview = ref}
            source={{
              uri: url,
              headers: {
                "cookie": cookie,
                "user-agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
              }
            }}
            onLoadStart={this.handleStart}
            onMessage={this.handleMessage}
            thirdPartyCookiesEnabled
            onLoadProgress={this.handleLoadProgress}
            onNavigationStateChange={this.onNavigationStateChange}
          />
        }
        <TouchableWithFeedback style={styles.touch} onPress={this.refersh}>
                <Text style={styles.touchText}>refresh</Text>
        </TouchableWithFeedback>
      </SafeAreaView>
    );
  }
}

export default Home;
