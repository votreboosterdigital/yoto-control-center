export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { eventService } = await import('@/server/services/EventService')
    await eventService.start()
  }
}
