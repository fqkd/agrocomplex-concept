import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const remoteBase = process.env.QA_BASE_URL
const base = remoteBase ? remoteBase.replace(/\/$/, '') : 'http://127.0.0.1:4373/agrocomplex-concept'
let preview

process.on('exit', () => {
  if (preview && !preview.killed) preview.kill('SIGTERM')
})

async function waitForServer(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Сервер не ответил: ${url}`)
}

if (!remoteBase) {
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4373', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  await waitForServer(`${base}/`)
}

await mkdir('qa-output', { recursive: true })
const browser = await chromium.launch({ headless: true })
const report = { base, pages: [], consoleProblems: [], overflows: [], links: [], scenarios: [] }

function watch(page, label) {
  page.on('console', (message) => {
    const sourceUrl = message.location().url
    const belongsToApp = !sourceUrl || sourceUrl.startsWith(base)
    if ((message.type() === 'error' || message.type() === 'warning') && belongsToApp) {
      report.consoleProblems.push(`${label}: ${message.type()} ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => report.consoleProblems.push(`${label}: ${error.message}`))
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(base)) report.consoleProblems.push(`${label}: ${request.url()} ${request.failure()?.errorText ?? 'failed'}`)
  })
}

async function inspect(path, width, height, screenshot) {
  const page = await browser.newPage({ viewport: { width, height } })
  watch(page, `${path} ${width}px`)
  const response = await page.goto(`${base}/${path}`, { waitUntil: 'networkidle' })
  if (!response?.ok()) throw new Error(`${path}: HTTP ${response?.status()}`)
  const state = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    empty: !document.querySelector('#root')?.textContent?.trim(),
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
  }))
  if (state.overflow) report.overflows.push({ path, width })
  if (state.empty) throw new Error(`${path}: пустой #root`)
  if (state.brokenImages.length) throw new Error(`${path}: повреждённые изображения ${state.brokenImages.join(', ')}`)
  if (screenshot) await page.screenshot({ path: `qa-output/${screenshot}-${width}.png`, fullPage: true })
  report.pages.push({ path, width, status: response.status(), overflow: state.overflow })
  await page.close()
}

const prototypeRoutes = [
  '#home', '#location', '#catalog', '#product:milk', '#cart', '#substitution', '#checkout',
  '#payment-error', '#success', '#repeat', '#shopping-list', '#loyalty', '#offers', '#profile',
]
const caseSlides = ['cover', 'research', 'growth', 'idea', 'route', 'repeat', 'recover', 'business', 'pilot', 'work', 'next']

