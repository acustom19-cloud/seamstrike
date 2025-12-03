import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seamstrike.app',
  appName: 'SeamStrike',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
