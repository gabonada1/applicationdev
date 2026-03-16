import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "react-native-elements";

import Login from "./frontend/Login/Login";
import Register from "./frontend/Login/Register";
import ForgotPassword from "./frontend/Login/ForgotPassword";

// USER
import Dashboard from "./frontend/User/Dashboard";
import Utensils from "./frontend/User/Utensils";
import Profile from "./frontend/User/Profile";
import UtensilDetails from "./frontend/User/UtensilDetails";
import UserLogs from "./frontend/User/UserLogs";

// ADMIN
import AdminDashboard from "./frontend/Admin/AdminDashboard";
import AdminUtensils from "./frontend/Admin/AdminUtensils";
import AdminProfile from "./frontend/Admin/AdminProfile";
import AdminLogs from "./frontend/Admin/AdminLogs";

import { COLORS } from "./frontend/styles/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.gold,
        headerTitleStyle: { fontWeight: "900" },

        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: "#999",

        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = "home";
          } else if (route.name === "Utensils") {
            iconName = "restaurant";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return (
            <Icon
              name={iconName}
              type="material"
              size={24}
              color={color}
            />
          );
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Utensils" component={Utensils} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

/////////////////////////////////////////////////////////
// ADMIN TABS WITH ICONS
/////////////////////////////////////////////////////////
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.gold,
        headerTitleStyle: { fontWeight: "900" },

        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: "#999",

        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "AdminDashboard") {
            iconName = "dashboard";
          } else if (route.name === "AdminUtensils") {
            iconName = "restaurant-menu";
          } else if (route.name === "AdminProfile") {
            iconName = "admin-panel-settings";
          }

          return (
            <Icon
              name={iconName}
              type="material"
              size={24}
              color={color}
            />
          );
        }
      })}
    >
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

/////////////////////////////////////////////////////////
// MAIN STACK
/////////////////////////////////////////////////////////
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.gold,
          headerTitleStyle: { fontWeight: "900" },
          contentStyle: { backgroundColor: COLORS.bg }
        }}
      >
        {/* AUTH */}
        <Stack.Screen name="Login" component={Login} options={{ title: "Welcome" }} />
        <Stack.Screen name="Register" component={Register} options={{ title: "Create Account" }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: "Reset Password" }} />

        {/* USER */}
        <Stack.Screen name="UserTabs" component={UserTabs} options={{ headerShown: false }} />
        <Stack.Screen name="UtensilDetails" component={UtensilDetails} options={{ title: "Utensil Details" }} />
        <Stack.Screen name="UserLogs" component={UserLogs} options={{ title: "My Logs" }} />

        {/* ADMIN */}
        <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AdminLogs" component={AdminLogs} options={{ title: "Logs" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
