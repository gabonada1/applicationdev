import { COLORS } from "./theme";

export function interactivePressable(baseStyle, options = {}) {
  const {
    hoverStyle,
    pressedStyle,
    hoveredLift = true,
    pressedScale = true
  } = options;

  return ({ hovered, pressed }) => [
    baseStyle,
    hovered && hoveredLift && {
      transform: [{ translateY: -2 }],
      shadowOpacity: 0.18
    },
    hovered && hoverStyle,
    pressed && pressedScale && {
      transform: [{ scale: 0.985 }],
      opacity: 0.96
    },
    pressed && pressedStyle
  ];
}

export const SURFACE = {
  pagePad: 18,
  radiusLg: 28,
  radiusMd: 20,
  borderSoft: {
    borderWidth: 1,
    borderColor: COLORS.border
  },
  shadow: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  }
};
