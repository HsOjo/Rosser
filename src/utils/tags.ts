// 内置标签配置（简化版，映射现有状态）
export interface Tag {
  id: string
  name: string
  color: string
  icon?: string
  isBuiltIn: boolean
}

export const builtInTags: Tag[] = [
  {
    id: 'star',
    name: '收藏',
    color: '#faad14',
    icon: 'star',
    isBuiltIn: true,
  },
  {
    id: 'hide',
    name: '隐藏',
    color: '#8c8c8c',
    icon: 'eye-invisible',
    isBuiltIn: true,
  },
]

// 根据文章状态获取对应的标签
export function getArticleTags(state: {is_star?: boolean, is_hide?: boolean}): Tag[] {
  const tags: Tag[] = []
  if (state?.is_star) {
    tags.push(builtInTags.find(t => t.id === 'star')!)
  }
  if (state?.is_hide) {
    tags.push(builtInTags.find(t => t.id === 'hide')!)
  }
  return tags
}
