import { StyleSheet } from "react-native";
import { COLORS } from "./theme";

export const commonStyles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
    justifyContent: "center"
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.3
  },
  heroSub: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21
  },
  header: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text
  },
  sub: {
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 20
  },
  label: {
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
    fontSize: 13
  },
  input: {
    backgroundColor: "#f2e3a7",
    borderWidth: 1,
    borderColor: "#dbc56a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15
  },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.dark,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.2
  },
  btnOutline: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center"
  },
  btnOutlineText: {
    color: COLORS.text,
    fontWeight: "900"
  },
  rowBetween: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  link: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13
  },
  back: {
    textAlign: "center",
    color: COLORS.text,
    fontWeight: "900",
    marginTop: 16
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "#fff5cf",
    borderWidth: 1,
    borderColor: "#f1d570",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6
  },
  logoWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  }
});