for (const { width, height } of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  for (const route of prototypeRoutes) await inspect(route, width, height, route === '#home' ? 'prototype' : undefined)
}
for (const route of ['#home', '#catalog', '#payment-error']) await inspect(route, 1440, 900)
for (const { width, height } of [
  { width: 768, height: 900 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  const page = await browser.newPage({ viewport: { width, height } })
  watch(page, `case slides ${width}px`)
  const response = await page.goto(`${base}/case/`, { waitUntil: 'networkidle' })
  if (!response?.ok()) throw new Error(`case/: HTTP ${response?.status()}`)
  for (const id of caseSlides) {
    const slide = page.locator(`#${id}`)
    await slide.scrollIntoViewIfNeeded()
    await page.waitForTimeout(120)
    const state = await slide.evaluate((element) => {
      const container = element.closest('.case-scroll')
      const overflowX = container ? getComputedStyle(container).overflowX : 'visible'
      return {
        overflow: Boolean(container && container.scrollWidth > container.clientWidth + 1 && !['hidden', 'clip'].includes(overflowX)),
        empty: !element.textContent?.trim(),
      }
    })
    if (state.overflow) report.overflows.push({ path: `case/#${id}`, width })
    if (state.empty) throw new Error(`case/#${id}: пустой раздел`)
    await slide.screenshot({ path: `qa-output/case-${id}-${width}.png` })
    report.pages.push({ path: `case/#${id}`, width, status: response.status(), overflow: state.overflow })
  }
  await page.close()
}

async function scenario(name, run) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  watch(page, name)
  try {
    await run(page)
    report.scenarios.push({ name, status: 'passed', url: page.url() })
  } finally {
    await page.close()
  }
}

await scenario('официальная карта → поиск → выбор → геолокация', async (page) => {
  await page.context().grantPermissions(['geolocation'], { origin: new URL(base).origin })
  await page.context().setGeolocation({ latitude: 45.035, longitude: 38.974 })
  await page.goto(`${base}/#location`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Самовывоз' }).click()
  const map = page.locator('.eh-location-picker')
  await map.getByLabel('Поиск точки').fill('несуществующий магазин')
  await map.getByText('Ничего не найдено').waitFor()
  await map.getByText('Найдено: 0').waitFor()
  if (await page.getByRole('button', { name: 'Показать доступный каталог' }).isEnabled()) throw new Error('CTA активна при пустом поиске')
  await map.getByRole('button', { name: 'Очистить поиск' }).click()
  await map.getByText(/Найдено: [1-9]/).waitFor()
  await map.getByLabel('Поиск точки').fill('Красная')
  await map.locator('.eh-location-list button').first().click()
  if (await map.locator('.eh-location-list > button').count() > 60) throw new Error('В DOM больше 60 карточек точек')
  if (await map.locator('.leaflet-marker-icon').count() > 120) throw new Error('На карте слишком много одновременных маркеров')
  await map.getByRole('button', { name: /Рядом со мной/ }).click()
  await map.getByText('Список отсортирован по расстоянию').waitFor()
  await page.getByRole('button', { name: 'Показать доступный каталог' }).click()
  await page.locator('.catalog-context small').getByText('Краснодар', { exact: true }).waitFor()

  await page.goto(`${base}/#location`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Самовывоз' }).click()
  await page.getByRole('button', { name: `Все ${783} точки` }).click()
  await page.getByLabel('Поиск точки').fill('Анапа')
  await page.locator('.eh-location-list button').first().waitFor()
})

await scenario('контекст → замена → ошибка → восстановление', async (page) => {
  await page.goto(`${base}/#home`, { waitUntil: 'networkidle' })
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('ул. Солнечная, 12').click()
  await page.getByRole('button', { name: 'Показать доступный каталог' }).click()
  await page.getByRole('button', { name: 'Добавить Молоко 3,2%' }).click()
  await page.getByRole('button', { name: 'Открыть Сыр сливочный' }).click()
  await page.getByRole('button', { name: 'Добавить в корзину · нужна замена' }).click()
  await page.getByRole('button', { name: /Для одной позиции нужна замена/ }).click()
  await page.getByRole('button', { name: /Заменить на похожий/ }).click()
  await page.getByRole('button', { name: 'Сохранить правило замены' }).click()
  await page.getByRole('button', { name: /К оформлению/ }).click()
  await page.getByRole('button', { name: 'Завтра' }).click()
  await page.getByRole('button', { name: /18:00–20:00/ }).click()
  await page.reload({ waitUntil: 'networkidle' })
  if (!(await page.getByRole('button', { name: 'Завтра' }).getAttribute('class')).includes('active')) throw new Error('Дата получения не сохранилась после перезагрузки')
  const selectedSlot = (await page.locator('.slot-grid button.selected').innerText()).slice(0, 11)
  if (selectedSlot !== '18:00–20:00') throw new Error('Интервал получения не сохранился после перезагрузки')
  if (await page.getByRole('button', { name: /20:00–22:00/ }).isEnabled()) throw new Error('Недоступный интервал активен')
  await page.getByRole('button', { name: /Перейти к оплате/ }).click()
  await page.getByRole('heading', { name: 'Платёж не завершён' }).waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByText('Товары · получение · время · замена').waitFor()
  await page.getByRole('button', { name: 'Вернуться в корзину' }).click()
  await page.getByText('Правило замены сохранено').waitFor()
  await page.goBack()
  await page.getByRole('button', { name: 'Повторить оплату' }).click()
  await page.getByRole('heading', { name: 'Доставка подтверждена' }).waitFor()
  if (!(await page.locator('.order-ticket').innerText()).includes(selectedSlot)) throw new Error('Выбранный интервал потерян после оплаты')
})

await scenario('список покупок → свой товар → отметка → очистка', async (page) => {
  await page.goto(`${base}/#shopping-list`, { waitUntil: 'networkidle' })
  await page.getByLabel('Новый товар').fill('Зелень')
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  await page.getByRole('button', { name: 'Отметить Зелень' }).click()
  await page.getByRole('button', { name: 'Очистить отмеченное и свои товары' }).click()
  if (await page.getByText('Зелень').count()) throw new Error('Свой товар не очищен')
})

await scenario('прямые ссылки сохраняются после обновления', async (page) => {
  for (const route of ['#repeat', '#substitution', '#payment-error', '#shopping-list', '#loyalty']) {
    await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    if (new URL(page.url()).hash !== route) throw new Error(`Потерян маршрут ${route}`)
  }
})

await scenario('ссылки презентации и контакты', async (page) => {
  await page.goto(`${base}/case/`, { waitUntil: 'networkidle' })
  const hrefs = await page.locator('a[href]').evaluateAll((items) => items.map((item) => item.getAttribute('href')).filter(Boolean))
  for (const expected of ['../#location', '../#repeat', '../#payment-error', 'mailto:hello@eh.works', 'https://eh.works', 'https://t.me/andrey_ergohaven', 'https://max.ru/id5041212966_biz']) {
    if (!hrefs.includes(expected)) throw new Error(`В презентации нет ссылки ${expected}`)
  }
  for (const href of [...new Set(hrefs.filter((value) => value.startsWith('../#')))]) {
    const response = await page.goto(new URL(href, `${base}/case/`).href, { waitUntil: 'networkidle' })
    if (response && !response.ok()) throw new Error(`${href}: HTTP ${response.status()}`)
    if (!await page.locator('#root').textContent()) throw new Error(`${href}: пустой #root`)
    await page.reload({ waitUntil: 'networkidle' })
    if (!new URL(page.url()).hash) throw new Error(`${href}: потерян hash после обновления`)
    report.links.push({ href, status: response?.status() ?? 'same-document' })
  }
})

await browser.close()
if (preview) preview.kill('SIGTERM')
await writeFile('qa-output/report.json', JSON.stringify(report, null, 2))

if (report.consoleProblems.length || report.overflows.length) {
  throw new Error(`QA не пройден: ${JSON.stringify({ consoleProblems: report.consoleProblems, overflows: report.overflows })}`)
}

console.log(`QA passed: ${prototypeRoutes.length} routes at 360x800, 390x844 and 430x932; desktop; ${caseSlides.length} case slides at 1366x768, 1440x900 and 1920x1080; recovery, deep links, contacts, console and overflow`)
