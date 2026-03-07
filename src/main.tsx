import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './app/store'
import Root from './Root.tsx'

const isDevelopment = process.env.NODE_ENV === 'development'

createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <Provider store={store}>
      <Root />
    </Provider>
  ) : (
    <Provider store={store}>
      <Root />
    </Provider>
  )
);
