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
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  heroTitle: {
    fontSize: 31,
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
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15
  },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    paddingVertical: 15,
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
    borderColor: COLORS.gold,
    backgroundColor: COLORS.soft,
    alignItems: "center"
  },
  btnOutlineText: {
    color: COLORS.goldDark,
    fontWeight: "900"
  },
  rowBetween: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  link: {
    color: COLORS.goldDark,
    fontWeight: "800",
    fontSize: 13
  },
  back: {
    textAlign: "center",
    color: COLORS.goldDark,
    fontWeight: "900",
    marginTop: 16
  },
  badge: {
    alignSelf: "center",
    backgroundColor: COLORS.softAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10
  },
  badgeText: {
    color: COLORS.goldDark,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6
  },
  logoWrap: {
    width: 112,
    height: 112,
    borderRadius: 32,
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
