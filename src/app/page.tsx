import { Chat } from '@/features/Chat'
import { DEMO_COMMANDS, DemoPanel } from '@/features/DemoPanel'

interface PageProps {
  searchParams: Promise<{ demo?: string }>
}

const Page = async ({ searchParams }: PageProps) => {
  const { demo } = await searchParams

  return demo === '1' ? <DemoPanel /> : <Chat commands={DEMO_COMMANDS} />
}

export default Page
