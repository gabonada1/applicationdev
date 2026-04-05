import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";

import Login from "./frontend/Login/Login";
import Register from "./frontend/Login/Register";
import ForgotPassword from "./frontend/Login/ForgotPassword";

import Dashboard from "./frontend/User/Dashboard";
import Utensils from "./frontend/User/Utensils";
import Profile from "./frontend/User/Profile";
import UtensilDetails from "./frontend/User/UtensilDetails";
import UserLogs from "./frontend/User/UserLogs";

import AdminDashboard from "./frontend/Admin/AdminDashboard";
import AdminUtensils from "./frontend/Admin/AdminUtensils";
import AdminProfile from "./frontend/Admin/AdminProfile";
import AdminLogs from "./frontend/Admin/AdminLogs";

import { COLORS } from "./frontend/styles/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabScreenOptions = ({ route }) => ({
  headerStyle: {
    backgroundColor: COLORS.bg
  },
  headerShadowVisible: false,
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: "900" },
  tabBarActiveTintColor: COLORS.goldDark,
  tabBarInactiveTintColor: COLORS.muted,
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "800",
    paddingBottom: 2
  },
  tabBarStyle: {
    backgroundColor: COLORS.white,
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    height: 72,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  tabBarIcon: ({ color }) => {
    let iconName;
    let iconStyle = "solid";

    if (route.name === "Dashboard") {
      iconName = "house";
    } else if (route.name === "Utensils") {
      iconName = "utensils";
    } else if (route.name === "Profile") {
      iconName = "user";
    } else if (route.name === "AdminDashboard") {
      iconName = "chart-line";
    } else if (route.name === "AdminUtensils") {
      iconName = "box-open";
    } else {
      iconName = "user-shield";
    }

    return <FontAwesome6 name={iconName} iconStyle={iconStyle} size={20} color={color} />;
  }
});

function UserTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Utensils" component={Utensils} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name="AdminUtensils"
        component={AdminUtensils}
        options={{ title: "Utensils" }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfile}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.bg },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: "900" },
          contentStyle: { backgroundColor: COLORS.bg }
        }}
      >
        <Stack.Screen name="Login" component={Login} options={{ title: "Welcome" }} />
        <Stack.Screen name="Register" component={Register} options={{ title: "Create Account" }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "Reset Password" }} />

        <Stack.Screen name="UserTabs" component={UserTabs} options={{ headerShown: false }} />
        <Stack.Screen name="UtensilDetails" component={UtensilDetails} options={{ title: "Utensil Details" }} />
        <Stack.Screen name="UserLogs" component={UserLogs} options={{ title: "My Logs" }} />

        <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AdminLogs" component={AdminLogs} options={{ title: "Logs" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
