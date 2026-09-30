import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BadgePercent, Barcode, Check, ChevronDown, ChevronRight,
  CircleAlert, Clock3, CreditCard, Heart, Home, ListChecks, LoaderCircle, MapPin,
  Drumstick, Milk, Minus, PackageCheck, Plus, QrCode, RefreshCcw, Search, ShoppingBasket, ShoppingCart,
  Soup, Sparkles, Store, Truck, UserRound, WalletCards, Wheat, WifiOff, X,
} from 'lucide-react'
import { LocationMap } from './LocationMap'
import { agroStores } from './agroStores'
import { categoryLabels, money, products, type Product } from './data'
import { formatSlot, isSlotAvailable, recommendedSlot, slotDateKey, slotTimes } from './slots'

type Route = 'home' | 'location' | 'catalog' | 'cart' | 'substitution' | 'checkout' |
  'payment-error' | 'success' | 'repeat' | 'shopping-list' | 'loyalty' | 'offers' | 'profile'

type Session = {
  city: string
  address: string
  store: string
  storeId: string
  fulfillment: 'delivery' | 'pickup'
  cart: Record<string, number>
  substitution: string | null
  slot: string
  slotDate: string
  listDone: string[]
  listCustom: string[]
}

type OrderRecord = {
  id: string
  createdAt: string
  cart: Record<string, number>
  fulfillment: 'delivery' | 'pickup'
  slotDate: string
  slot: string
}

