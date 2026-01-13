import i18n from '@/locales'

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const t = i18n.global.t

  if (diffSeconds < 60) {
    return t('time.justNow')
  } else if (diffMinutes < 60) {
    return t('time.minutesAgo', {n: diffMinutes})
  } else if (diffHours < 24) {
    return t('time.hoursAgo', {n: diffHours})
  } else if (diffDays === 1) {
    return t('time.yesterday')
  } else if (diffDays < 30) {
    return t('time.daysAgo', {n: diffDays})
  } else {
    // 超过30天显示具体日期
    return date.toLocaleDateString()
  }
}
