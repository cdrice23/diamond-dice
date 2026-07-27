import { PortalHost } from "@rn-primitives/portal";
import { useFonts, VT323_400Regular } from "@expo-google-fonts/vt323";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ VT323_400Regular });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1 font-sans">
      <Stack />
      <PortalHost />
    </View>
  );
}
