import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export type AdminStats = {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  weeklyTrend: { weekStart: string; posts: number; likes: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const [users, posts, comments, likes] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("posts").count().get(),
    adminDb.collection("comments").count().get(),
    adminDb.collection("likes").count().get(),
  ]);

  // 6-week trend from recent docs (fine at personal-blog scale)
  const since = new Date();
  since.setDate(since.getDate() - 42);
  const [recentPosts, recentLikes] = await Promise.all([
    adminDb.collection("posts").where("createdAt", ">=", since).get(),
    adminDb.collection("likes").where("createdAt", ">=", since).get(),
  ]);

  function weekKey(d: Date) {
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }
  const trend = new Map<string, { posts: number; likes: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    trend.set(weekKey(d), { posts: 0, likes: 0 });
  }
  for (const doc of recentPosts.docs) {
    const k = weekKey(doc.data().createdAt.toDate());
    if (trend.has(k)) trend.get(k)!.posts++;
  }
  for (const doc of recentLikes.docs) {
    const k = weekKey(doc.data().createdAt.toDate());
    if (trend.has(k)) trend.get(k)!.likes++;
  }

  return {
    totalUsers: users.data().count,
    totalPosts: posts.data().count,
    totalComments: comments.data().count,
    totalLikes: likes.data().count,
    weeklyTrend: Array.from(trend.entries()).map(([weekStart, v]) => ({ weekStart, ...v })),
  };
}

export async function getAllUsers() {
  const snap = await adminDb.collection("users").orderBy("createdAt", "desc").limit(200).get();
  return snap.docs.map((d) => ({
    uid: d.id,
    email: d.data().email ?? "",
    displayName: d.data().displayName ?? "",
    role: d.data().role ?? "user",
    isActive: d.data().isActive !== false,
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? "",
  }));
}

export async function getRecentComments(limit = 50) {
  const snap = await adminDb.collection("comments").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => ({
    id: d.id,
    postId: d.data().postId,
    authorName: d.data().authorName ?? "",
    content: d.data().content ?? "",
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? "",
  }));
}

export async function getPendingRestorationRequests() {
  const snap = await adminDb
    .collection("restorationRequests")
    .where("status", "==", "pending")
    .get();
  const requests = await Promise.all(
    snap.docs.map(async (d) => {
      const user = await adminDb.doc(`users/${d.data().uid}`).get();
      return {
        id: d.id,
        uid: d.data().uid,
        email: user.data()?.email ?? "(unknown)",
        displayName: user.data()?.displayName ?? "",
        requestedAt: d.data().requestedAt?.toDate?.()?.toISOString() ?? "",
      };
    })
  );
  return requests.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}
