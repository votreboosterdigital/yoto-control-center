export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { eventService } = await import('@/server/services/EventService')
    const { schedulerService } = await import('@/server/services/SchedulerService')

    await eventService.start()
    await schedulerService.start()

    process.on('beforeExit', async () => {
      await eventService.stop()
      await schedulerService.stop()
    })
  }
}
