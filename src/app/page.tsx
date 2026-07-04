import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ds/panel";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Panel className="p-10">
        <h1 className="text-4xl font-bold">MyBlog</h1>
        <p className="mt-3 text-muted-foreground">
          An editorial black &amp; white blog. Feed coming soon.
        </p>
        <div className="mt-6">
          <Button>← Back to Home</Button>
        </div>
      </Panel>
    </main>
  );
}
