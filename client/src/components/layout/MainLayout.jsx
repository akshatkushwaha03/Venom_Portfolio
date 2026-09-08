import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CustomCursor from '@/components/common/CustomCursor';
import ScrollToTop from '@/components/common/ScrollToTop';
import useInteractionLayer from '@/hooks/useInteractionLayer';

export const MainLayout = () => {
  // Re-bind magnetic buttons, 3D tilts, and kinetic scroll dynamics on render
  useInteractionLayer();

  return (
    <div className="app-layout" style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#060608', color: '#fff' }}>
      <ScrollToTop />
      <CustomCursor />
      <Header />
      <main style={{ flex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
