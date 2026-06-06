import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";


export function AuthGuard({children}:{children:React.ReactNode}){
    const {isLoggedIn, isLoading} = useAuth();

    if (isLoading){
        return(
            <View style={{flex:1,justifyContent:"center", alignItems:"center"}}>
                <ActivityIndicator size ="large"/>
            </View>
        );
    }
    if (!isLoggedIn){
        return<Redirect href="/auth/AuthScreen"/>;

    }
    return <>{children}</>

}