import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-black mb-4">MiniPanel</h1>
        <p className="text-sm font-bold text-muted-foreground mb-4">
          Self-hosted analytics platform
        </p>
        <Button>Get Started</Button>
      </div>
    </div>
  )
}

export default App
