import Homepage from './components/Homepage'
import Navbar from './components/Navbar'
import Footer from './components/Footer';

function App() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex-1 min-h-0 flex flex-col">
        <Homepage />
      </div>
      <Footer />
    </div>
  )
}

export default App
