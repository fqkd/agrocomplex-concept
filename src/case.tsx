/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown, ArrowRight, BarChart3, Check, ChevronLeft, ChevronRight,
  CircleAlert, Clock3, CreditCard, Database, Drumstick, Gauge, Layers3, ListChecks, MapPin,
  Milk, PackageCheck, RefreshCcw, Search, ShieldCheck, ShoppingBasket, Smartphone,
  Soup, Sparkles, Store, Truck, UsersRound, Wheat,
} from 'lucide-react'
import './case.css'

const slides = [
  { id: 'cover', label: 'Предложение' },
  { id: 'research', label: 'Исследование' },
  { id: 'growth', label: 'Точки роста' },
  { id: 'idea', label: 'Идея' },
  { id: 'route', label: 'Корзина' },
  { id: 'repeat', label: 'Повтор' },
  { id: 'recover', label: 'Восстановление' },
  { id: 'business', label: 'Связь с бизнесом' },
  { id: 'pilot', label: 'Пилот' },
  { id: 'work', label: 'Наша работа' },
  { id: 'next', label: 'Следующий шаг' },
]

function Case() {
  const [active, setActive] = useState(0)
  const container = useRef<HTMLDivElement>(null)
  const move = (index: number) => document.getElementById(slides[Math.max(0, Math.min(slides.length - 1, index))].id)?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    const root = container.current
    if (!root) return
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(slides.findIndex((s) => s.id === entry.target.id))
    }, { root, threshold: .58 })
    root.querySelectorAll('.case-slide').forEach((el) => observer.observe(el))
    const keys = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); move(active + 1) }
      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); move(active - 1) }
    }
    window.addEventListener('keydown', keys)
    return () => { observer.disconnect(); window.removeEventListener('keydown', keys) }
  }, [active])

  return <div className="case-shell">
    <header className="case-topbar"><a href="#cover" className="case-brand" onClick={(e) => { e.preventDefault(); move(0) }}><span>А</span><b>АГРОКОМПЛЕКС</b><em>инициативная концепция</em></a><a href="../#home" className="prototype-link">Открыть прототип <ArrowRight /></a></header>
    <div className="case-progress"><i style={{ width: `${(active + 1) / slides.length * 100}%` }} /></div>
    <aside className="case-dots" aria-label="Разделы презентации">{slides.map((s, i) => <button key={s.id} className={active === i ? 'active' : ''} aria-label={`${i + 1}. ${s.label}`} onClick={() => move(i)}><span>{String(i + 1).padStart(2, '0')}</span><em>{s.label}</em></button>)}</aside>
    <div className="case-counter"><b>{String(active + 1).padStart(2, '0')}</b><span>/ {String(slides.length).padStart(2, '0')}</span></div>
    <div className="case-nav"><button aria-label="Предыдущий раздел" disabled={active === 0} onClick={() => move(active - 1)}><ChevronLeft /></button><button aria-label="Следующий раздел" disabled={active === slides.length - 1} onClick={() => move(active + 1)}><ChevronRight /></button></div>
    <div className="case-scroll" ref={container}>
      <Cover />
      <Research />
      <Growth />
      <Idea />
      <Route />
      <Repeat />
      <Recover />
      <Business />
      <Pilot />
      <Work />
      <Next />
    </div>
  </div>
}

function Slide({ id, number, eyebrow, title, lead, children, tone = 'light' }: { id: string; number: string; eyebrow: string; title: string; lead?: string; children: ReactNode; tone?: 'light' | 'green' | 'cream' }) {
  return <section id={id} className={`case-slide ${tone}`}><div className="slide-inner"><div className="slide-heading"><span>{number} · {eyebrow}</span><h2>{title}</h2>{lead && <p>{lead}</p>}</div>{children}</div></section>
}

function Cover() {
  return <section id="cover" className="case-slide cover green"><div className="cover-orbit orbit-one" /><div className="cover-orbit orbit-two" /><div className="slide-inner cover-grid"><div className="cover-copy"><span className="case-kicker">Предложение для «Агрокомплекс Выселковский»</span><h1>Регулярная продуктовая корзина — от выбранной точки до согласованной замены</h1><p>Концепция собственного мобильного канала, который помогает повторить привычные покупки, заранее определить наличие и не потерять оформление после ошибки.</p><div className="cover-actions"><a className="case-button lime" href="../#location">Пройти основной сценарий <ArrowRight /></a><a className="case-button ghost" href="#research">Что изучено <ArrowDown /></a></div><small>Инициативная концепция ООО «ЭРГОХАВЭН» · август 2026</small></div><GroceryPhone /></div></section>
}

