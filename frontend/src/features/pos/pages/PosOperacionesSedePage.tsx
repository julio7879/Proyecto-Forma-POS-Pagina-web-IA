import React from 'react';
import PosPedidosWebPage from './PosPedidosWebPage';
import PosCambiosPage from './PosCambiosPage';
import PosTrasladosPage from './PosTrasladosPage';

export interface PosOperacionesSedePageProps {
  initialTab?: 'web' | 'cambios' | 'traslados';
}

export const PosOperacionesSedePage: React.FC<PosOperacionesSedePageProps> = ({ initialTab = 'web' }) => {
  if (initialTab === 'cambios') return <PosCambiosPage />;
  if (initialTab === 'traslados') return <PosTrasladosPage />;
  return <PosPedidosWebPage />;
};

export default PosOperacionesSedePage;
