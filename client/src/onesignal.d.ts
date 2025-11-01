interface OneSignalUser {
  PushSubscription: {
    optedIn: boolean;
    id: string | null;
    token: string | null;
    optOut(): Promise<void>;
  };
}

interface OneSignalSlidedown {
  promptPush(options?: { force?: boolean }): Promise<void>;
}

interface OneSignalNotifications {
  permission: boolean;
  isPushSupported(): boolean;
  requestPermission(): Promise<boolean>;
}

interface OneSignalInterface {
  User: OneSignalUser;
  Slidedown: OneSignalSlidedown;
  Notifications: OneSignalNotifications;
  init(options: {
    appId: string;
    safari_web_id?: string;
    notifyButton?: {
      enable: boolean;
    };
    allowLocalhostAsSecureOrigin?: boolean;
    promptOptions?: {
      slidedown?: {
        prompts?: Array<{
          type: string;
          autoPrompt: boolean;
          text?: {
            actionMessage?: string;
            acceptButton?: string;
            cancelButton?: string;
          };
        }>;
      };
    };
  }): Promise<void>;
}

declare global {
  interface Window {
    OneSignal?: OneSignalInterface;
    OneSignalDeferred?: Array<(OneSignal: OneSignalInterface) => void>;
    OneSignalReady?: boolean;
  }
}

export {};
