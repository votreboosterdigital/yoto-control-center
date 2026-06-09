import { EventFeed } from '@/components/events/EventFeed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Logs</h2>
      <Card>
        <CardHeader>
          <CardTitle>Tous les événements</CardTitle>
        </CardHeader>
        <CardContent>
          <EventFeed title="Historique complet" />
        </CardContent>
      </Card>
    </div>
  )
}
