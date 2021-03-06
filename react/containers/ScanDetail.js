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
  touchProfile: {
    width: 40,
    height: 40,
    alignItems:'center',
    justifyContent:'center',
  },
  text: {
    fontSize: 12,
    marginTop: 15,
  },
});

class ScanDetail extends React.Component {
  static navigationOptions = ({ navigation}) => {
    const title = navigation.getParam('title', '');
    const loading = navigation.getParam('loading', true);
    const onJump = navigation.getParam('onJump', null);
    const logined = navigation.getParam('logined', false);
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
        <TouchableWithFeedback style={styles.touchProfile} onPress={onJump}>
          <Icon
            name={logined ? "wheel" : "humen" }
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
      url: url,
      key,
      latitude,
      longitude,
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
    navigation.navigate('Web', {
      url: 'https://app.dmsj.network/my-account',
      login: false,
      key,
    });
  }

  jumpToSetting = () => {
    const { navigation } = this.props;
    const { key } = this.state;
    navigation.navigate('Web', {
      url: 'https://oakandbarley.app.dmsj.network/my-account/edit-account',
      login: false,
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

  storeData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Error saving data
    }
  };

  // isSupported = () => {
  //   NfcManager.start({
  //     onSessionClosedIOS: () => {
  //       NfcManager.unregisterTagEvent();
  //     }
  //   })
  //   .then(supported => {
  //     console.log(supported);
  //     this.startNFC();
  //   }).catch(() => {
  //     Alert.alert(
  //       'info',
  //       'Your cell phone handset doesn\'t have the necessary hardware to support our software application',
  //       [
  //           { text: 'ok', onPress: () => {} },
  //       ],
  //     );
  //   });
  // }

  // startNFC = () => {
  //   const { navigation } = this.props;
  //   const { url } = this.state;
  //   NfcManager.registerTagEvent(tag => {
  //     if (tag.ndefMessage && tag.ndefMessage.length) {
  //       const text = this.parseUri(tag);
  //       if (text !== null) {
  //         const params = {
  //           uid: this.getQueryByName(text, 'uid'),
  //         }
  //         if (this.webview) {
  //           this.webview.postMessage(JSON.stringify(params));
  //         }

  //         return ;
  //       }
  //     }
  //     Alert.alert(
  //       'Scan Failed',
  //       'Unsupported tag detected, please scan a DMSJ TAG',
  //       [
  //           { text: 'ok', onPress: () => {} },
  //       ],
  //     );
  //   }, 'Hold your device over the tag', false);
  // }

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

  // goToNfcSetting = () => {
  //   if (Platform.OS === 'android') {
  //       NfcManager.goToNfcSetting()
  //         .then(result => {
  //             console.log('goToNfcSetting OK', result)
  //         })
  //         .catch(error => {
  //             console.warn('goToNfcSetting fail', error)
  //         });
  //   }
  // }

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

  handleStart = (navState) => {
    this.setState({ loading: true });
  }

  handleMessage = (event) => {
    const { navigation } = this.props;
    const { url, key } = this.state;
    const data = JSON.parse(event.nativeEvent.data);
    // console.log(event);
    console.log(data);
    // console.log(key);
    if (data.isLogin) {
      let cookieStr = '';
      Object.keys(data).forEach(k => {
        if (k !== 'isLogin') {
          cookieStr += k + '=' + data[k] + ';';
        }
      });
      try {
        AsyncStorage.setItem('isLogin', JSON.stringify({ isLogin: true}));
        AsyncStorage.setItem('cookie', cookieStr);
        const setParamsAction = NavigationActions.setParams({
          params: { isLogin: data.isLogin },
          key,
        });
        navigation.dispatch(setParamsAction);
      } catch (error) {
        console.log(error);
      }
    }
    // Alert.alert(
    //   'get onPostMessage',
    //   `sssss`,
    //   [
    //     { text: '确定', onPress: () => { } },
    //   ],
    // );
    // } else if (data.isLogin === false) {
    //   this.storeData('isLogin', { isLogin: false});
    //   try {
    //     await AsyncStorage.setItem('cookie', '');
    //   } catch (error) {
    //     console.log(error);
    //   }
    //   this.setState({
    //     cookie: '',
    //   });
    //   const setParamsActions = NavigationActions.setParams({
    //     params: { isLogin: data.isLogin },
    //     key,
    //   });
    //   navigation.dispatch(setParamsActions);
    // }
  }

  handleEnd = (navState) => {
    const { latitude, longitude } = this.state;
    const { navigation } = this.props;
    const nav = navState.nativeEvent;
    console.log(nav);
    if (this.webview) {
      if (!nav.latitude) {
        if (nav.url === 'https://oakandbarley.app.dmsj.network/') {
          navigation.setParams({
            onJump: this.jumpToPro,
            loading: true,
            logined: false,
          });
        } else if (nav.url === 'https://oakandbarley.app.dmsj.network/my-account') {
          navigation.setParams({
            onJump: this.jumpToSetting,
            loading: false,
            logined: true,
          });
        } else {
          navigation.setParams({
            onJump: this.jumpToPro,
            loading: false,
            logined: false,
          });
        }
      }
      this.webview.postMessage(JSON.stringify({
        location: {
          latitude,
          longitude,
        }
      }));
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

export default ScanDetail;
