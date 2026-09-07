import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Work from '@/pages/Work';
import Services from '@/pages/Services';
import Contact from '@/pages/Contact';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import { LiquidTransitionProvider } from '@/components/common/LiquidTransition';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <LiquidTransitionProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="work" element={<Work />} />
            <Route path="work/:categoryName" element={<Work />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </LiquidTransitionProvider>
    </BrowserRouter>
  );
}

export default App;
