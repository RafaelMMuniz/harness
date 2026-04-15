import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="text-center">
        <h1 className="text-2xl font-black text-neutral-900">MiniPanel</h1>
        <p className="mt-2 text-sm font-bold text-neutral-600">
          Self-hosted analytics platform
        </p>
        <Button className="mt-4">Get Started</Button>
      </div>
    </div>
  );
}

export default App;
