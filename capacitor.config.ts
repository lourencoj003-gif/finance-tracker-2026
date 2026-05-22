import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noa.app',
  appName: 'Noa',
  webDir: 'build',
  server: {
    hostname: 'app.noa.local',
    allowNavigation: ['api.groq.com', 'api.elevenlabs.io'],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#111318',
    scrollEnabled: false,
    allowsLinkPreview: false,
    scheme: 'noa',
  },
};

export default config;