function Research() {
  return <Slide id="research" number="01" eyebrow="Что изучено" title="Берём только актуальные факты из публичных сервисов" lead="Проверили официальные страницы и выгрузку локатора 23 августа 2026 года. В интерфейсе используется воспроизводимый снимок 783 опубликованных точек.">
    <div className="research-grid"><Fact icon={<Wheat />} metric="1993" title="Создание компании" text="Официальный интернет-магазин называет «Агрокомплекс» одним из крупнейших агропромышленных холдингов России." /><Fact icon={<MapPin />} metric="28" title="Зон доставки" text="На странице доставки перечислены 28 населённых пунктов и территорий; условия зависят от доступной зоны." /><Fact icon={<Truck />} metric="9–22" title="Опубликованные интервалы" text="Доставка ежедневно; последний интервал доступен не во всех городах." /><Fact icon={<Smartphone />} metric="APK" title="Публичная Android-сборка" text="Официальный сайт распространяет приложение напрямую; файл обновлён 5 августа 2025 года." /></div>
    <div className="source-strip"><ShieldCheck /><p><b>Подтверждено:</b> интернет-магазин, курьерская доставка, категории «Наша кухня», собственное производство и программа лояльности. <a href="https://agrokomplexshop.ru/" target="_blank" rel="noreferrer">Официальный сайт</a></p></div>
  </Slide>
}

function Growth() {
  return <Slide id="growth" number="02" eyebrow="Проверяемые точки роста" title="Регулярной покупке нужен сохранённый контекст" lead="Это продуктовые гипотезы. Их частоту и влияние нужно подтвердить по внутренней аналитике, обращениям поддержки и интервью.">
    <div className="growth-layout"><div className="growth-list"><GrowthRow n="01" title="Контекст до корзины" text="Сначала адрес или магазин — затем доступные цены и наличие для выбранной точки." /><GrowthRow n="02" title="Повтор с новой проверкой" text="Перед добавлением прошлой корзины проверить цену, доступность и весовые позиции." /><GrowthRow n="03" title="Решение при отсутствии" text="Предложить правило замены до оформления и продолжить с сохранённой корзиной." /><GrowthRow n="04" title="Восстановление после ошибки" text="Сохранить корзину, время, адрес и выбранную замену внутри сессии." /></div><div className="hypothesis-card"><span>Гипотеза пилота</span><h3>Сравнить завершение покупки при разном числе повторных действий</h3><p>Фиксируем одинаковую задачу и сравниваем прохождение до и после пилота.</p><BarChart3 /></div></div>
  </Slide>
}

function Idea() {
  return <Slide id="idea" number="03" eyebrow="Основная идея" title="Один интерфейс для заказа домой и списка в фирменный магазин" lead="Приложение запоминает способ получения, но не смешивает разные контексты наличия.">
    <div className="idea-map"><div className="idea-center"><span>А</span><b>Моя регулярная покупка</b><small>сохранённый контекст</small></div><IdeaNode icon={<MapPin />} title="Адрес или магазин" text="до каталога" pos="one" /><IdeaNode icon={<Search />} title="Каталог точки" text="цена и наличие" pos="two" /><IdeaNode icon={<RefreshCcw />} title="Повтор корзины" text="с перепроверкой" pos="three" /><IdeaNode icon={<ListChecks />} title="Список в магазин" text="отдельный режим" pos="four" /></div>
    <div className="principles"><p><b>Первое действие</b><span>Выбрать контекст покупки</span></p><p><b>Главный приоритет</b><span>Регулярная корзина</span></p><p><b>Состояние</b><span>Сохраняется в сессии</span></p></div>
  </Slide>
}

function Route() {
  return <Slide id="route" number="04" eyebrow="Ключевой сценарий № 1" title="Путь от реальной точки до подтверждения не заставляет возвращаться к началу" lead="Интерактивная карта использует 783 точки официального локатора: кластеры сохраняют обзор, поиск синхронизирует карточку и маркер, геолокация запускается только по запросу.">
    <div className="route-track"><RouteStep n="1" icon={<MapPin />} title="Карта" text="официальный магазин или адрес" /><RouteStep n="2" icon={<ShoppingBasket />} title="Корзина" text="каталог и товары" /><RouteStep n="3" icon={<PackageCheck />} title="Замена" text="правило до оплаты" /><RouteStep n="4" icon={<Truck />} title="Получение" text="способ и время" /><RouteStep n="5" icon={<Check />} title="Результат" text="без реальной отправки" /></div>
    <div className="scenario-band"><div><span>Что становится проще</span><h3>Пользователь видит, к какой точке относятся цена и наличие</h3></div><a className="case-button dark" href="../#location">Посмотреть сценарий <ArrowRight /></a></div>
  </Slide>
}

