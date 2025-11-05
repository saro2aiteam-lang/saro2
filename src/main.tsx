import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize mock Jobs API for development
import './services/jobsApi';

createRoot(document.getElementById("root")!).render(<App />);
