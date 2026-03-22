import { MatchProvider } from './context/MatchContext'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <MatchProvider>
      <AppShell />
    </MatchProvider>
  )
}
