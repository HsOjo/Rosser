import { useConnectionStore } from "./connection";
import { useArticleStore } from "./article";
import { useSubscriptionStore } from "./subscription";
import { useCategoryStore } from "./category";
import { useSiteStore } from "./site";
import { useSettingsStore } from "./settings";
import { useNotificationStore } from "./notification";
import { useTagStore } from "./tag";

export function resetAllStores() {
  useSubscriptionStore().reset();
  useArticleStore().reset();
  useCategoryStore().reset();
  useSiteStore().reset();
  useSettingsStore().reset();
  useNotificationStore().reset();
  useTagStore().reset();
}