const readOrders = (): OrderRecord[] => {
  try {
    const value = JSON.parse(localStorage.getItem('agro-demo-orders') || '[]')
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

const normalizeStoreText = (value = '') => value
  .replace(/\s+/g, ' ')
  .replace(/\bг\.\s*/gi, '')
  .replace(/\b(ул|пр|пер|пл|д|кв)\.\s*/gi, '$1. ')
  .replace(/\s*,\s*/g, ', ')
  .replace(/\s*:\s*/g, ':')
  .trim()

const normalizedStores = agroStores.map((store) => ({
  ...store,
  city: normalizeStoreText(store.city),
  address: normalizeStoreText(store.address),
  meta: normalizeStoreText(store.meta).replace(/, выходные: Без выходных/gi, ' · без выходных'),
}))

const initial: Session = {
  city: 'Краснодар',
  address: 'ул. Солнечная, 12',
  store: normalizedStores[0].address,
  storeId: normalizedStores[0].id,
  fulfillment: 'delivery',
  cart: {},
  substitution: null,
  ...recommendedSlot(),
  listDone: [],
  listCustom: [],
}

const scenarioCart: Record<string, number> = { milk: 2, bread: 1, cutlets: 1, cheese: 1 }

const routeFromHash = (): { route: Route; id?: string; orderId?: string } => {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home'
  const value = raw.split('?')[0]
  if (value.startsWith('product:')) return { route: 'catalog', id: value.split(':')[1] }
  const known: Route[] = ['home', 'location', 'catalog', 'cart', 'substitution', 'checkout', 'payment-error', 'success', 'repeat', 'shopping-list', 'loyalty', 'offers', 'profile']
  return known.includes(value as Route) ? { route: value as Route, orderId: new URLSearchParams(raw.split('?')[1] || '').get('id') || undefined } : { route: 'home' }
}

const readSession = (): Session => {
  try {
    const restored = { ...initial, ...JSON.parse(localStorage.getItem('agro-demo-session') || '{}') } as Session
    restored.address = restored.address.replace('Демо-адрес · ', '')
    if (!normalizedStores.some((store) => store.id === restored.storeId)) {
      const match = normalizedStores.find((store) => store.address === restored.store)
      restored.storeId = match?.id ?? normalizedStores[0].id
      restored.store = match?.address ?? normalizedStores[0].address
    }
    const { route } = routeFromHash()
    const cartCount = Object.values(restored.cart).reduce((sum, count) => sum + count, 0)

    // Direct links from the case must open a meaningful state, even in a clean browser.
    if (route === 'substitution' && !restored.cart.cheese) {
      restored.cart = { ...restored.cart, cheese: 1 }
      restored.substitution = null
    }
    if (['checkout', 'payment-error'].includes(route) && cartCount === 0) {
      restored.cart = { ...scenarioCart }
      restored.substitution = 'alt'
    }
    return restored
  } catch {
    return initial
  }
}

const go = (route: string) => {
  const current = window.location.hash.replace(/^#\/?/, '') || 'home'
  if (current !== route) {
    try {
      const stack = JSON.parse(sessionStorage.getItem('agro-demo-history') || '[]') as string[]
      sessionStorage.setItem('agro-demo-history', JSON.stringify([...stack.slice(-14), current]))
    } catch { /* the prototype still navigates when storage is unavailable */ }
  }
  window.location.hash = route
}

const goBack = () => {
  try {
    const stack = JSON.parse(sessionStorage.getItem('agro-demo-history') || '[]') as string[]
    const target = stack.pop() || 'home'
    sessionStorage.setItem('agro-demo-history', JSON.stringify(stack))
    window.location.hash = target
  } catch { window.location.hash = 'home' }
}

export function App() {
  const [location, setLocation] = useState(routeFromHash)
  const [session, setSession] = useState<Session>(readSession)
  const [orders, setOrders] = useState<OrderRecord[]>(readOrders)

  useEffect(() => {
    const onHash = () => setLocation(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const shell = document.querySelector('.phone-shell')
    if (shell && 'scrollTo' in shell && typeof shell.scrollTo === 'function') shell.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.route, location.id])

  useEffect(() => {
    localStorage.setItem('agro-demo-session', JSON.stringify(session))
  }, [session])
  useEffect(() => localStorage.setItem('agro-demo-orders', JSON.stringify(orders)), [orders])

  const confirmOrder = () => {
    const id = crypto.randomUUID()
    const order: OrderRecord = { id, createdAt: new Date().toISOString(), cart: { ...session.cart }, fulfillment: session.fulfillment, slotDate: session.slotDate, slot: session.slot }
    setOrders((current) => [order, ...current])
    go(`success?id=${id}`)
  }

  const update = (patch: Partial<Session>) => setSession((current) => ({ ...current, ...patch }))
  const add = (id: string, amount = 1) => setSession((current) => {
    const currentCount = current.cart[id] || 0
    return {
      ...current,
      cart: { ...current.cart, [id]: Math.max(0, currentCount + amount) },
      substitution: id === 'cheese' && amount > 0 && currentCount === 0 ? null : current.substitution,
    }
  })
  const cartCount = Object.values(session.cart).reduce((sum, count) => sum + count, 0)

  let content: ReactNode
  if (location.id) content = <ProductScreen product={products.find((p) => p.id === location.id) || products[0]} count={session.cart[location.id] || 0} add={add} />
  else {
    switch (location.route) {
      case 'location': content = <LocationScreen session={session} update={update} />; break
      case 'catalog': content = <CatalogScreen session={session} add={add} />; break
      case 'cart': content = <CartScreen session={session} add={add} />; break
      case 'substitution': content = <SubstitutionScreen session={session} update={update} />; break
      case 'checkout': content = <CheckoutScreen session={session} update={update} />; break
      case 'payment-error': content = <PaymentError session={session} onRetry={confirmOrder} />; break
      case 'success': content = <SuccessScreen order={orders.find((order) => order.id === location.orderId)} clear={() => update({ cart: {}, substitution: null })} />; break
      case 'repeat': content = <RepeatScreen orders={orders} update={update} />; break
      case 'shopping-list': content = <ShoppingListScreen session={session} update={update} />; break
      case 'loyalty': content = <LoyaltyScreen />; break
      case 'offers': content = <OffersScreen add={add} />; break
      case 'profile': content = <ProfileScreen />; break
      default: content = <HomeScreen session={session} add={add} />
    }
  }

  const hideNav = ['location', 'cart', 'substitution', 'checkout', 'payment-error', 'success', 'repeat', 'shopping-list'].includes(location.route) || Boolean(location.id)
  return (
    <main className="app-stage">
      <div className="phone-shell">
        {content}
        {!hideNav && <BottomNav route={location.route} count={cartCount} />}
      </div>
    </main>
  )
}

function Header({ title, back = true, action }: { title: string; back?: boolean; action?: ReactNode }) {
  return <header className="app-header">
    {back ? <button className="icon-btn" aria-label="Назад" onClick={goBack}><ArrowLeft /></button> : <div className="brand-mark" aria-label="Агрокомплекс"><span>А</span></div>}
    <h1>{title}</h1>
    <div className="header-action">{action}</div>
  </header>
}

function HomeScreen({ session, add }: { session: Session; add: (id: string, amount?: number) => void }) {
  return <div className="screen home-screen">
    <Header title="Агрокомплекс" back={false} action={<button className="icon-btn" aria-label="Профиль" onClick={() => go('profile')}><UserRound /></button>} />
    <button className="location-bar" onClick={() => go('location')}>
      <span className="location-icon"><MapPin size={18} /></span>
      <span><small>{session.fulfillment === 'delivery' ? 'Доставка' : 'Самовывоз'} · {session.city}</small><b>{session.fulfillment === 'delivery' ? session.address : session.store}</b></span>
      <ChevronDown size={18} />
    </button>
    <section className="hero-grocery">
      <div><span className="eyebrow">Регулярная корзина</span><h1>Привычные продукты — без повторного поиска</h1><p>Проверим наличие и предложим замену до оформления.</p><button className="button light" onClick={() => go('repeat')}>Повторить корзину <ArrowRight size={17} /></button></div>
      <div className="crate" aria-hidden="true"><Milk /><Wheat /><Soup /><Drumstick /></div>
    </section>
    <div className="quick-grid">
      <Quick icon={<RefreshCcw />} label="Повторить" meta="4 товара · 5 ед." onClick={() => go('repeat')} />
      <Quick icon={<Barcode />} label="Моя карта" meta="1 240 бонусов*" onClick={() => go('loyalty')} />
      <Quick icon={<ListChecks />} label="Список" meta={`${session.listDone.length} из 6`} onClick={() => go('shopping-list')} />
    </div>
    <SectionTitle title="Купить быстрее" action="В каталог" onClick={() => go('catalog')} />
    <div className="category-tiles">
      <button className="category-tile own" onClick={() => go('catalog?own')}><span><Wheat /></span><b>Своё производство</b><small>От поля до полки</small></button>
      <button className="category-tile ready" onClick={() => go('catalog?ready')}><span><Soup /></span><b>Наша кухня</b><small>Готово к столу</small></button>
    </div>
    <SectionTitle title="Сегодня для вас" action="Все акции" onClick={() => go('offers')} />
    <div className="product-row">{products.slice(0, 3).map((p) => <ProductCard key={p.id} product={p} add={add} />)}</div>
  </div>
}

function Quick({ icon, label, meta, onClick }: { icon: ReactNode; label: string; meta: string; onClick: () => void }) {
  return <button className="quick-card" onClick={onClick}><span>{icon}</span><b>{label}</b><small>{meta}</small></button>
}

function SectionTitle({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return <div className="section-title"><h2>{title}</h2>{action && <button onClick={onClick}>{action} <ChevronRight size={16} /></button>}</div>
}

function LocationScreen({ session, update }: { session: Session; update: (p: Partial<Session>) => void }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const nextSlot = recommendedSlot(now)
  const [mode, setMode] = useState(session.fulfillment)
  const [city, setCity] = useState(session.city)
  const [address, setAddress] = useState(session.address)
  const [selectedStoreId, setSelectedStoreId] = useState(session.storeId)
  const [storeValid, setStoreValid] = useState(true)
  const cityNeedle = city.toLocaleLowerCase('ru').replace('ё', 'е')
  const stores = city === 'Все точки'
    ? normalizedStores
    : normalizedStores.filter((store) => [store.city, store.address].some((value) => value?.toLocaleLowerCase('ru').replace('ё', 'е').includes(cityNeedle)))
  const selectedPoint = stores.find((store) => store.id === selectedStoreId)
  return <div className="screen">
    <Header title="Как получите покупки?" />
    <div className="segmented"><button className={mode === 'delivery' ? 'active' : ''} onClick={() => setMode('delivery')}><Truck /> Доставка</button><button className={mode === 'pickup' ? 'active' : ''} onClick={() => setMode('pickup')}><Store /> Самовывоз</button></div>
    <div className="content-pad">
      <label className="field-label">Город</label>
      <div className="chips">{[
        ['Краснодар', 'Краснодар'],
        ['Ростов-на-Дону', 'Ростов-на-Дону'],
        ['Ставрополь', 'Ставрополь'],
        ['Все точки', `Все ${normalizedStores.length} точки`],
      ].map(([value, label]) => <button key={value} className={city === value ? 'selected' : ''} onClick={() => { setCity(value); const next = value === 'Все точки' ? normalizedStores : normalizedStores.filter((store) => [store.city, store.address].some((text) => text?.toLocaleLowerCase('ru').replace('ё', 'е').includes(value.toLocaleLowerCase('ru').replace('ё', 'е')))); setSelectedStoreId(next[0]?.id ?? '') }}>{label}</button>)}</div>
      {mode === 'delivery' ? <>
        <label className="field-label" htmlFor="address">Адрес доставки</label>
        <div className="input-with-icon"><MapPin /><input id="address" value={address} onChange={(e) => setAddress(e.target.value)} aria-label="Адрес доставки" /></div>
        <div className="notice"><Clock3 /><span><b>Ближайший интервал</b><small>{formatSlot(nextSlot.slotDate, nextSlot.slot)}</small></span></div>
      </> : <>
        <LocationMap
          points={stores}
          selectedId={selectedPoint?.id ?? ''}
          onSelect={(store) => setSelectedStoreId(store.id)}
          onValidityChange={setStoreValid}
          title={`Фирменные магазины · ${stores.length}`}
        />
      </>}
      <div className="context-note"><PackageCheck /><p><b>Сначала контекст — потом каталог</b><br />Цены и наличие будут показаны для выбранного адреса или магазина.</p></div>
    </div>
    <div className="sticky-action"><button className="button primary full" disabled={(mode === 'delivery' && address.trim().length < 6) || (mode === 'pickup' && (!selectedPoint || !storeValid))} onClick={() => { update({ fulfillment: mode, city: city === 'Все точки' ? (selectedPoint?.city ?? 'Выбранный магазин') : city, address: address.trim(), store: selectedPoint?.address ?? session.store, storeId: selectedPoint?.id ?? session.storeId }); go('catalog') }}>Показать доступный каталог</button></div>
  </div>
}

function ProductArt({ product, compact = false }: { product: Product; compact?: boolean }) {
  const icon = product.category === 'milk' ? <Milk /> : product.category === 'bakery' ? <Wheat /> : product.category === 'meat' ? <Drumstick /> : <Soup />
  return <span className={'product-art ' + (compact ? 'compact' : '')} aria-hidden="true">{icon}<i>{product.name.split(' ')[0]}</i></span>
}

function CatalogScreen({ session, add }: { session: Session; add: (id: string, amount?: number) => void }) {
  const hashQuery = window.location.hash.split('?')[1]
  const [category, setCategory] = useState(hashQuery && categoryLabels[hashQuery] ? hashQuery : 'all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const visible = products.filter((p) => p.id !== 'cheese-alt' && (category === 'all' || p.category === category || (category === 'own' && p.badge?.includes('Своё'))) && p.name.toLowerCase().includes(query.toLowerCase()))
  const refresh = () => { setLoading(true); setTimeout(() => setLoading(false), 650) }
  return <div className="screen catalog-screen">
    <Header title="Каталог" action={<button className="icon-btn" aria-label="Обновить наличие" onClick={refresh}><RefreshCcw /></button>} />
    <button className="catalog-context" onClick={() => go('location')}><MapPin /><span><small>{session.city}</small><b>{session.fulfillment === 'delivery' ? session.address : session.store}</b></span><ChevronRight /></button>
    <div className="search-box"><Search /><input placeholder="Найти продукт" aria-label="Поиск продуктов" value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button aria-label="Очистить поиск" onClick={() => setQuery('')}><X /></button>}</div>
    <div className="chips horizontal">{Object.entries(categoryLabels).map(([id, label]) => <button key={id} className={category === id ? 'selected' : ''} onClick={() => setCategory(id)}>{label}</button>)}</div>
    {loading ? <div className="loading-state" role="status"><LoaderCircle className="spin" /><b>Проверяем наличие</b><small>Для выбранного адреса</small></div> : visible.length ? <div className="catalog-grid">{visible.map((p) => <ProductCard key={p.id} product={p} add={add} />)}</div> : <div className="empty-state"><Search /><h2>Ничего не нашли</h2><p>Попробуйте изменить запрос или открыть все категории.</p><button className="button secondary" onClick={() => { setQuery(''); setCategory('all') }}>Сбросить фильтры</button></div>}
  </div>
}

function ProductCard({ product, add }: { product: Product; add: (id: string, amount?: number) => void }) {
  return <article className={'product-card ' + (!product.available && product.available !== undefined ? 'unavailable' : '')}>
    <button className="product-visual" style={{ background: product.tone }} onClick={() => go(`product:${product.id}`)} aria-label={`Открыть ${product.name}`}><ProductArt product={product} />{product.badge && <em>{product.badge}</em>}</button>
    <button className="product-name" onClick={() => go(`product:${product.id}`)}><b>{product.name}</b><small>{product.detail}</small></button>
    <div className="price-row"><span><b>{money(product.price)}</b>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</span>{product.available === false ? <small className="out">Нет в точке</small> : <button className="add-btn" aria-label={`Добавить ${product.name}`} onClick={() => add(product.id)}><Plus /></button>}</div>
  </article>
}

function ProductScreen({ product, count, add }: { product: Product; count: number; add: (id: string, amount?: number) => void }) {
  const [liked, setLiked] = useState(false)
  return <div className="screen product-screen">
    <Header title="О товаре" action={<button className={'icon-btn ' + (liked ? 'liked' : '')} aria-label={liked ? 'Убрать из избранного' : 'В избранное'} aria-pressed={liked} onClick={() => setLiked(!liked)}><Heart fill={liked ? 'currentColor' : 'none'} /></button>} />
    <div className="product-hero" style={{ background: product.tone }}><ProductArt product={product} /><em>Иллюстрация категории</em></div>
    <div className="content-pad product-copy">{product.badge && <span className="pill">{product.badge}</span>}<h1>{product.name}</h1><p>{product.detail}</p><h2>{money(product.price)}</h2>
      <div className="fact-grid"><div><b>Состав</b><span>Уточняется в карточке товара</span></div><div><b>Наличие</b><span>{product.available === false ? 'Нужна замена' : 'Есть в выбранной точке'}</span></div></div>
      <div className="context-note"><MapPin /><p>Показываем цену и наличие после выбора адреса или магазина. В рабочем продукте данные зависят от интеграций.</p></div>
    </div>
    <div className="sticky-action">{product.available === false ? <button className="button primary full" onClick={() => { add(product.id); go('cart') }}>Добавить в корзину · нужна замена</button> : count ? <div className="counter large"><button aria-label="Уменьшить" onClick={() => add(product.id, -1)}><Minus /></button><b>{count} в корзине</b><button aria-label="Увеличить" onClick={() => add(product.id)}><Plus /></button></div> : <button className="button primary full" onClick={() => add(product.id)}>Добавить · {money(product.price)}</button>}</div>
  </div>
}

function CartScreen({ session, add }: { session: Session; add: (id: string, amount?: number) => void }) {
  const items = Object.entries(session.cart).filter(([, count]) => count > 0).map(([id, count]) => ({ product: products.find((p) => p.id === id)!, count })).filter((x) => x.product)
  const total = items.reduce((sum, x) => sum + x.product.price * x.count, 0)
  const hasUnavailable = items.some((x) => x.product.available === false)
  const hasMissing = hasUnavailable && !session.substitution
  const substitutionCopy = session.substitution === 'contact'
    ? 'Сборщик согласует доступный вариант в чате'
    : 'Сыр полутвёрдый, если основной позиции не будет'
  return <div className="screen cart-screen">
    <Header title="Корзина" action={items.length ? <button className="text-btn" onClick={() => go('catalog')}>Добавить</button> : null} />
    {!items.length ? <div className="empty-state tall"><ShoppingBasket /><h2>Корзина пока пустая</h2><p>Выберите продукты — адрес и параметры получения уже сохранены.</p><button className="button primary" onClick={() => go('catalog')}>Открыть каталог</button></div> : <div className="content-pad">
      <button className="fulfillment-summary" onClick={() => go('location')}><span>{session.fulfillment === 'delivery' ? <Truck /> : <Store />}</span><span><small>{session.fulfillment === 'delivery' ? 'Доставка' : 'Самовывоз'}</small><b>{session.fulfillment === 'delivery' ? session.address : session.store}</b></span><ChevronRight /></button>
      <div className="cart-list">{items.map(({ product, count }) => <div className="cart-item" key={product.id}><div className="mini-visual" style={{ background: product.tone }}><ProductArt product={product} compact /></div><span><b>{product.name}</b><small>{product.detail}</small><strong>{money(product.price * count)}</strong></span><div className="counter"><button aria-label={`Уменьшить ${product.name}`} onClick={() => add(product.id, -1)}><Minus /></button><b>{count}</b><button aria-label={`Увеличить ${product.name}`} onClick={() => add(product.id)}><Plus /></button></div></div>)}</div>
      {hasMissing && <button className="missing-card" onClick={() => go('substitution')}><CircleAlert /><span><b>Для одной позиции нужна замена</b><small>Выберите вариант до оформления</small></span><ChevronRight /></button>}
      {hasUnavailable && session.substitution && <div className="resolved-card"><Check /><span><b>Правило замены сохранено</b><small>{substitutionCopy}</small></span><button onClick={() => go('substitution')}>Изменить</button></div>}
      <div className="receipt"><p><span>Товары</span><b>{money(total)}</b></p><p><span>{session.fulfillment === 'delivery' ? 'Доставка' : 'Самовывоз'}</span><b>{session.fulfillment === 'pickup' || total >= 1500 ? '0 ₽' : '300 ₽'}</b></p><p className="total"><span>Итого</span><b>{money(total + (session.fulfillment === 'delivery' && total < 1500 ? 300 : 0))}</b></p></div>
    </div>}
    {items.length > 0 && <div className="sticky-action"><button className="button primary full" disabled={hasMissing} onClick={() => go('checkout')}>{hasMissing ? 'Сначала выберите замену' : `К оформлению · ${money(total)}`}</button></div>}
  </div>
}

function SubstitutionScreen({ session, update }: { session: Session; update: (p: Partial<Session>) => void }) {
  const [choice, setChoice] = useState(session.substitution || '')
  const base = products.find((p) => p.id === 'cheese')!
  const alt = products.find((p) => p.id === 'cheese-alt')!
  return <div className="screen">
    <Header title="Замена товара" />
    <div className="content-pad">
      <div className="substitution-head"><div className="mini-visual" style={{ background: base.tone }}><ProductArt product={base} compact /></div><span><small>Если не будет в наличии</small><b>{base.name}</b><p>{money(base.price)}</p></span></div>
      <h2 className="sub-title">Как поступить?</h2>
      <button className={'choice-card ' + (choice === 'alt' ? 'selected' : '')} onClick={() => setChoice('alt')}><div className="mini-visual" style={{ background: alt.tone }}><ProductArt product={alt} compact /></div><span><b>Заменить на похожий</b><small>{alt.name} · {money(alt.price)}</small></span><span className="radio">{choice === 'alt' && <Check />}</span></button>
      <button className={'choice-card ' + (choice === 'contact' ? 'selected' : '')} onClick={() => setChoice('contact')}><span className="choice-icon"><UserRound /></span><span><b>Согласовать со мной</b><small>Сборщик предложит вариант в чате</small></span><span className="radio">{choice === 'contact' && <Check />}</span></button>
      <button className={'choice-card ' + (choice === 'skip' ? 'selected' : '')} onClick={() => setChoice('skip')}><span className="choice-icon"><X /></span><span><b>Убрать из заказа</b><small>Остальная корзина сохранится</small></span><span className="radio">{choice === 'skip' && <Check />}</span></button>
      <div className="context-note"><Sparkles /><p>Выбор сохранится и не потребует повторно собирать корзину.</p></div>
    </div>
    <div className="sticky-action"><button className="button primary full" disabled={!choice} onClick={() => {
      const cart = choice === 'skip' ? { ...session.cart, cheese: 0 } : session.cart
      update({ substitution: choice, cart })
      go('cart')
    }}>Сохранить правило замены</button></div>
  </div>
}

function CheckoutScreen({ session, update }: { session: Session; update: (p: Partial<Session>) => void }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const today = slotDateKey(0, now)
  const tomorrow = slotDateKey(1, now)
  const selectDate = (dateKey: string) => {
    const first = slotTimes.find((slot) => isSlotAvailable(dateKey, slot, now))
    if (first) update({ slotDate: dateKey, slot: first })
  }
  const total = Object.entries(session.cart).reduce((sum, [id, count]) => sum + (products.find((p) => p.id === id)?.price || 0) * count, 0)
  const [payment, setPayment] = useState<'card' | 'sbp'>('card')
  const [name, setName] = useState('Андрей')
  const [phone, setPhone] = useState('+7 900 000-00-00')
  const deliveryCost = session.fulfillment === 'delivery' && total < 1500 ? 300 : 0
  const units = Object.values(session.cart).reduce((a, b) => a + b, 0)
  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 11 && isSlotAvailable(session.slotDate, session.slot, now) && Boolean(session.fulfillment === 'delivery' ? session.address : session.storeId)
  return <div className="screen checkout-screen">
    <Header title="Оформление" />
    <div className="content-pad">
      <div className="segmented inline"><button className={session.fulfillment === 'delivery' ? 'active' : ''} onClick={() => update({ fulfillment: 'delivery' })}><Truck /> Доставка</button><button className={session.fulfillment === 'pickup' ? 'active' : ''} onClick={() => update({ fulfillment: 'pickup' })}><Store /> Самовывоз</button></div>
      <button className="checkout-row" onClick={() => go('location')}><span className="row-icon"><MapPin /></span><span><small>{session.fulfillment === 'delivery' ? 'Адрес' : 'Магазин'}</small><b>{session.fulfillment === 'delivery' ? session.address : session.store}</b></span><ChevronRight /></button>
      <div className="checkout-fields"><label><span>Имя получателя</span><input value={name} onChange={(event) => setName(event.target.value)} aria-label="Имя получателя" /></label><label><span>Телефон</span><input value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="Телефон" inputMode="tel" /></label></div>
      <label className="field-label">Время получения</label>
      <div className="segmented inline"><button className={session.slotDate === today ? 'active' : ''} disabled={!slotTimes.some((slot) => isSlotAvailable(today, slot, now))} onClick={() => selectDate(today)}>Сегодня</button><button className={session.slotDate === tomorrow ? 'active' : ''} onClick={() => selectDate(tomorrow)}>Завтра</button></div>
      <div className="slot-grid">{slotTimes.map((slot) => {
        const available = isSlotAvailable(session.slotDate, slot, now)
        return <button key={slot} disabled={!available} className={session.slot === slot && available ? 'selected' : ''} onClick={() => update({ slot })}>{slot}<small>{slot === '20:00–22:00' ? 'нет мест' : available ? 'доступно' : 'время прошло'}</small></button>
      })}</div>
      <label className="field-label">Способ оплаты</label>
      <div className="payment-choice"><button className={payment === 'card' ? 'selected' : ''} onClick={() => setPayment('card')}><CreditCard /><span><b>Банковская карта</b><small>•••• 2026</small></span><Check /></button><button className={payment === 'sbp' ? 'selected' : ''} onClick={() => setPayment('sbp')}><WalletCards /><span><b>СБП</b><small>Оплата по QR</small></span><Check /></button></div>
      <button className="checkout-row" onClick={() => go('loyalty')}><span className="row-icon"><BadgePercent /></span><span><small>Программа лояльности</small><b>Начислить бонусы · условия требуют проверки</b></span><ChevronRight /></button>
      <div className="receipt compact"><p><span>{Object.keys(session.cart).filter((id) => session.cart[id] > 0).length} товара · {units} единиц</span><b>{money(total)}</b></p><p><span>{session.fulfillment === 'delivery' ? 'Доставка' : 'Самовывоз'}</span><b>{deliveryCost ? money(deliveryCost) : '0 ₽'}</b></p><p className="total"><span>Итого</span><b>{money(total + deliveryCost)}</b></p></div>
    </div>
    <div className="sticky-action"><button className="button primary full" disabled={!valid} onClick={() => go('payment-error')}>Перейти к оплате · {money(total + deliveryCost)}</button></div>
  </div>
}

function PaymentError({ session, onRetry }: { session: Session; onRetry: () => void }) {
  const savedCount = session.substitution ? 4 : 3
  const savedCopy = session.substitution
    ? 'Корзина, адрес, время и правило замены сохранены.'
    : 'Корзина, адрес и время сохранены.'
  return <div className="screen status-screen error-screen">
    <Header title="Оплата" />
    <div className="status-content"><span className="status-icon error"><WifiOff /></span><p className="eyebrow">Связь с банком прервалась</p><h1>Платёж не завершён</h1><p>{savedCopy} Можно вернуться без повторного выбора.</p><div className="saved-state"><Check /><span><b>{savedCount} параметра сохранены</b><small>{session.substitution ? 'Товары · получение · время · замена' : 'Товары · получение · время'}</small></span></div></div>
    <div className="sticky-action split"><button className="button primary full" onClick={onRetry}>Повторить оплату</button><button className="button secondary full" onClick={() => go('cart')}>Вернуться в корзину</button></div>
  </div>
}

function SuccessScreen({ order, clear }: { order?: OrderRecord; clear: () => void }) {
  if (!order) return <div className="screen status-screen"><Header title="Заказ" /><div className="status-content"><span className="status-icon error"><CircleAlert /></span><h1>Заказ не найден</h1><p>Оформите заказ из корзины, чтобы увидеть подтверждение.</p></div><div className="sticky-action"><button className="button primary full" onClick={() => go('cart')}>Открыть корзину</button></div></div>
  return <div className="screen status-screen success-screen">
    <Header title="Готово" back={false} />
    <div className="status-content"><span className="status-icon success"><Check /></span><p className="eyebrow">Заказ принят</p><h1>{order.fulfillment === 'delivery' ? 'Доставка подтверждена' : 'Самовывоз подтверждён'}</h1><p>Демонстрационный заказ сохранён в истории этого браузера.</p><div className="order-ticket"><span><small>Номер заказа</small><b>АК · {order.id.slice(0, 8)}</b></span><span><small>Получение</small><b>{formatSlot(order.slotDate, order.slot)}</b></span><span><small>Способ</small><b>{order.fulfillment === 'delivery' ? 'Курьер' : 'Самовывоз'}</b></span></div></div>
    <div className="sticky-action split"><button className="button primary full" onClick={() => { clear(); go('home') }}>На главную</button><button className="button secondary full" onClick={() => go('repeat')}>Повторить позже</button></div>
  </div>
}

function RepeatScreen({ orders, update }: { orders: OrderRecord[]; update: (p: Partial<Session>) => void }) {
  const [selectedId, setSelectedId] = useState(orders[0]?.id || '')
  const selected = orders.find((order) => order.id === selectedId) || orders[0]
  const repeat = selected?.cart || scenarioCart
  const entries = Object.entries(repeat).filter(([id, count]) => count > 0 && products.some((product) => product.id === id))
  const available = entries.filter(([id]) => products.find((product) => product.id === id)?.available !== false).length
  const unavailable = entries.length - available
  const units = entries.reduce((sum, [, count]) => sum + count, 0)
  return <div className="screen">
    <Header title="Повторить покупки" />
    <div className="content-pad">
      <div className="repeat-head"><span><RefreshCcw /></span><div><p className="eyebrow">{selected ? 'История заказов' : 'Пример сценария'}</p><h1>{selected ? 'Повторить выбранный заказ' : 'Как работает повтор корзины'}</h1><p>Перед добавлением проверим цены и наличие для выбранной точки.</p></div></div>
      {orders.length > 1 && <div className="repeat-order-list">{orders.map((order) => <button className={'choice-card ' + (order.id === selected?.id ? 'selected' : '')} key={order.id} onClick={() => setSelectedId(order.id)}><span><b>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }).format(new Date(order.createdAt))}</b><small>{Object.values(order.cart).reduce((sum, count) => sum + count, 0)} ед. · {order.fulfillment === 'delivery' ? 'доставка' : 'самовывоз'}</small></span></button>)}</div>}
      {!selected && <div className="context-note"><CircleAlert /><p>Это демонстрационный набор. После оформления заказа здесь появится ваша история.</p></div>}
      <div className="comparison"><div><small>В заказе</small><b>{entries.length} позиций · {units} ед.</b></div><ArrowRight /><div><small>Для повтора</small><b>Доступно: {available} · замена: {unavailable}</b></div></div>
      <div className="cart-list compact-list">{entries.map(([id, count]) => { const p = products.find((x) => x.id === id)!; return <div className="cart-item" key={id}><div className="mini-visual" style={{ background: p.tone }}><ProductArt product={p} compact /></div><span><b>{p.name}</b><small>{count} шт. · {money(p.price * count)}</small></span>{p.available === false ? <em className="warn-label">Нужна замена</em> : <Check className="available-check" />}</div> })}</div>
      <div className="context-note"><MapPin /><p>Актуальность цены и наличия зависит от данных выбранного магазина.</p></div>
    </div>
    <div className="sticky-action"><button className="button primary full" onClick={() => { update({ cart: repeat, substitution: null }); go(unavailable ? 'substitution' : 'cart') }}>Добавить и проверить наличие</button></div>
  </div>
}

function ShoppingListScreen({ session, update }: { session: Session; update: (p: Partial<Session>) => void }) {
  const [draft, setDraft] = useState('')
  const base = ['Молоко', 'Хлеб', 'Фрукты', 'Крупа', 'Готовый ужин', 'Товары для дома']
  const list = [...base, ...session.listCustom]
  const toggle = (item: string) => update({ listDone: session.listDone.includes(item) ? session.listDone.filter((x) => x !== item) : [...session.listDone, item] })
  return <div className="screen list-screen">
    <Header title="Список для магазина" />
    <div className="content-pad">
      <div className="list-progress"><span><b>{session.listDone.length}</b><small>из {list.length}</small></span><div><i style={{ width: `${session.listDone.length / list.length * 100}%` }} /></div></div>
      <p className="muted">Для похода в магазин · изменения сохраняются автоматически</p>
      <form className="list-add" onSubmit={(event) => { event.preventDefault(); const item = draft.trim(); if (item && !list.includes(item)) update({ listCustom: [...session.listCustom, item] }); setDraft('') }}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Добавить свой товар" aria-label="Новый товар" /><button className="button primary" disabled={!draft.trim()}><Plus /> Добавить</button></form>
      <div className="check-list">{list.map((item) => <div key={item} className={session.listDone.includes(item) ? 'done' : ''}><button aria-label={`${session.listDone.includes(item) ? 'Вернуть' : 'Отметить'} ${item}`} onClick={() => toggle(item)}><span className="checkbox">{session.listDone.includes(item) && <Check />}</span><b>{item}</b><small>{session.listDone.includes(item) ? 'Куплено' : 'Отметить'}</small></button>{session.listCustom.includes(item) && <button className="list-delete" aria-label={`Удалить ${item}`} onClick={() => update({ listCustom: session.listCustom.filter((value) => value !== item), listDone: session.listDone.filter((value) => value !== item) })}><X /></button>}</div>)}</div>
      <button className="text-btn list-clear" disabled={!session.listDone.length && !session.listCustom.length} onClick={() => update({ listDone: [], listCustom: [] })}>Очистить отмеченное и свои товары</button>
      <button className="store-mode-card" onClick={() => go('location')}><Store /><span><b>Открыть режим магазина</b><small>Выбрать ближайшую точку и сверить список</small></span><ChevronRight /></button>
    </div>
    <div className="sticky-action"><button className="button primary full" onClick={() => { update({ cart: {
      ...session.cart,
      milk: Math.max(1, session.cart.milk || 0),
      bread: Math.max(1, session.cart.bread || 0),
      cutlets: Math.max(1, session.cart.cutlets || 0),
    } }); go('cart') }}>Добавить доступное в корзину</button></div>
  </div>
}

function LoyaltyScreen() {
  const [ready, setReady] = useState(false)
  return <div className="screen loyalty-screen">
    <Header title="Моя карта" />
    <div className="loyalty-hero"><span className="loyalty-logo">А</span><small>Баланс карты</small><h1>1 240 <em>бонусов*</em></h1><div className="barcode"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><p>0000 2408 2026</p></div>
    <div className="content-pad"><div className="loyalty-actions"><button aria-pressed={ready} onClick={() => setReady(!ready)}><QrCode /><b>{ready ? 'Карта готова к показу' : 'Показать кассиру'}</b></button><button onClick={() => go('offers')}><BadgePercent /><b>Мои акции</b></button></div>
      <div className="info-card"><Sparkles /><p><b>Условия из открытых правил</b><br />На официальном сайте указано: 10 баллов = 1 ₽, баллами можно оплатить до 30% чека. Перед реализацией правила и интеграции нужно подтвердить.</p></div>
      <div className="history-list"><h2>История операций</h2><p><span><b>Начисление</b><small>Регулярная корзина</small></span><strong>+48</strong></p><p><span><b>Списание</b><small>Фирменный магазин</small></span><strong>−120</strong></p></div>
      <p className="fine-print">* Баланс не связан с реальной программой и показан только как состояние интерфейса.</p>
    </div>
  </div>
}

function OffersScreen({ add }: { add: (id: string, amount?: number) => void }) {
  return <div className="screen offers-screen"><Header title="Для вас" />
    <div className="content-pad"><div className="offer-banner"><span>Персональная подборка</span><h1>Продукты к завтраку</h1><p>Рекомендации на основе повторяемых покупок.</p></div><SectionTitle title="Можно добавить" />
      <div className="catalog-grid">{products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} add={add} />)}</div>
    </div>
  </div>
}

