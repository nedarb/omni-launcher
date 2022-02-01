import Browser from "webextension-polyfill";
declare global {
  const chrome: any;
  const browser: typeof Browser;
}

interface Action {
  id?: string;
  incognito?: boolean;
  title: string;
  desc: string;
  type: "action" | "command" | "tab" | "history" | "bookmark";
  action: string;
  requiresPermission?: string;
  hasPermission?: boolean;
  isDuplicate?: boolean;
  url?: string;
  searchPrefix?: string;
  shortcut?: string;
  emoji?: boolean;
  emojiChar?: string;
  favIconUrl?: string;
  keycheck?: boolean;
  keys?: Array<string>;
  payload?: any;
}
