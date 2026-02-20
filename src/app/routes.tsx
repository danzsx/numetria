import { createBrowserRouter } from 'react-router'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Modules from './pages/Modules'
import Training from './pages/Training'
import History from './pages/History'
import Pro from './pages/Pro'
import TabuadaSetup from './pages/TabuadaSetup'
import TabuadaTraining from './pages/TabuadaTraining'
import TabuadaResult from './pages/TabuadaResult'
import LessonExecution from './pages/LessonExecution'
import LessonResult from './pages/LessonResult'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedLayout from './components/ProtectedLayout'

export const router = createBrowserRouter([
  // ─── Rotas públicas ───────────────────────────────────────
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/signup', Component: Signup },
  { path: '/recuperar-senha', Component: ForgotPassword },
  { path: '/pro', Component: Pro },

  // ─── Rotas protegidas (requerem autenticação) ─────────────
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      { path: 'dashboard', Component: Dashboard },
      { path: 'modules', Component: Modules },
      { path: 'modules/:moduleId', Component: Modules },
      { path: 'history', Component: History },
      { path: 'training', Component: Training },
      { path: 'tabuada/setup', Component: TabuadaSetup },
      { path: 'tabuada/training', Component: TabuadaTraining },
      { path: 'tabuada/result', Component: TabuadaResult },
      { path: 'lesson/:conceptId/:lessonNumber', Component: LessonExecution },
      { path: 'lesson/:conceptId/:lessonNumber/result', Component: LessonResult },
    ],
  },

  { path: '*', Component: Landing },
])
