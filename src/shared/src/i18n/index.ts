const messages: Record<string, Record<string, string>> = {
  "zh-CN": {
    "notification.articles.new": "{{subscription_title}} 新增 {{count}} 篇文章",
    "notification.fetch.error": "{{subscription_title}} 抓取失败",
  },
  "en": {
    "notification.articles.new": "{{subscription_title}} has {{count}} new articles",
    "notification.fetch.error": "{{subscription_title}} fetch failed",
  },
};

export function renderNotification(
  type: string,
  params: Record<string, any> | null | undefined,
  locale = "zh-CN"
): string {
  const key = `notification.${type}`;
  const tmpl = messages[locale]?.[key] || messages["en"]?.[key] || key;
  if (!params) return tmpl;
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ""));
}
