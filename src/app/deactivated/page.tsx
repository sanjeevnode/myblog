import { Panel } from "@/components/ds/panel";
import { RequestRestorationButton } from "@/components/auth/request-restoration-button";

export default function DeactivatedPage({
  searchParams,
}: {
  searchParams: { uid?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Panel className="p-8">
        <h1 className="text-3xl font-bold">Account deactivated</h1>
        <p className="mt-3 text-muted-foreground">
          Your account has been deactivated by an administrator. You can request
          restoration below — an admin will review your request.
        </p>
        <div className="mt-6">
          <RequestRestorationButton uid={searchParams.uid ?? ""} />
        </div>
      </Panel>
    </main>
  );
}
