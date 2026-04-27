import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS } from "../styles/theme";

export default function PasswordField({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  style,
  inputStyle,
  editable = true,
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, inputStyle]}
        editable={editable}
        {...rest}
      />

      <Pressable
        onPress={() => setVisible((current) => !current)}
        style={({ pressed, hovered }) => [
          styles.eyeButton,
          hovered && styles.eyeButtonHover,
          pressed && styles.eyeButtonPressed
        ]}
        disabled={!editable}
      >
        <FontAwesome
          name={visible ? "eye-slash" : "eye"}
          size={18}
          color={editable ? COLORS.goldDark : COLORS.muted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbef",
    borderWidth: 1,
    borderColor: "#e9dcc0",
    borderRadius: 18,
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 8
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingVertical: 0,
    color: COLORS.text,
    fontSize: 15
  },
  eyeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  eyeButtonHover: {
    backgroundColor: "#fff2d1"
  },
  eyeButtonPressed: {
    backgroundColor: "#ffe7a1"
  }
});
