import { cleanup, render, screen } from '@testing-library/react'
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
    await user.click(screen.getByText('Демо-адрес · ул. Солнечная, 12'))
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
    await user.click(screen.getByRole('button', { name: /Оплатить безопасно/ }))
    expect(await screen.findByText('Платёж не завершён')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('agro-demo-session') || '{}').cart).toEqual({ milk: 1 })
  })

  it('повторяет корзину и ведёт к выбору замены', async () => {
    const user = userEvent.setup()
    window.location.hash = '#repeat'
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Добавить и проверить замену' }))
    expect(await screen.findByRole('heading', { name: 'Замена товара' })).toBeInTheDocument()
  })
})
