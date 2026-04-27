import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, G, Circle } from "react-native-svg";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function DonutChart({ borrowed = 0, returned = 0, size = 236, stroke = 24 }) {
  const total = borrowed + returned;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;

  const borrowedPct = total > 0 ? borrowed / total : 0;
  const returnedPct = total > 0 ? returned / total : 0;
  const borrowedSweep = clamp(borrowedPct * 360, 0, 360);
  const returnedSweep = clamp(returnedPct * 360, 0, 360);
  const borrowedEnd = borrowedSweep;
  const returnedStart = borrowedEnd;
  const returnedEnd = returnedStart + returnedSweep;

  return (
    <View style={styles.chartWrap}>
      <Svg width={size} height={size}>
        <G>
          <Circle cx={cx} cy={cy} r={r} stroke="#eadfca" strokeWidth={stroke} fill="none" />

          {borrowed > 0 ? (
            <Path
              d={describeArc(cx, cy, r, 0, borrowedEnd)}
              stroke={COLORS.gold}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          ) : null}

          {returned > 0 ? (
            <Path
              d={describeArc(cx, cy, r, returnedStart, returnedEnd)}
              stroke={COLORS.success}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          ) : null}
        </G>
      </Svg>

      <View style={styles.chartCenter}>
        <Text style={styles.chartTotal}>{total}</Text>
        <Text style={styles.chartLabel}>Total Logs</Text>
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendLeft}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

export default function AdminDashboard({ navigation }) {
  const [name, setName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [borrowedCount, setBorrowedCount] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);
  const [utensils, setUtensils] = useState([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        setName(u.name || "Admin");
      }
    })();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const [logsRes, utensilsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/utensils`)
      ]);

      const data = await logsRes.json();

      if (!logsRes.ok || !data.ok) {
        setBorrowedCount(0);
        setReturnedCount(0);
      } else {
        const logs = data.logs || [];
        setBorrowedCount(logs.filter((l) => String(l.status).toLowerCase() === "borrowed").length);
        setReturnedCount(logs.filter((l) => String(l.status).toLowerCase() === "returned").length);
      }

      const utensilData = await utensilsRes.json();
      if (utensilsRes.ok && utensilData.ok) {
        setUtensils(Array.isArray(utensilData.items) ? utensilData.items : []);
      } else {
        setUtensils([]);
      }
    } catch {
      setBorrowedCount(0);
      setReturnedCount(0);
      setUtensils([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const total = useMemo(() => borrowedCount + returnedCount, [borrowedCount, returnedCount]);
  const lowStockItems = useMemo(
    () => utensils.filter((item) => (Number(item.qty) || 0) > 0 && (Number(item.qty) || 0) <= 10),
    [utensils]
  );
  const outOfStockItems = useMemo(
    () => utensils.filter((item) => (Number(item.qty) || 0) <= 0),
    [utensils]
  );
  const stockAlerts = useMemo(
    () => [...outOfStockItems, ...lowStockItems].slice(0, 4),
    [lowStockItems, outOfStockItems]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>ADMIN DASHBOARD</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome, {name}</Text>
        <Text style={styles.heroSub}>
          Keep track of borrow and return activity with a calmer gold-and-white overview.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{borrowedCount}</Text>
            <Text style={styles.statText}>Borrowed</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{returnedCount}</Text>
            <Text style={styles.statText}>Returned</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statText}>Total</Text>
          </View>
        </View>
      </View>

      <View style={styles.analyticsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Activity Overview</Text>
            <Text style={styles.sectionTitle}>Borrow vs Return</Text>
          </View>

          <Pressable
            style={interactivePressable(styles.refreshAction, {
              hoverStyle: styles.refreshActionHover,
              pressedStyle: styles.refreshActionPressed,
              hoveredLift: false
            })}
            onPress={loadStats}
          >
            <Text style={styles.refreshActionText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.chartPanel}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.goldDark} />
              <Text style={styles.loadingText}>Loading chart...</Text>
            </View>
          ) : (
            <>
              <DonutChart borrowed={borrowedCount} returned={returnedCount} />

              <View style={styles.legendPanel}>
                <LegendRow color={COLORS.gold} label="Borrowed" value={borrowedCount} />
                <LegendRow color={COLORS.success} label="Returned" value={returnedCount} />
                <LegendRow color="#ded6c7" label="Total" value={total} />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.stockSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Inventory Health</Text>
            <Text style={styles.sectionTitle}>Stock Alerts</Text>
          </View>

          <Pressable
            style={interactivePressable(styles.refreshAction, {
              hoverStyle: styles.refreshActionHover,
              pressedStyle: styles.refreshActionPressed,
              hoveredLift: false
            })}
            onPress={() => navigation.navigate("AdminUtensils")}
          >
            <Text style={styles.refreshActionText}>Manage</Text>
          </Pressable>
        </View>

        <View style={styles.stockPanel}>
          <View style={styles.stockSummaryRow}>
            <View style={styles.stockSummaryPill}>
              <Text style={styles.stockSummaryValue}>{utensils.length}</Text>
              <Text style={styles.stockSummaryLabel}>Items</Text>
            </View>
            <View style={styles.stockSummaryPill}>
              <Text style={styles.stockSummaryValue}>{lowStockItems.length}</Text>
              <Text style={styles.stockSummaryLabel}>Low</Text>
            </View>
            <View style={styles.stockSummaryPill}>
              <Text style={styles.stockSummaryValue}>{outOfStockItems.length}</Text>
              <Text style={styles.stockSummaryLabel}>Out</Text>
            </View>
          </View>

          {stockAlerts.length ? (
            <View style={styles.alertList}>
              {stockAlerts.map((item) => {
                const out = (Number(item.qty) || 0) <= 0;
                return (
                  <View key={item._id} style={styles.alertRow}>
                    <View style={styles.alertCopy}>
                      <Text style={styles.alertName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.alertMeta}>Qty {item.qty} | {out ? "Out of Stock" : "Low Stock"}</Text>
                    </View>
                    <View style={[styles.alertBadge, out ? styles.alertBadgeOut : styles.alertBadgeLow]}>
                      <Text style={[styles.alertBadgeText, out ? styles.alertBadgeOutText : styles.alertBadgeLowText]}>
                        {out ? "Out" : "Low"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noAlertBox}>
              <Text style={styles.noAlertTitle}>All stock looks healthy</Text>
              <Text style={styles.noAlertSub}>Low and out-of-stock utensils will appear here.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffdf8"
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 110
  },
  hero: {
    backgroundColor: "#fff8e8",
    borderRadius: 34,
    padding: 22,
    borderWidth: 1,
    borderColor: "#f0dfb2",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  heroTag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff1c8",
    borderWidth: 1,
    borderColor: "#edd287"
  },
  heroTagText: {
    color: COLORS.goldDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.text
  },
  heroSub: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.muted
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20
  },
  statPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#efe4c2",
    alignItems: "center"
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text
  },
  statText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted
  },
  analyticsSection: {
    marginTop: 18
  },
  stockSection: {
    marginTop: 18
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: COLORS.goldDark,
    textTransform: "uppercase"
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text
  },
  refreshAction: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#eadfca"
  },
  refreshActionHover: {
    backgroundColor: "#fff8ea",
    borderColor: "#e8d49e"
  },
  refreshActionPressed: {
    backgroundColor: "#fff2d1"
  },
  refreshActionText: {
    fontWeight: "900",
    color: COLORS.text
  },
  chartPanel: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#eadfca",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 24
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: "800"
  },
  chartWrap: {
    alignItems: "center"
  },
  chartCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  chartTotal: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text
  },
  chartLabel: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.muted
  },
  legendPanel: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#eadfca",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 10
  },
  legendLabel: {
    fontWeight: "900",
    color: COLORS.text
  },
  legendValue: {
    fontWeight: "900",
    color: COLORS.goldDark
  },
  stockPanel: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadfca",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  stockSummaryRow: {
    flexDirection: "row",
    gap: 10
  },
  stockSummaryPill: {
    flex: 1,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center"
  },
  stockSummaryValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900"
  },
  stockSummaryLabel: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  alertList: {
    marginTop: 14
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0e7d5"
  },
  alertCopy: {
    flex: 1
  },
  alertName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900"
  },
  alertMeta: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  alertBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  alertBadgeLow: {
    backgroundColor: "#fff7df",
    borderColor: "#efd68c"
  },
  alertBadgeOut: {
    backgroundColor: "#fff1ee",
    borderColor: "#ffb7a8"
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: "900"
  },
  alertBadgeLowText: {
    color: COLORS.goldDark
  },
  alertBadgeOutText: {
    color: COLORS.warning
  },
  noAlertBox: {
    marginTop: 14,
    backgroundColor: "#ebfae6",
    borderWidth: 1,
    borderColor: "#81da8e",
    borderRadius: 18,
    padding: 14
  },
  noAlertTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
  noAlertSub: {
    marginTop: 4,
    color: COLORS.muted,
    fontWeight: "800"
  }
});