function Repeat() {
  return <Slide id="repeat" number="05" eyebrow="Ключевой сценарий № 2" title="Прошлая корзина становится списком с актуальной проверкой" lead="Перед добавлением показываем, что доступно сейчас, где изменилась цена и для какой позиции нужна замена.">
    <div className="repeat-case"><div className="repeat-visual"><div className="basket-stack"><span><Milk /></span><span><Wheat /></span><span><Soup /></span><span className="missing"><Milk /><i>!</i></span></div><div className="repeat-arrow"><RefreshCcw /></div><div className="repeat-result"><b>3 товара доступны</b><span>1 требует решения</span><small>4 товара · 5 единиц</small></div></div><div className="repeat-copy"><h3>Проверяем до добавления</h3><ul><li><Check /> выбранный адрес или магазин</li><li><Check /> текущую доступность позиции</li><li><Check /> цену и количество</li><li><Check /> необходимость замены</li></ul><a className="case-button dark" href="../#repeat">Повторить корзину <ArrowRight /></a></div></div>
  </Slide>
}

function Recover() {
  return <Slide id="recover" number="06" eyebrow="Ключевой сценарий № 3" title="Ошибка оплаты не обнуляет уже принятые решения" lead="Сценарий недоступности банка показывает восстановление без повторного сбора корзины.">
    <div className="recover-grid"><div className="recover-phone" aria-label="Макет состояния ошибки"><span className="error-symbol"><CircleAlert /></span><h3>Платёж не завершён</h3><p>Корзина, адрес, время и замена сохранены</p><div><Check /> 4 параметра готовы</div><span className="mock-button">Повторить оплату</span></div><div className="saved-flow"><Saved icon={<ShoppingBasket />} title="Товары" /><Saved icon={<MapPin />} title="Адрес" /><Saved icon={<Clock3 />} title="Время" /><Saved icon={<PackageCheck />} title="Замена" /><ArrowDown /><strong>Возврат к оплате</strong></div></div>
    <div className="dual-actions"><a className="case-button dark" href="../#catalog">Собрать корзину и проверить <ArrowRight /></a><a className="case-button outline" href="../#product:cheese">Добавить товар для замены</a></div>
  </Slide>
}

function Business() {
  return <Slide id="business" number="07" eyebrow="Связь с бизнесом" title="Структура учитывает и производство, и широкую розницу, и ежедневный спрос" lead="Аргументация строится на особенностях «Агрокомплекса», опубликованных в официальных материалах.">
    <div className="business-grid"><BusinessCard icon={<Wheat />} n="01" title="Собственное производство" text="Отдельный вход в подборку и понятное происхождение товара — без выдуманных характеристик." /><BusinessCard icon={<Store />} n="02" title="Фирменные магазины" text="Список для посещения магазина живёт рядом с онлайн-корзиной и остаётся самостоятельным сценарием." /><BusinessCard icon={<Truck />} n="03" title="Доставка по зонам" text="Сначала адрес и доступность, затем каталог; рабочая география зависит от действующих правил." /><BusinessCard icon={<RefreshCcw />} n="04" title="Повторяемые покупки" text="Главный экран начинает с привычной корзины, списка и карты." /></div>
    <div className="business-links"><a href="../#shopping-list">Список для магазина <ArrowRight /></a><a href="../#loyalty">Карта лояльности <ArrowRight /></a></div>
  </Slide>
}

function Pilot() {
  return <Slide id="pilot" number="08" eyebrow="Предлагаемый пилот" title="Сравнить два сценария на одной аудитории и реальных правилах наличия" lead="Начать можно без полной замены действующего контура — с приоритетных путей и согласованного набора интеграций.">
    <div className="pilot-grid"><div className="pilot-plan"><PilotStep n="01" title="Подтвердить правила" text="Наличие, замены, весовые товары, лояльность и способы получения." /><PilotStep n="02" title="Собрать пилот" text="Регулярная корзина + восстановление оформления + список магазина." /><PilotStep n="03" title="Сравнить" text="Текущий публичный сценарий и пилот на одинаковых задачах." /></div><div className="metric-board"><span>Показатели без целевых процентов</span><Metric icon={<Gauge />} text="Время и число шагов" /><Metric icon={<Check />} text="Завершение оформления" /><Metric icon={<RefreshCcw />} text="Успешный повтор корзины" /><Metric icon={<PackageCheck />} text="Принятие замены" /><Metric icon={<CreditCard />} text="Доля восстановленных корзин" /><Metric icon={<Store />} text="Использование самовывоза" /></div></div>
  </Slide>
}

