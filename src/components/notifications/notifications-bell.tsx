"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { clientAuth, clientDb } from "@/lib/firebase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  type: "like" | "comment" | "restoration_request" | "automation";
  actorName?: string;
  message?: string;
  postId?: string;
  read: boolean;
  createdAt?: { toDate(): Date };
};

function describe(n: Notification) {
  const who = n.actorName || "Someone";
  switch (n.type) {
    case "like":
      return `${who} liked your post`;
    case "comment":
      return `${who} commented on your post`;
    case "restoration_request":
      return `${who} requested account restoration`;
    case "automation":
      return n.message ?? "Automation update";
  }
}

export function NotificationsBell({ uid }: { uid: string }) {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    // Real-time unread badge: requires the client Firebase session, which the
    // login flow establishes alongside the server session cookie.
    const unsubAuth = clientAuth.onAuthStateChanged((fbUser) => {
      if (!fbUser || fbUser.uid !== uid) return;
      const q = query(
        collection(clientDb, "notifications"),
        where("recipientId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const unsub = onSnapshot(q, (snap) => {
        setItems(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notification, "id">) }))
        );
      });
      return () => unsub();
    });
    return () => unsubAuth();
  }, [uid]);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await Promise.all(
      items
        .filter((n) => !n.read)
        .map((n) => updateDoc(doc(clientDb, "notifications", n.id), { read: true }).catch(() => {}))
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="sm" aria-label="Notifications" />}
        onClick={() => {
          if (unread > 0) setTimeout(markAllRead, 1500);
        }}
      >
        <Bell className="size-4" />
        {unread > 0 && <span className="ml-1 inline-block size-2 bg-primary" aria-label={`${unread} unread`} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-2 border-border p-0">
        <div className="border-b-2 border-border px-3 py-2 text-sm font-bold">
          Notifications
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">Nothing yet.</p>
          )}
          {items.map((n) => {
            const row = (
              <div className="flex items-start gap-2 border-b border-border/20 px-3 py-2.5 text-sm hover:bg-secondary">
                <span
                  className={
                    "mt-1.5 size-2 shrink-0 " + (n.read ? "bg-transparent" : "bg-primary")
                  }
                />
                <span>
                  {describe(n)}
                  <span className="block text-xs text-muted-foreground">
                    {n.createdAt?.toDate().toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }) ?? ""}
                  </span>
                </span>
              </div>
            );
            return n.postId ? (
              <Link key={n.id} href={`/post/${n.postId}`}>{row}</Link>
            ) : (
              <div key={n.id}>{row}</div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
