import { Header } from '@/components/monitoring/header'
import { MonitoringDashboard } from '@/components/monitoring/monitoring-dashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <MonitoringDashboard />
    </main>
  )
}
