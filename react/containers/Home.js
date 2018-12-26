import React from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Linking,
  NetInfo,
  Image,
  NativeModules,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { WebView } from "react-native-webview";
import publicIP from 'react-native-public-ip';
import Permissions from 'react-native-permissions';
import NfcManager, { Ndef, NfcTech, NdefParser } from 'react-native-nfc-manager';
import netErr from '../images/errorNetwork.png';
import scan from '../images/nfc.png';

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
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
    netStatus: true,
    ip: '',
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

    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        publicIP()
        .then(ip => {
          console.log(ip);
        })
        .catch(error => {
          console.log(error);
        });
      } else {
        this.setState({ netStatus: isConnected });
      }
    });

    this.checkNetInfo();

    this.isSupported();
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener(
      'connectionChange',
      this.handleNetWorkChange,
    );
    NfcManager.unregisterTagEvent();
  }

  handleNetWorkChange = (status) => {
    if (!status) {
      this.setState({ netStatus: status });
    }
  }

  checkIp = () => {
    publicIP()
    .then(ip => {
      this.setState({ ip });
    })
    .catch(error => {
      console.log(error);
    });
  }

  checkIosPermission = () => {
    Permissions.check('location').then(response => {
      if (response !== 'authorized') {
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
    })
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

  getLocation = () => {
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
            longtitude: location.coords.longtitude,
          });
        }
      },
      (err) => {
        console.log(err);
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  };

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
        console.log(tag);
        if (text !== null) {
          if (url) {
            this.postMessages({ url: text });
          } else {
            this.setState({ url: text });
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

  checkNetInfo = () => {
    NetInfo.isConnected.addEventListener(
      'connectionChange',
      (status) => {
        if (status) {
          this.checkIp();
        }
        this.setState({ netStatus: status });
      }
    );
  }

  parseUri = (tag) => {
    try {
        if (Ndef.isType(tag.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
            console.log(Ndef.uri.decodePayload(tag.ndefMessage[0].payload));
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

  postMessages = (value) => {
    if (this.webview && this.webview !== null) {
      this.webview.postMessage(JSON.stringify(value));
    }
  }

  onMessage = (e) => {
    console.log(JSON.parse(e.nativeEvent.data));
  }

  render() {
    const { navigation } = this.props;
    const { url, netStatus } = this.state;
    console.log(this.state);
    return (
      <SafeAreaView style={styles.containerView}>
        {!netStatus && <View style={styles.error}>
          <Image source={netErr} style={styles.image} resizeMode="contain" />
          <Text style={styles.text}>connect error, please connect to internet first!</Text>
        </View>}
        {url ? <WebView
            style={styles.webView}
            useWebKit={true}
            geolocationEnabled
            ref={(ref) => this.webview = ref}
            source={{ uri: url }}
            startInLoadingState={true}
            onMessage={this.onMessage}
            onLoadProgress={(e) => console.log(e.nativeEvent.progress)}
            // onLoad={this.postMessages}
            onLoadEnd={(err) => console.log(err)}
          />
          : <View style={styles.container}>
          <View style={styles.tips}>
            <Image source={scan} style={styles.image} resizeMode="contain" />
            <Text style={styles.tipsText}>Hold your device over the tag</Text>
          </View>
        </View>
        }
      </SafeAreaView>
    );
  }
}

export default Home;