function ProfileScreen() {
  return <div className="screen profile-screen"><Header title="Покупки" />
    <div className="content-pad"><div className="profile-card"><span><UserRound /></span><div><p className="eyebrow">Профиль</p><h1>Андрей</h1><p>+7 900 000-00-00</p></div></div>
      <button className="menu-row" onClick={() => go('repeat')}><RefreshCcw /><span><b>История и повторы</b><small>Собрать прошлую корзину заново</small></span><ChevronRight /></button>
      <button className="menu-row" onClick={() => go('shopping-list')}><ListChecks /><span><b>Списки покупок</b><small>Для онлайн-заказа и магазина</small></span><ChevronRight /></button>
      <button className="menu-row" onClick={() => go('loyalty')}><Barcode /><span><b>Карта лояльности</b><small>Баланс, QR и история</small></span><ChevronRight /></button>
      <button className="menu-row" onClick={() => go('location')}><MapPin /><span><b>Адреса и магазины</b><small>Контекст цен и наличия</small></span><ChevronRight /></button>
      <div className="info-card"><CircleAlert /><p>Все действия остаются внутри браузера. Настоящие заказы, регистрация и оплата не выполняются.</p></div>
    </div></div>
}

function BottomNav({ route, count }: { route: Route; count: number }) {
  const items: { id: Route; label: string; icon: ReactNode }[] = [
    { id: 'home', label: 'Главная', icon: <Home /> }, { id: 'catalog', label: 'Каталог', icon: <Search /> },
    { id: 'cart', label: 'Корзина', icon: <ShoppingCart /> }, { id: 'loyalty', label: 'Карта', icon: <Barcode /> },
    { id: 'profile', label: 'Покупки', icon: <UserRound /> },
  ]
  return <nav className="bottom-nav" aria-label="Основная навигация">{items.map((item) => <button key={item.id} className={route === item.id ? 'active' : ''} onClick={() => go(item.id)}><span>{item.icon}{item.id === 'cart' && count > 0 && <em>{count}</em>}</span><small>{item.label}</small></button>)}</nav>
}
