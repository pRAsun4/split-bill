import { createAnimations } from "@tamagui/animations-react-native";
import { createInterFont } from "@tamagui/font-inter";
// import { createMedia } from "@tamagui/react-native-media-query";
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens } from "@tamagui/themes";
import { createTamagui } from "tamagui";

const animations = createAnimations({
  fast: {
    type: "spring",
    damping: 20,
    stiffness: 250,
  },
  medium: {
    type: "spring",
    damping: 10,
    stiffness: 100,
  },
});

const headingFont = createInterFont();
const bodyFont = createInterFont();

const config = createTamagui({
  animations,
  defaultTheme: "light",
  shouldAddPrefersColorChallenge: true,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  media: {
    sm: { maxWidth: 860 },
    gtSm: { minWidth: 860 + 1 },
    short: { maxHeight: 820 },
    hoverable: { hover: "hover" },
    touchable: { pointer: "coarse" },
  },
});

// Move type and module augmentation after config is defined

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
