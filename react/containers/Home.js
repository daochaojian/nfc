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
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import Permissions from 'react-native-permissions';
import NfcManager, { Ndef, NfcTech, NdefParser } from 'react-native-nfc-manager';
import TouchableWithFeedback from '../components/common/TouchableWithFeedback';
import Icon from '../components/common/Icon';
import nfcLogo from '../images/nfc.png';
import netErr from '../images/errorNetwork.png';
import colors from '../styles/colors';
import scan from '../images/nfc.png';
import logo from '../images/logo_dmsj.png';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
  },
  webView: {
    // zIndex: 9999,
  },
  modalStyle: {
    flex: 1,
  },
  modalBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    backgroundColor: colors.white,
    margin: 10,
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // width: width - 15,
    height: 200,
  },
  touchProfile: {
    width: 40,
    height: 40,
    alignItems:'center',
    justifyContent:'center',
  },
  touch: {
    marginHorizontal: 50,
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
    fontSize: 16,
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
    height: 180,
    width: 240,
    overflow: 'hidden',
  },
  nfcImage: {
    height: 100,
    width: 100,
    overflow: 'hidden',
    marginBottom: 10,
  },
  touchView: {
    borderRadius: 20,
    marginTop: 15,
    overflow: 'hidden',
  },
  scanImage: {
    height: 220,
    width: 220,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.alphaBlack(0.6),
    // backgroundColor: colors.white,
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
  static navigationOptions = ({ navigation}) => {
    const onJump = navigation.getParam('onJump', () => {});
    return {
      headerStyle: {
        backgroundColor: colors.white,
        elevation: 0,
        borderBottomColor: colors.transparent,
        borderBottomWidth: 0,
        shadowColor: colors.transparent,
      },
      headerTitle: null,
      headerBackTitle: null,
      headerTitleStyle: {
        color: '#000000',
      },
      headerBackTitleStyle: {
        color: '#000000',
        backgroundColor: '#000000',
      },
      headerTintColor: '#000000',
      headerRight: (
        <TouchableWithFeedback style={styles.touchProfile} onPress={onJump}>
          <Icon
          name="humen"
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
    scanning: false,
    showModal: false,
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
    const { navigation } = this.props;
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
      // this.openLinking();
      // this.getLocation();
      this.checkIosPermission();
    }
    this.retrieveStatus();
    NetInfo.isConnected.fetch().then(isConnected => {
      if (!isConnected) {
        this.setState({ netStatus: isConnected });
      }
    });
    this.checkNetInfo();
    navigation.setParams({
      onJump: this.jumpToProfile,
    });
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
      } else if (isLogin === false) {
        this.setState({ isLogin: false });
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

  requestPermission = () => {
    Permissions.request('location').then(response => {
      console.log(response);
    })
  };

  openLocalSettings = () => {
    Permissions.openSettings();
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

  getLocation = () => {
    global.navigator.geolocation.getCurrentPosition(
      (location) => {
        console.log(location);
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
        console.log(location);
        if (location) {
          this.setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      },
      (err) => {
        console.log(err);
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
      { enableHighAccuracy: false, timeout: 6000 },
    );
  };

  isSupported = () => {
    NfcManager.start({
      onSessionClosedIOS: () => {
        this.setState({
          scanning: false,
        });
        NfcManager.unregisterTagEvent();
      }
    })
    .then(supported => {
      if (Platform.OS === 'android') {
        this.setState({
          showModal: true,
        });
      }
      this.setState({
        scanning: true,
      });
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

  jumpToTag = () => {
    const { navigation } = this.props;
    const key = navigation.state.key;
    navigation.navigate('ScanDetail', {
      // url: 'https://app.dmsj.network?uid=MbRb2cLe4RJ',
      // url: 'https://app.dmsj.network?uid=AkRZVcb6yRY',
      // url: 'https://app.dmsj.network?uid=EWnwJcwq3mL',
      url: 'https://app.dmsj.network?uid=djmYqcL02ma',
      // url: 'https://app.dmsj.network?uid=Y4nMZce3pRK',
      login: false,
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
        this.setState({
          showModal: false,
          scanning: false,
        });
        const text = this.parseUri(tag);
        if (text !== null) {
          let reg = new RegExp("http://app.dmsj.network\\?uid=");
          if (reg.test(text)) {
            navigation.navigate('ScanDetail', {
              url: text.replace(/^http/,"https"),
              login: false,
              key,
              latitude: this.state.latitude,
              longitude: this.state.longitude,
            });
            NfcManager.unregisterTagEvent();
            this.setState({ url: text });
            return false;
          }
        }
      }
      this.setState({
        showModal: false,
        scanning: false,
      });
      NfcManager.unregisterTagEvent();
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

  jumpToProfile = () => {
    const { navigation } = this.props;
    const key = navigation.state.key;
    navigation.navigate('Web', {
      url: 'https://app.dmsj.network/my-account',
      login: false,
      key,
    });
  }

  startScanner = () => {
    this.isSupported();
  };

  close = () => {
    this.setState({
      showModal: false,
      scanning: false,
    })
  }

  render() {
    const { navigation } = this.props;
    const { url, netStatus, loading, latitude, longitude, isLogin, showModal, scanning } = this.state;
    console.log(this.state);
    return (
      <SafeAreaView style={styles.containerView}>
        <Modal
          visible={showModal}
          style={styles.modalStyle}
          animationType="slide"
          transparent
          onRequestClose={this.close}
          onShow={() => { }}
        >
          <View
            style={styles.modalContainer}
            pointerEvents="auto"
            onStartShouldSetResponder={() => true}
            onResponderRelease={this.close}
          >
            <View style={styles.modalBottom}>
              <Image source={nfcLogo} style={styles.nfcImage} resizeMode="contain" />
              <Text>
                Hold your device over the tag
              </Text>
            </View>
          </View>
        </Modal>
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
          </View>
          <View>
            <View style={styles.touchView}>
              <TouchableWithFeedback
                style={[styles.touch, styles.touchTop]}
                onPress={this.startScanner}
                disabled={scanning}
                // onPress={this.jumpToTag}
              >
                <Text style={styles.touchText}>SCAN TAG</Text>
              </TouchableWithFeedback>
            </View>
            {!isLogin &&
              <View style={styles.touchView}>
                <TouchableWithFeedback style={styles.touch} onPress={this.jumpToWeb}>
                  <Text style={styles.touchText}>LOG IN</Text>
                </TouchableWithFeedback>
              </View>
            }
          </View>

        </View>
      </SafeAreaView>
    );
  }
}

export default Home;
