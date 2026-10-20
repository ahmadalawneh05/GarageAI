import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { AudioAnalysisProvider } from './context/AudioAnalysisContext';

export default function App() {
  return (
    <AuthProvider>
      <AudioAnalysisProvider>
        <RouterProvider router={router} />
      </AudioAnalysisProvider>
    </AuthProvider>
  );
}