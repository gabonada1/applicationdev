import { StyleSheet } from "react-native";
import { COLORS } from "./theme";

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 18
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.gold
  },
  sub: {
    marginTop: 6,
    color: COLORS.muted
  }
});
