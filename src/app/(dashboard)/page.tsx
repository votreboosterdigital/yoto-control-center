import { EventFeed } from '@/components/events/EventFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Flux d&apos;événements</CardTitle>
          </CardHeader>
          <CardContent>
            <EventFeed />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mode mock actif — les événements sont simulés toutes les 5 secondes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
