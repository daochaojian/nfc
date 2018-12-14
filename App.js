/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Alert} from 'react-native';
import NfcManager, {Ndef, NfcTech, ByteParser} from 'react-native-nfc-manager'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  componentDidMount() {
    NfcManager.isSupported()
    .then(supported => {
        console.log(supported);
        this.setState({ supported });
        if (supported) {
            this.startNfc();
        } else {
            Alert.alert(
                'get tag',
                supported,
            [
                { text: '确定', onPress: () => {} },
            ],
            );
        }
    })
  }

  startNfc = () => {
    NfcManager.start({
        onSessionClosedIOS: () => {
            console.log('ios session closed');
        }
    })
        .then(result => {
            Alert.alert(
                'get tag',
            JSON.stringify(result),
            [
                { text: '确定', onPress: () => {} },
            ],
            );
            console.log('start OK', result);
        })
        .catch(error => {
            console.warn('start fail', error);
            this.setState({supported: false});
        })

    if (Platform.OS === 'android') {
        NfcManager.getLaunchTagEvent()
            .then(tag => {
                console.log('launch tag', tag);
                if (tag) {
                    this.setState({ tag });
                }
            })
            .catch(err => {
                console.log(err);
            });
        NfcManager.isEnabled()
            .then(enabled => {
                this.setState({ enabled });
            })
            .catch(err => {
                console.log(err);
            });
        NfcManager.registerTagEvent(tag => {
          Alert.alert(
            'get tag',
            JSON.stringify(tag),
            [
              { text: '确定', onPress: () => {} },
            ],
          );
        }, 'Hold your device over the tag', true)
        NfcManager.onStateChanged(
            event => {
                if (event.state === 'on') {
                    this.setState({enabled: true});
                } else if (event.state === 'off') {
                    this.setState({enabled: false});
                } else if (event.state === 'turning_on') {
                    // do whatever you want
                } else if (event.state === 'turning_off') {
                    // do whatever you want
                }
            }
        )
            .then(sub => {
                // this._stateChangedSubscription = sub;
                // remember to call this._stateChangedSubscription.remove()
                // when you don't want to listen to this anymore
            })
            .catch(err => {
                console.warn(err);
            });
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
