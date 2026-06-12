import { Navigate } from 'react-router';

/** Legacy route — main feed lives on Explore (mirrors mobile tab structure). */
export function Home() {
  return <Navigate to="/explore" replace />;
}
