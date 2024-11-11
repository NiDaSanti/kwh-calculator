import React, { useState, useEffect } from 'react'
import './styles.css'  // Importing the updated CSS file

const Calculator = () => {
  const [charges, setCharges] = useState('')
  const [usage, setUsage] = useState('')
  const [annualUsage, setAnnualUsage] = useState('')
  const [rate, setRate] = useState(null)
  const [avgPerMonthCost, setAvgPerMonthCost] = useState(null)
  const [projectedBills, setProjectedBills] = useState({ sunrunBills: [], sceBills: [] })

  function calcuateRate() {
    const chargesValue = parseFloat(charges)
    const usageValues = parseFloat(usage)

    if (chargesValue > 0 && usageValues > 0) {
      const calculatedRate = chargesValue / usageValues
      setRate(calculatedRate.toFixed(4))
    } else {
      setRate(null)
    }
  }

  function calculateAnnualUsage() {
    if (rate && annualUsage > 0) {
      const avgMonthlyBill = (annualUsage * parseFloat(rate)) / 12
      setAvgPerMonthCost(avgMonthlyBill.toFixed(2))
    }
  }

  function generateProjectedBills(initialBill) {
    const sunrunIncrease = 1.035  // 3.5% increase per year
    const sceIncrease = 1.105   // 10.5% increase per year
    const years = 10  // Number of years to project

    const sunrunBills = []
    const sceBills = []

    for (let i = 1; i <= years; i++) {
      const sunrunBill = initialBill * Math.pow(sunrunIncrease, i)
      const sceBill = initialBill * Math.pow(sceIncrease, i)

      sunrunBills.push(sunrunBill.toFixed(2))
      sceBills.push(sceBill.toFixed(2))
    }

    setProjectedBills({
      sunrunBills,
      sceBills
    })
  }

  useEffect(() => {
    if (rate && annualUsage > 0) {
      calculateAnnualUsage()
      if (avgPerMonthCost) {
        generateProjectedBills(parseFloat(avgPerMonthCost))
      }
    }
  }, [rate, annualUsage, avgPerMonthCost])

  const handleSubmit = (e) => {
    e.preventDefault()
    calcuateRate()
  }

  const handleReset = () => {
    setCharges('')
    setUsage('')
    setAnnualUsage('')
    setRate(null)
    setAvgPerMonthCost(null)
    setProjectedBills({ sunrunBills: [], sceBills: [] })
  }

  return (
    <div className="calculator-container">
      <div>
        <h2>Energy Rate Calculator</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Energy Charges ($):
            <input
              type="number"
              step="0.01"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
              required
            />
          </label>
          <label>
            Monthly kWh Usage:
            <input
              type="number"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              required
            />
          </label>
          <label>
            Annual Usage:
            <input
              type="number"
              step="0.01"
              value={annualUsage}
              onChange={(e) => setAnnualUsage(e.target.value)}
              required
            />
          </label>
          <button type="submit">Calculate Rate</button>
          <button type="button" onClick={handleReset}>Reset</button>
        </form>
      </div>

      <div className="result-container">
        {rate !== null && (
          <div>
            <h3>The rate is ${rate} per kWh.</h3>
            <h3>The average monthly cost is ${avgPerMonthCost}</h3>
            <h3>Projected Monthly Electric Bills (Next 10 Years)</h3>
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>SunRun Projected Bill ($)</th>
                  <th>SCE Projected Bill ($)</th>
                </tr>
              </thead>
              <tbody>
                {projectedBills.sunrunBills.map((bill, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{bill}</td>
                    <td>{projectedBills.sceBills[index]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Calculator
