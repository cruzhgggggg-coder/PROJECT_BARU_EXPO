import { Platform, useWindowDimensions } from "react-native";

export function useIsMobile(breakpoint = 1024) {
  const { width } = useWindowDimensions();
  return Platform.OS !== "web" || width < breakpoint;
}
