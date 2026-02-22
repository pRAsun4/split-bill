import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    light: {
      background: '#fff',
      color: '#000',
    },
    dark: {
      background: '#000',
      color: '#fff',
    },
  },
})

type OurConfig = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends OurConfig { }
}
export default config