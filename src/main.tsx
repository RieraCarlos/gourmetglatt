import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App.tsx'
import ReloadPrompt from './components/ReloadPrompt'

const isDevelopment = process.env.NODE_ENV === 'development'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
    {!isDevelopment && <ReloadPrompt />}
  </Provider>
);