function Work() {
  return <Slide id="work" number="09" eyebrow="Что берём на себя" title="От проверки гипотез до публикации и поддержки продукта" lead="ООО «ЭРГОХАВЭН» — аккредитованная ИТ-компания из Краснодара.">
    <div className="work-track"><WorkStage icon={<Search />} title="Продуктовая аналитика" text="Сценарии, данные, ограничения" /><WorkStage icon={<Layers3 />} title="UX/UI-дизайн" text="Прототип и дизайн-система" /><WorkStage icon={<Database />} title="Разработка и интеграции" text="Мобильный контур и API" /><WorkStage icon={<ShieldCheck />} title="Публикация" text="Магазины приложений и QA" /><WorkStage icon={<UsersRound />} title="Поддержка" text="Обновления и развитие" /></div>
    <div className="work-note"><Sparkles /><p><b>Начать с пилота</b><br />Можно выбрать несколько приоритетных сценариев, проверить их на данных компании и только затем расширять контур.</p></div>
  </Slide>
}

function Next() {
  return <section id="next" className="case-slide next green"><div className="slide-inner next-grid"><div><span className="case-kicker">Следующий шаг</span><h2>Покажем прототип лично и вместе выберем границы пилота</h2><p>Предлагаем начать с пилота по регулярной корзине, замене отсутствующего товара, восстановлению оплаты и списку для магазина. На встрече пройдём эти пути и зафиксируем вопросы к внутренним данным.</p><div className="next-actions"><a className="case-button lime" href="mailto:hello@eh.works?subject=Концепция%20приложения%20Агрокомплекс">Обсудить концепцию <ArrowRight /></a><a className="case-button ghost" href="../#home">Открыть прототип</a></div></div><div className="contact-card"><span>ООО «ЭРГОХАВЭН»</span><h3>Аккредитованная ИТ-компания из Краснодара</h3><p>Продуктовая аналитика · UX/UI-дизайн · разработка · интеграции · публикация · обновления · техническая поддержка</p><a href="mailto:hello@eh.works">hello@eh.works</a><a href="https://eh.works" target="_blank" rel="noreferrer">eh.works</a><a href="https://t.me/andrey_ergohaven" target="_blank" rel="noreferrer">Telegram · @andrey_ergohaven</a><a href="https://max.ru/id5041212966_biz" target="_blank" rel="noreferrer">MAX · +7 988 154-04-00</a><small>Можем лично приехать и показать прототип.</small></div></div></section>
}

function GroceryPhone() { return <div className="grocery-phone" aria-label="Макет главного экрана"><div className="phone-status"><span>9:41</span><span>● ●</span></div><div className="phone-location"><MapPin /><span><small>Доставка · Краснодар</small><b>ул. Солнечная, 12</b></span></div><div className="phone-hero"><span>Регулярная корзина</span><h3>4 товара · 5 единиц</h3><span className="mock-button">Повторить</span><div><Milk /><Wheat /><Drumstick /></div></div><div className="phone-quick"><p><RefreshCcw /><b>Повторить</b></p><p><ListChecks /><b>Список</b></p><p><Store /><b>Магазин</b></p></div><h4>Своё производство</h4><div className="phone-products"><span><Milk /><b>94 ₽*</b></span><span><Wheat /><b>58 ₽*</b></span></div><small>* концептуальные цены</small></div> }
function Fact({ icon, metric, title, text }: { icon: ReactNode; metric: string; title: string; text: string }) { return <article className="fact-card"><div>{icon}<strong>{metric}</strong></div><h3>{title}</h3><p>{text}</p></article> }
function GrowthRow({ n, title, text }: { n: string; title: string; text: string }) { return <article><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article> }
function IdeaNode({ icon, title, text, pos }: { icon: ReactNode; title: string; text: string; pos: string }) { return <div className={`idea-node ${pos}`}><i>{icon}</i><b>{title}</b><small>{text}</small></div> }
function RouteStep({ n, icon, title, text }: { n: string; icon: ReactNode; title: string; text: string }) { return <article><span>{n}</span><i>{icon}</i><h3>{title}</h3><p>{text}</p></article> }
function Saved({ icon, title }: { icon: ReactNode; title: string }) { return <span>{icon}<b>{title}</b><Check /></span> }
function BusinessCard({ icon, n, title, text }: { icon: ReactNode; n: string; title: string; text: string }) { return <article><div>{icon}<span>{n}</span></div><h3>{title}</h3><p>{text}</p></article> }
function PilotStep({ n, title, text }: { n: string; title: string; text: string }) { return <article><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></article> }
function Metric({ icon, text }: { icon: ReactNode; text: string }) { return <p>{icon}<b>{text}</b></p> }
function WorkStage({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <article><i>{icon}</i><h3>{title}</h3><p>{text}</p></article> }

createRoot(document.getElementById('root')!).render(<Case />)
