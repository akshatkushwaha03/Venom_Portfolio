import React from 'react';
import Header from '@/components/layout/Header';
import Home from '@/pages/Home';
import CustomCursor from '@/components/common/CustomCursor';
import './App.css';

function App() {
  return (
    <div className="app">
      <CustomCursor />
      <Header />
      <Home />
    </div>
  );
}

export default App;
