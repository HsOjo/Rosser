const messages: Record<string, Record<string, string>> = {
  "zh-CN": {
    "notification.articles.new": "{{subscription}} 新增 {{count}} 篇文章",
    "notification.fetch.error": "{{subscription}} 抓取失败",
  },
  "en": {
    "notification.articles.new": "{{subscription}} has {{count}} new articles",
    "notification.fetch.error": "{{subscription}} fetch failed",
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
