interface BaseModel {
  id: number
  created_time: string
  updated_time: string
}

export interface Subscription extends BaseModel {
  site_id: number
  category_id: number
  title: string
  url: string
  description: string
}

export interface Site extends BaseModel {
  url: string
  title: string
  favicon_id: number
}

export interface Category extends BaseModel {
  title: string
  description: string
}

export interface ArticleState extends BaseModel {
  article_id: number
  is_read: boolean
  is_hide: boolean
  is_star: boolean
}

export interface Article extends BaseModel {
  subscription_id: number
  thumb_id: number
  hash: string
  title: string
  summary: string
  link: string
  publish_time: string
  meta: object
  state: ArticleState
}
