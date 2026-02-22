import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage'
import NotesPage from '@/pages/NotesPage'
import DevPage from '@/pages/DevPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <BrowserRouter>
      <div className="h-dvh flex flex-col overflow-hidden bg-background text-foreground">
        <Navbar isDark={isDark} onToggleTheme={() => setIsDark((d) => !d)} />
        <div className="flex-1 min-h-0 flex flex-col">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/dev" element={<DevPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
