declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set' | 'get' | 'consent',
      targetId: string | Date,
      config?: {
        [key: string]: any;
      }
    ) => void;
    dataLayer?: any[];
  }
}

export {};






