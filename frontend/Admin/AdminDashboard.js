import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, G, Circle } from "react-native-svg";
import { API_URL } from "../config";
import { commonStyles as s } from "../styles/commonStyles";
import { COLORS } from "../styles/theme";

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

function DonutChart({ borrowed = 0, returned = 0, size = 220, stroke = 24 }) {
  const total = borrowed + returned;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;

  const borrowedPct = total > 0 ? borrowed / total : 0;
  const returnedPct = total > 0 ? returned / total : 0;

  // Start at 0deg, draw arcs in order
  const startAngle = 0;
  const borrowedSweep = clamp(borrowedPct * 360, 0, 360);
  const returnedSweep = clamp(returnedPct * 360, 0, 360);

  const borrowedStart = startAngle;
  const borrowedEnd = borrowedStart + borrowedSweep;

  const returnedStart = borrowedEnd;
  const returnedEnd = returnedStart + returnedSweep;

  // If total is 0, show only background ring
  const showData = total > 0;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <G>
          {/* Background ring */}
          <Circle cx={cx} cy={cy} r={r} stroke={COLORS.border} strokeWidth={stroke} fill="none" />

          {showData && borrowed > 0 ? (
            <Path
              d={describeArc(cx, cy, r, borrowedStart, borrowedEnd)}
              stroke={COLORS.gold}
              strokeWidth={stroke}
              strokeLinecap="butt"
              fill="none"
            />
          ) : null}

          {showData && returned > 0 ? (
            <Path
              d={describeArc(cx, cy, r, returnedStart, returnedEnd)}
              stroke={"#166534"} // green for returned
              strokeWidth={stroke}
              strokeLinecap="butt"
              fill="none"
            />
          ) : null}
        </G>
      </Svg>

      {/* Center text */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.text }}>{total}</Text>
        <Text style={{ marginTop: 2, fontWeight: "800", color: COLORS.muted }}>Total Logs</Text>
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
        <Text style={{ fontWeight: "900", color: COLORS.text }}>{label}</Text>
      </View>
      <Text style={{ fontWeight: "900", color: COLORS.goldDark }}>{value}</Text>
    </View>
  );
}

export default function AdminDashboard({ navigation }) {
  const [name, setName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [borrowedCount, setBorrowedCount] = useState(0);
  const [returnedCount, setReturnedCount] = useState(0);

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

      const res = await fetch(`${API_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setBorrowedCount(0);
        setReturnedCount(0);
        return;
      }

      const logs = data.logs || [];
      const borrowed = logs.filter((l) => String(l.status).toLowerCase() === "borrowed").length;
      const returned = logs.filter((l) => String(l.status).toLowerCase() === "returned").length;

      setBorrowedCount(borrowed);
      setReturnedCount(returned);
    } catch {
      setBorrowedCount(0);
      setReturnedCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const total = useMemo(() => borrowedCount + returnedCount, [borrowedCount, returnedCount]);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.header}>Welcome, {name} </Text>
        <Text style={s.sub}>Admin Panel • Borrow/Return Overview</Text>

        <View style={{ marginTop: 14 }}>
          {loading ? (
            <View style={{ paddingVertical: 22, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 10, color: COLORS.muted, fontWeight: "800" }}>Loading chart...</Text>
            </View>
          ) : (
            <>
              <DonutChart borrowed={borrowedCount} returned={returnedCount} />

              <View style={{ marginTop: 12 }}>
                <LegendRow color={COLORS.gold} label="Borrowed" value={borrowedCount} />
                <LegendRow color={"#166534"} label="Returned" value={returnedCount} />
                <LegendRow color={COLORS.border} label="Total" value={total} />
              </View>

              <Pressable style={[s.btnOutline, { marginTop: 14 }]} onPress={loadStats}>
                <Text style={s.btnOutlineText}>Refresh Chart</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable style={s.btnOutline} onPress={() => navigation.navigate("AdminUtensils")}>
          <Text style={s.btnOutlineText}>Manage Utensils</Text>
        </Pressable>

        <Pressable style={s.btnOutline} onPress={() => navigation.navigate("AdminLogs")}>
          <Text style={s.btnOutlineText}>View Logs</Text>
        </Pressable>

        <Pressable style={s.btn} onPress={logout}>
          <Text style={s.btnText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
