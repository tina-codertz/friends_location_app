import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';


export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject |null>(null)
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(()=>{
    getCurrentLocation()
  },[])

  const getCurrentLocation = async()=>{

    try{
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status!=="granted"){
        setErrorMsg("Location permission denied");
        setLoading(false);
        return
      }
  

  const currentLocation= await Location.getCurrentPositionAsync({
    accuracy:Location.Accuracy.High,
  });
  setLocation(currentLocation);
  }catch(error){
    console.log(error);
    setErrorMsg("Failed to get Location")
  }finally{
    setLoading(false)
  }
};
if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

const region: Region = {
    latitude: location?.coords.latitude || -6.7924,
    longitude: location?.coords.longitude || 39.2083,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        loadingEnabled
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="You are here"
          description="Current location"
        />
      </MapView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});