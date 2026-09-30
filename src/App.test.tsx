import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

describe('ключевые сценарии прототипа', () => {
  afterEach(cleanup)
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.hash = '#home'
  })

  it('открывает каталог после выбора контекста получения', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('ул. Солнечная, 12'))
    await user.click(screen.getByRole('button', { name: 'Показать доступный каталог' }))
    expect(await screen.findByRole('heading', { name: 'Каталог' })).toBeInTheDocument()
  })

  it('сохраняет корзину после демонстрационной ошибки оплаты', async () => {
    const user = userEvent.setup()
    localStorage.setItem('agro-demo-session', JSON.stringify({
      city: 'Краснодар', address: 'Демо-адрес', store: 'Демо-магазин', fulfillment: 'delivery',
      cart: { milk: 1 }, substitution: 'alt', slot: '18:00–20:00', listDone: [],
    }))
    window.location.hash = '#checkout'
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Перейти к оплате/ }))
    expect(await screen.findByText('Платёж не завершён')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart).toEqual({ milk: 1 })
  })

  it('повторяет корзину и ведёт к выбору замены', async () => {
    const user = userEvent.setup()
    window.location.hash = '#repeat'
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Добавить и проверить наличие' }))
    expect(await screen.findByRole('heading', { name: 'Замена товара' })).toBeInTheDocument()
  })

  it('проходит основной путь через замену, ошибку и успешное восстановление', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('ул. Солнечная, 12'))
    await user.click(screen.getByRole('button', { name: 'Показать доступный каталог' }))
    expect(await screen.findByRole('heading', { name: 'Каталог' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Добавить Молоко 3,2%' }))
    await user.click(screen.getByRole('button', { name: 'Открыть Сыр сливочный' }))
    await user.click(await screen.findByRole('button', { name: 'Добавить в корзину · нужна замена' }))
    expect(await screen.findByRole('heading', { name: 'Корзина' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Для одной позиции нужна замена/ }))
    await user.click(await screen.findByRole('button', { name: /Заменить на похожий/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить правило замены' }))

    expect(await screen.findByRole('heading', { name: 'Корзина' })).toBeInTheDocument()
    expect(screen.getByText('Правило замены сохранено')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /К оформлению/ }))
    expect(await screen.findByRole('heading', { name: 'Оформление' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Перейти к оплате/ }))
    expect(await screen.findByText('Платёж не завершён')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart).toEqual({ milk: 1, cheese: 1 })
    await user.click(screen.getByRole('button', { name: 'Повторить оплату' }))
    expect(await screen.findByText('Доставка подтверждена')).toBeInTheDocument()
  })

  it('открывает прямую ссылку ошибки с подготовленным демонстрационным состоянием', async () => {
    window.location.hash = '#payment-error'
    render(<App />)

    expect(await screen.findByText('Платёж не завершён')).toBeInTheDocument()
    expect(screen.getByText('4 параметра сохранены')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart).toEqual({ milk: 2, bread: 1, cutlets: 1, cheese: 1 })
  })

  it('удаляет отсутствующую позицию при выборе варианта без замены', async () => {
    const user = userEvent.setup()
    window.location.hash = '#substitution'
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Убрать из заказа/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить правило замены' }))
    expect(await screen.findByText('Корзина пока пустая')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart.cheese).toBe(0)
  })

  it('не позволяет продолжить доставку с пустым адресом', async () => {
    const user = userEvent.setup()
    window.location.hash = '#location'
    render(<App />)

    await user.clear(screen.getByLabelText('Адрес доставки'))
    expect(screen.getByRole('button', { name: 'Показать доступный каталог' })).toBeDisabled()
  })

  it('показывает загрузку и пустой результат поиска', async () => {
    const user = userEvent.setup()
    window.location.hash = '#catalog'
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Обновить наличие' }))
    expect(screen.getByRole('status')).toHaveTextContent('Проверяем наличие')
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    await user.type(screen.getByLabelText('Поиск продуктов'), 'несуществующий товар')
    expect(await screen.findByText('Ничего не нашли')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    expect(screen.getByRole('button', { name: 'Открыть Молоко 3,2%' })).toBeInTheDocument()
  })

  it('добавляет список покупок, не уменьшая уже выбранное количество', async () => {
    const user = userEvent.setup()
    localStorage.setItem('agro-demo-session', JSON.stringify({ ...{
      city: 'Краснодар', address: 'Демо-адрес', store: 'Демо-магазин', fulfillment: 'delivery',
      substitution: null, slot: '18:00–20:00', listDone: [],
    }, cart: { milk: 3 } }))
    window.location.hash = '#shopping-list'
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Добавить из списка в корзину (3)' }))
    expect(await screen.findByRole('heading', { name: 'Корзина' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart.milk).toBe(3)
  })

  it('не кладёт в корзину уже купленные позиции и сохраняет правку своего товара', async () => {
    const user = userEvent.setup()
    localStorage.setItem('agro-demo-session', JSON.stringify({
      city: 'Краснодар', address: 'ул. Солнечная, 12', store: 'Краснодар', fulfillment: 'delivery',
      cart: {}, substitution: null, slot: '18:00–20:00', listDone: ['Молоко', 'Хлеб', 'Готовый ужин'],
      listCustom: ['Йогурт'],
    }))
    window.location.hash = '#shopping-list'
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Изменить Йогурт' }))
    await user.clear(screen.getByRole('textbox', { name: 'Изменить Йогурт' }))
    await user.type(screen.getByRole('textbox', { name: 'Изменить Йогурт' }), 'Филе цыплёнка')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))
    await user.click(screen.getByRole('button', { name: 'Добавить из списка в корзину (1)' }))
    const cart = JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart
    expect(cart.chicken).toBe(1)
    expect(cart.milk).toBeUndefined()
    expect(cart.bread).toBeUndefined()
    expect(cart.cutlets).toBeUndefined()
  })
})
