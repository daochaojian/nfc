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
} from 'react-native';
import FusedLocation from 'react-native-fused-location';
import { SafeAreaView, NavigationActions } from 'react-navigation';
import { WebView } from "react-native-webview";
import Permissions from 'react-native-permissions';
import NfcManager, { Ndef, NfcTech, NdefParser } from 'react-native-nfc-manager';
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
});

class Home extends React.Component {
  static navigationOptions =  {
    headerTitle: '',
  };

  webview = null;

  state = {
    url: '',
    netStatus: true,
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

  isSupported = () => {
    NfcManager.isSupported()
    .then(supported => {
      if (supported) {
        this.startNFC();
      } else {
        Alert.alert(
          'info',
          'your device don\'t support NFC or don\'t have permission, please check!',
          [
              { text: 'ok', onPress: () => {} },
          ],
        );
      }
    }).catch()
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
        'failed',
        'unsupport tag, please check your tag!',
        [
            { text: 'ok', onPress: () => {} },
        ],
      );
    }, 'Hold your device over the tag', true);
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

  render() {
    const { navigation } = this.props;
    const { url, netStatus, loading, latitude, longitude, login, first } = this.state;
    console.log(this.state);
    console.log(longitude);
    return (
      <SafeAreaView style={styles.containerView}>
        {!netStatus && <View style={styles.error}>
          <Image source={netErr} style={styles.image} resizeMode="contain" />
          <Text style={styles.text}>connect error, please connect to internet first!</Text>
        </View>}
        {loading &&
        <View style={styles.indecator}>
            <ActivityIndicator
              animating
              color="#1BAF8F"
              size="large"
            />
          </View>
        }
        {url && <WebView
            style={styles.webView}
            useWebKit={true}
            geolocationEnabled
            ref={(ref) => this.webview = ref}
            source={{ uri: login ? first ? `${url}&latitude=${latitude}&longitude=${longitude}` : 'https://oakandbarley.app.dmsj.network/' : `${url}&latitude=${latitude}&longitude=${longitude}` }}
            // startInLoadingState
            onLoadStart={this.handleStart}
            // renderLoading={() => (<ActivityIndicator
            //   animating
            //   color="#1BAF8F"
            //   size="large"
            // />)}
            onLoadProgress={this.handleLoadProgress}
            onLoadEnd={() => console.log('end')}
            onNavigationStateChange={this.onNavigationStateChange}
          />
        // </View>
        }
      </SafeAreaView>
    );
  }
}

export default Home;
