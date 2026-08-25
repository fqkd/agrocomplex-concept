export type Product = {
  id: string
  name: string
  detail: string
  price: number
  oldPrice?: number
  category: 'own' | 'ready' | 'milk' | 'meat' | 'bakery'
  tone: string
  glyph: string
  badge?: string
  available?: boolean
}

export const products: Product[] = [
  { id: 'milk', name: 'Молоко 3,2%', detail: '930 мл', price: 94, category: 'milk', tone: '#e4f1e0', glyph: 'milk', badge: 'Своё производство' },
  { id: 'bread', name: 'Хлеб пшеничный', detail: '400 г', price: 58, category: 'bakery', tone: '#f3e1bd', glyph: 'bread', badge: 'Сегодня испечён' },
  { id: 'cutlets', name: 'Котлеты домашние', detail: '4 шт.', price: 289, category: 'ready', tone: '#ead2ba', glyph: 'meal', badge: 'Наша кухня' },
  { id: 'yogurt', name: 'Йогурт натуральный', detail: '300 г', price: 86, oldPrice: 99, category: 'own', tone: '#e8d6e4', glyph: 'yogurt', badge: '−13%' },
  { id: 'chicken', name: 'Филе цыплёнка', detail: '≈ 700 г', price: 374, category: 'meat', tone: '#f5d8ce', glyph: 'chicken', badge: 'Своё производство' },
  { id: 'cheese', name: 'Сыр сливочный', detail: '250 г', price: 219, category: 'milk', tone: '#f5edc9', glyph: 'cheese', available: false },
  { id: 'cheese-alt', name: 'Сыр полутвёрдый', detail: '250 г · замена', price: 209, category: 'milk', tone: '#eee3ad', glyph: 'cheese', badge: 'Подойдёт для завтрака' },
]

export const categoryLabels: Record<string, string> = {
  all: 'Все',
  own: 'Своё',
  ready: 'Наша кухня',
  milk: 'Молочное',
  meat: 'Мясо',
  bakery: 'Выпечка',
}

export const money = (value: number) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽'
