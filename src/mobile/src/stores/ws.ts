import { wsClient } from "@rosser/shared";
import { useNotificationStore } from "./notification";
import { useArticleStore } from "./article";

let wsHandlersRegistered = false;

export function registerWebSocketHandlers() {
  if (wsHandlersRegistered) return;
  wsHandlersRegistered = true;

  wsClient.on("articles.new", () => {
    const notifStore = useNotificationStore();
    notifStore.fetchUnreadCount();
    const artStore = useArticleStore();
    artStore.refresh();
  });
  wsClient.on("notification.new", () => {
    const notifStore = useNotificationStore();
    notifStore.fetchUnreadCount();
  });
}
