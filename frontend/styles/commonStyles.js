import { StyleSheet } from "react-native";
import { COLORS } from "./theme";

export const commonStyles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 18,
    justifyContent: "center"
  },
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
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.gold,
    letterSpacing: 1
  },
  heroSub: {
    color: COLORS.muted,
    marginTop: 4
  },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.gold
  },
  sub: {
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 14
  },
  label: {
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text
  },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16
  },
  btnOutline: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: "center"
  },
  btnOutlineText: {
    color: COLORS.goldDark,
    fontWeight: "900"
  },
  rowBetween: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  link: {
    color: COLORS.goldDark,
    fontWeight: "800"
  },
  back: {
    textAlign: "center",
    color: COLORS.goldDark,
    fontWeight: "900",
    marginTop: 12
  }
});
