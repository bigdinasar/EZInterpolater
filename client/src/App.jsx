import { useState } from 'react'
import './App.css'
import UploadArea from './components/UploadArea'

function App() {
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <UploadArea />
    </div>
  )
}

// function App() {

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-red-500">
//       <h1 className="text-5xl font-bold text-blue-600">Frame Interpolater!</h1>
//       <p className="mt-4 text-lg text-blue-100">Let's build something awesome 🚀</p>
//     </div>
//   )
  
// }

export default App
