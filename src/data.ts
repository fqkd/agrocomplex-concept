export type Product = {
  id: string
  name: string
  detail: string
  price: number
  oldPrice?: number
  category: 'own' | 'ready' | 'milk' | 'meat' | 'bakery'
  tone: string
  image: string
  badge?: string
  available?: boolean
}

export const products: Product[] = [
  { id: 'milk', name: 'Молоко 3,2%', detail: '900 мл', price: 94, category: 'milk', tone: '#e4f1e0', image: 'milk.webp', badge: 'Своё производство' },
  { id: 'bread', name: 'Хлеб пшеничный тостовый', detail: '280 г', price: 58, category: 'bakery', tone: '#f3e1bd', image: 'bread.webp' },
  { id: 'cutlets', name: 'Бёдрышки цыплёнка гриль', detail: 'весовой товар', price: 289, category: 'ready', tone: '#ead2ba', image: 'cutlets.webp', badge: 'Наша кухня' },
  { id: 'yogurt', name: 'Йогурт 3,5%', detail: '300 г', price: 86, oldPrice: 99, category: 'own', tone: '#e8d6e4', image: 'yogurt.webp', badge: '−13%' },
  { id: 'chicken', name: 'Филе цыплёнка', detail: 'лоток · весовой товар', price: 374, category: 'meat', tone: '#f5d8ce', image: 'chicken.webp', badge: 'Своё производство' },
  { id: 'cheese', name: 'Сыр сливочный', detail: '180 г', price: 219, category: 'milk', tone: '#f5edc9', image: 'cheese.webp', available: false },
  { id: 'cheese-alt', name: 'Сыр российский молодой', detail: '180 г · замена', price: 209, category: 'milk', tone: '#eee3ad', image: 'cheese-alt.webp', badge: 'Подойдёт для завтрака' },
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
