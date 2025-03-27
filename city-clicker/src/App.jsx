import { useState } from 'react'
import './App.css'
import UKMapGame from './UKMapGame'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{textAlign: "center"}}>UK City Guessing Game</h1>
      <UKMapGame />
    </div>
  )
}

export default App
