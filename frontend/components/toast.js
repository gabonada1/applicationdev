import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { COLORS } from "../styles/theme";

const listeners = new Set();
let nextToastId = 1;

function emitToast(payload) {
  listeners.forEach((listener) => listener(payload));
}

function show(type, message, title) {
  emitToast({
    id: nextToastId++,
    type,
    title,
    message
  });
}

export const toast = {
  success(message, title = "Success") {
    show("success", message, title);
  },
  error(message, title = "Error") {
    show("error", message, title);
  },
  info(message, title = "Notice") {
    show("info", message, title);
  },
  warning(message, title = "Warning") {
    show("warning", message, title);
  }
};

function getToastPalette(type) {
  switch (type) {
    case "success":
      return {
        accent: "#3caf52",
        icon: "OK",
        tint: "#eefaf0"
      };
    case "error":
      return {
        accent: "#dc4d4d",
        icon: "!",
        tint: "#fff0ee"
      };
    case "warning":
      return {
        accent: "#c88a00",
        icon: "!",
        tint: "#fff7df"
      };
    default:
      return {
        accent: COLORS.goldDark,
        icon: "i",
        tint: "#fff7df"
      };
  }
}

function ToastCard({ toastItem, onClose }) {
  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const palette = getToastPalette(toastItem.type);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 70
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true
      })
    ]).start();

    const timer = setTimeout(() => {
      dismiss();
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -18,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => onClose(toastItem.id));
  };

  return (
    <Animated.View
      style={[
        styles.toastWrap,
        {
          opacity,
          transform: [{ translateY }]
        }
      ]}
    >
      <Pressable
        style={[
          styles.toastCard,
          {
            borderColor: palette.accent,
            backgroundColor: palette.tint
          }
        ]}
        onPress={dismiss}
      >
        <View style={[styles.iconBadge, { backgroundColor: palette.accent }]}>
          <Text style={styles.iconText}>{palette.icon}</Text>
        </View>

        <View style={styles.copyWrap}>
          <Text style={styles.toastTitle}>{toastItem.title}</Text>
          <Text style={styles.toastMessage}>{toastItem.message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const listener = (payload) => {
      setItems((current) => [...current.slice(-2), payload]);
    };

    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const removeToast = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <View pointerEvents="box-none" style={styles.viewport}>
      {items.map((item) => (
        <ToastCard key={item.id} toastItem={item} onClose={removeToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    top: 18,
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 9999
  },
  toastWrap: {
    marginBottom: 10
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  iconText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900"
  },
  copyWrap: {
    flex: 1
  },
  toastTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900"
  },
  toastMessage: {
    marginTop: 3,
    color: COLORS.text,
    lineHeight: 19
  }
});
