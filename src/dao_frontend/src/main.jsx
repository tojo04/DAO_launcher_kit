import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ActorProvider } from './context/ActorContext'
import { AuthProvider } from './context/AuthContext'
import { DAOProvider } from './context/DAOContext'
import { DAOManagementProvider } from './context/DAOManagementContext'
import './index.css'
import './app.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DAOManagementProvider>
        <ActorProvider>
          <DAOProvider>
            <App />
          </DAOProvider>
        </ActorProvider>
      </DAOManagementProvider>
    </AuthProvider>
  </React.StrictMode>,
)
