package com.nfc;

import android.app.Activity;
import android.content.Intent;
import android.content.Context;
import android.location.LocationListener;
import android.support.annotation.Nullable;
import android.os.Bundle;
import java.util.List;
import android.net.Uri;
import android.location.Location;
import android.location.LocationManager;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.Promise;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;


public class LocationModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  private LocationManager locationManager;
  private String locationProvider;
  private Location location;

  public LocationModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "Location";
  }

  @ReactMethod
  public void getLocation(final Promise promise) {
    try {
      Activity currentActivity = getCurrentActivity();

      if( locationManager == null) {
        locationManager = (LocationManager) this.reactContext.getSystemService(Context.LOCATION_SERVICE);
      }
      List<String> providers = locationManager.getProviders(true);
        if (providers.contains(LocationManager.NETWORK_PROVIDER)){
            //如果是网络定位
            locationProvider = LocationManager.NETWORK_PROVIDER;
        }
        Location location = locationManager.getLastKnownLocation( locationProvider );
        if (location != null) {
            setLocation( location );
        } else {
            if (providers.contains(LocationManager.GPS_PROVIDER)){
                //如果是GPS定位
                locationProvider = LocationManager.GPS_PROVIDER;
                 if (location != null) {
                    setLocation( location );
                }
            }
        }
      locationManager.requestLocationUpdates( locationProvider, 0, 0, locationListener );
    // promise.resolve(convertToJSON(providers));
      promise.resolve(convertLocationToJSON(this.location));

    } catch (Exception e) {
      promise.reject("err", e.toString());
    }
  }

LocationListener locationListener = new LocationListener() {
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
    }
    @Override
    public void onProviderEnabled(String provider) {
    }
    @Override
    public void onProviderDisabled(String provider) {
    }
    // 如果位置发生变化，重新显示
    @Override
    public void onLocationChanged(Location location) {
        if (location != null) {
            setLocation(location);
            sendEvent("onLocation", convertLocationToJSON(location));
        }
    }
};

  @ReactMethod
  public void removeLocation() {
      locationManager.removeUpdates(locationListener);
  }

private void setLocation(Location location) {
    this.location = location;
}
    private WritableMap convertLocationToJSON(Location l) {
        WritableMap params = new WritableNativeMap();
        params.putDouble("latitude", l.getLatitude());
        params.putDouble("longitude", l.getLongitude());
        params.putDouble("accuracy", l.getAccuracy());
        params.putDouble("altitude", l.getAltitude());
        params.putDouble("bearing", l.getBearing());
        params.putString("provider", l.getProvider());
        params.putDouble("speed", l.getSpeed());
        params.putString("timestamp", Long.toString(l.getTime()));
        return params;
    }

    private void sendEvent(String eventName,
                       @Nullable WritableMap params) {
    this.reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
    }

    private WritableMap convertToJSON(List<String> list) {
        WritableMap params = new WritableNativeMap();
        for(int i = 0; i< list.size(); i++) {
            params.putString(list.get(i), list.get(i));
        }
        return params;
    }
}
