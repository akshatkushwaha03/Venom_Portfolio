import { createContext, useContext } from 'react';

export const LiquidTransitionContext = createContext({
  isTransitioning: false,
  navigateWithLiquid: () => {},
  contentTransformStyle: {},
  contentRef: { current: null },
});

export const useLiquidTransition = () => {
  const context = useContext(LiquidTransitionContext);
  if (!context) {
    throw new Error('useLiquidTransition must be used within a LiquidTransitionProvider');
  }
  return context;
};

export default useLiquidTransition;
