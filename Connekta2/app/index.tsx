import { useAuth } from "@/context/AuthContext";
import { hasCompletedOnboarding } from "@/services/onboarding";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";





export default function Index(){
    const {isLoggedIn, isLoading} = useAuth();
    const [onboardingDone, setOnboardingDone] = useState <boolean | null>(null);

    useEffect(()=>{
        void hasCompletedOnboarding().then(setOnboardingDone);

    },[]);

    if (isLoading || onboardingDone===null){
        return(
        
        <View style={{flex:1, justifyContent:"center",alignItems:"center"}}>
            <ActivityIndicator size="large"/>
        </View>
        );

    }
    if (isLoggedIn) return <Redirect href ="/(tabs)/map"/>
    if(!onboardingDone) return <Redirect href="/(landing)"/>
    return <Redirect href="/auth/AuthScreen" />
}