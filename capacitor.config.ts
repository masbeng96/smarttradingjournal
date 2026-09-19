import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tradingjournal.compoundapp',
  appName: 'Trading Journal Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Jika ingin OTA mode langsung dari server live, ganti url ke endpoint Google Cloud Run:
    // url: "https://your-cloud-run-service-url.run.app"
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070a12',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#10b981',
      sound: 'beep.wav',
    },
  },
};

export default config;
