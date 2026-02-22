import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/providers/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Homepage from '@/components/Homepage';
import NotesPage from '@/pages/NotesPage';
import DevPage from '@/pages/DevPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="h-dvh flex flex-col overflow-hidden bg-background text-foreground">
          <Navbar />
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
    </ThemeProvider>
  );
}
