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
  DeviceEventEmitter,
  AsyncStorage,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import Permissions from 'react-native-permissions';
import NfcManager, { Ndef, NfcTech, NdefParser } from 'react-native-nfc-manager';
import TouchableWithFeedback from '../components/common/TouchableWithFeedback';
import netErr from '../images/errorNetwork.png';
import scan from '../images/nfc.png';
import logo from '../images/logo_dmsj.png';

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
  },
  webView: {
    // zIndex: 9999,
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
  touchTop: {
    backgroundColor: '#f44336',
  },
  touchText: {
    fontSize: 14,
    color: '#ffffff',
  },
  container: {
    flex: 1,
    // alignItems: 'center',
    justifyContent: 'space-around',
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

    overflow: 'hidden',
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
    header: null,
  };

  webview = null;

  state = {
    url: '',
    isLogin: false,
    netStatus: true,
    latitude: 25.0623611,
    longitude: 102.6717603,
    ip: '',
    uri: '',
    title: '',
    loading: false,
    isBackButtonEnable: false,
    isForwardButtonEnable: false,
  };

  componentWillMount() {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(value => {
        if (!value) {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'ask permission',
              message: 'ask permission for location',
              buttonPositive: 'ok',
              buttonNegative: 'no',
            },
          ).then(granted => {
            const hasPermission =
              Platform.Version >= 23
                ? granted === PermissionsAndroid.RESULTS.GRANTED
                : !!granted;
            if (hasPermission) {
              this.getLocation();
            } else {
              Alert.alert(
                'ask permisssion',
                'Allow location access in Setting->Apps to get location?',
                [{text: 'cancel', onPress: () => {}, style: 'cancel'},
                  { text: 'ok', onPress: () => this.openLinking()},
                ],
              );
            }
          });
          return;
        }
        this.getLocation();
      });
    } else {
      this.checkIosPermission();
    }
    this.retrieveStatus();
    NetInfo.isConnected.fetch().then(isConnected => {
      if (!isConnected) {
        this.setState({ netStatus: isConnected });
      }
    });
    this.checkNetInfo();
    // this.isSupported();
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener(
      'connectionChange',
      this.handleNetWorkChange,
    );
    NfcManager.unregisterTagEvent();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.navigation.state.params) {
      const { needRefresh, isLogin } = (nextProps.navigation
        && nextProps.navigation.state
        && nextProps.navigation.state.params) || {};
      if (isLogin) {
        this.setState({ isLogin: true });
      }
    }
  }

  retrieveStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('isLogin');
      console.log(JSON.parse(value));
      if (value !== null) {
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

  handleNetWorkChange = (status) => {
    if (!status) {
      this.setState({ netStatus: status });
    }
  }

  checkIosPermission = () => {
    Permissions.check('location').then(response => {
      if (response === 'undetermined') {
        this.getLocation();
        return ;
      }
      if (response === 'denied') {
        Alert.alert(
          'ask permisssion',
          'Allow location access in Setting->Apps to get location?',
          [{text: 'cancel', onPress: () => {}, style: 'cancel'},
            { text: 'ok', onPress: () => this.openLinking()},
          ],
        );
      } else {
        this.getLocation();
      }
    });
  }

  openLinking = () => {
    if (Platform.OS === 'android') {
      const openSettings = NativeModules.OpenSettings;
      openSettings.openSettings(status => {
        if (status !== true) {
          console.log('failed');
        }
      });
    } else {
      Linking.canOpenURL('app-settings:')
      .then(suported => {
        if (suported) {
          return Linking.openURL('app-settings:');
        }
      })
      .catch(() => {});
    }
  }

  askPermission = () => {
    Alert.alert(
      'ask permisssion',
      'Allow location access in Setting->Apps to get location?',
      [{text: 'cancel', onPress: () => {}, style: 'cancel'},
        { text: 'ok', onPress: () => {} },
      ],
    );
  }

  getLocation = async () => {
    global.navigator.geolocation.getCurrentPosition(
      (location) => {
        if (location) {
          this.setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      },
      () => this.geoLowAccuracy(),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };
  geoLowAccuracy = () => {
    global.navigator.geolocation.getCurrentPosition(
      (location) => {
        if (location) {
          this.setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      },
      (err) => {
        Permissions.check('location').then(response => {
          if (response === 'undetermined') {
            this.getLocation();
            return;
          }
          if (response === 'denied') {
            Alert.alert(
              'ask permisssion',
              'Allow location access in Setting->Apps to get location?',
              [{text: 'cancel', onPress: () => {}, style: 'cancel'},
                { text: 'ok', onPress: () => this.openLinking()},
              ],
            );
            return;
          }
        });
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
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

  jumpToTag = () => {
    const { navigation } = this.props;
    const key = navigation.state.key;
    navigation.navigate('ScanDetail', {
      // url: 'https://app.dmsj.network?uid=MbRb2cLe4RJ',
      // url: 'https://app.dmsj.network?uid=AkRZVcb6yRY',
      url: 'https://app.dmsj.network?uid=zwQlLcBOWQx',
      key,
      latitude: this.state.latitude,
      longitude: this.state.longitude,
    });
  }

  startNFC = () => {
    const { navigation } = this.props;
    const { url } = this.state;
    const key = navigation.state.key;
    NfcManager.registerTagEvent(tag => {
      if (tag.ndefMessage && tag.ndefMessage.length) {
        const text = this.parseUri(tag);
        console.log(text);
        if (text !== null) {
            navigation.navigate('ScanDetail', {
              url: text.replace(/^http/,"https"),
              key,
              latitude: this.state.latitude,
              longitude: this.state.longitude,
            });
            NfcManager.unregisterTagEvent();
            this.setState({ url: text });
          }
          return ;
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

  checkNetInfo = () => {
    NetInfo.isConnected.addEventListener(
      'connectionChange',
      (status) => {
        this.setState({ netStatus: status });
      }
    );
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

  jumpToWeb = () => {
    const { navigation } = this.props;
    const key = navigation.state.key;
    navigation.navigate('Web', {
      url: 'https://oakandbarley.app.dmsj.network/',
      login: true,
      key,
      latitude: this.state.latitude,
      longitude: this.state.longitude,
    });
    NfcManager.unregisterTagEvent();
  }

  startScanner = () => {
    this.isSupported();
  };

  render() {
    const { navigation } = this.props;
    const { url, netStatus, loading, latitude, longitude, isLogin } = this.state;
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
          <View style={styles.container}>
          <View style={styles.tips}>
            <Image source={logo} style={styles.image} resizeMode="contain" />
            <Text style={styles.tipsText}>Hold your device over the tag</Text>
          </View>
          <View>
            <TouchableWithFeedback
              style={[styles.touch, styles.touchTop]}
              // onPress={this.startScanner}
              onPress={this.jumpToTag}
            >
              <Text style={styles.touchText}>Scan Tag</Text>
            </TouchableWithFeedback>
            {!isLogin &&
              <TouchableWithFeedback style={styles.touch} onPress={this.jumpToWeb}>
                <Text style={styles.touchText}>Log In</Text>
              </TouchableWithFeedback>
            }
          </View>

        </View>
      </SafeAreaView>
    );
  }
}

export default Home;
