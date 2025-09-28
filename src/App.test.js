import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import Calculator from './Components/Calculator/calculator'

const fillRequiredFields = (rateChange) => {
  const [chargesInput, monthlyUsageInput, annualUsageInput, rateChangeInput, minimalRateInput] = screen.getAllByRole('spinbutton')

  fireEvent.change(chargesInput, { target: { value: '120' } })
  fireEvent.change(monthlyUsageInput, { target: { value: '600' } })
  fireEvent.change(annualUsageInput, { target: { value: '7200' } })
  fireEvent.change(rateChangeInput, { target: { value: rateChange } })
  fireEvent.change(minimalRateInput, { target: { value: '3' } })
}

const submitForm = () => {
  const button = screen.getByRole('button', { name: /calculate rate/i })
  fireEvent.click(button)
}

const expectProjectedBillToBe = async (value) => {
  await waitFor(() => {
    const label = screen.getByText(/projected monthly bill/i)
    const cardContent = label.closest('.bill-card__content')

    expect(cardContent).not.toBeNull()
    expect(within(cardContent).getByText(new RegExp(`\\$${value}`))).toBeInTheDocument()
  })
}

test('calculates projected monthly bill with a 10% increase', async () => {
  render(<Calculator />)

  fillRequiredFields('10')
  submitForm()

  await expectProjectedBillToBe('132.00')
})

test('calculates projected monthly bill with no percentage change', async () => {
  render(<Calculator />)

  fillRequiredFields('0')
  submitForm()

  await expectProjectedBillToBe('120.00')
})

test('calculates projected monthly bill with a 5% decrease', async () => {
  render(<Calculator />)

  fillRequiredFields('-5')
  submitForm()

  await expectProjectedBillToBe('114.00')
})
