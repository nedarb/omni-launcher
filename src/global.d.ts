import Browser from "webextension-polyfill";
declare global {
  const chrome: any;
  const browser: typeof Browser;
}

interface Action {
  title: string;
  desc: string;
  type: string;
  action: string;
  requiresPermission?: string;
  hasPermission?: boolean;
  url?: string;
  emoji?: boolean;
  emojiChar?: string;
  favIconUrl?: string;
  keycheck?: boolean;
  keys?: Array<string>;
}
