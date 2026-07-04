import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import {
  getAdminStats,
  getAllUsers,
  getRecentComments,
  getPendingRestorationRequests,
} from "@/lib/admin/queries";
import { getFeedPosts } from "@/lib/posts/queries";
import { SiteHeader } from "@/components/layout/site-header";
import { Panel } from "@/components/ds/panel";
import { SectionNumber } from "@/components/ds/section-number";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDeleteCommentButton,
  AdminDeletePostButton,
  ToggleUserActiveButton,
} from "@/components/admin/admin-buttons";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin(user))) redirect("/");

  const [stats, users, posts, comments, restorations] = await Promise.all([
    getAdminStats(),
    getAllUsers(),
    getFeedPosts({ limit: 30 }),
    getRecentComments(),
    getPendingRestorationRequests(),
  ]);

  const statBlocks = [
    { n: 1, title: "Users", value: stats.totalUsers },
    { n: 2, title: "Posts", value: stats.totalPosts },
    { n: 3, title: "Comments", value: stats.totalComments },
    { n: 4, title: "Likes", value: stats.totalLikes },
  ];

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl font-bold">Admin dashboard</h1>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statBlocks.map((s) => (
            <Panel key={s.n} className="p-4">
              <SectionNumber number={s.n} title={s.title}>
                <p className="text-3xl font-bold">{s.value}</p>
              </SectionNumber>
            </Panel>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Engagement (last 6 weeks)</h2>
          <Panel className="mt-4 p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week of</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Likes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.weeklyTrend.map((w) => (
                  <TableRow key={w.weekStart}>
                    <TableCell>{w.weekStart}</TableCell>
                    <TableCell>{w.posts}</TableCell>
                    <TableCell>{w.likes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </section>

        {restorations.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Restoration requests</h2>
            <Panel className="mt-4 p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restorations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.displayName} ({r.email})</TableCell>
                      <TableCell>{r.requestedAt.slice(0, 10)}</TableCell>
                      <TableCell>
                        <ToggleUserActiveButton uid={r.uid} makeActive label="Restore" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Users</h2>
          <Panel className="mt-4 p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.uid}>
                    <TableCell>{u.displayName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.isActive ? "active" : "deactivated"}</TableCell>
                    <TableCell>
                      {u.uid !== user.uid && (
                        <ToggleUserActiveButton
                          uid={u.uid}
                          makeActive={!u.isActive}
                          label={u.isActive ? "Deactivate" : "Reactivate"}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Recent posts</h2>
          <Panel className="mt-4 p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <a href={`/post/${p.id}`} className="underline">{p.title}</a>
                    </TableCell>
                    <TableCell>{p.authorName}</TableCell>
                    <TableCell>{p.createdAt.slice(0, 10)}</TableCell>
                    <TableCell><AdminDeletePostButton postId={p.id} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Recent comments</h2>
          <Panel className="mt-4 p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.authorName}</TableCell>
                    <TableCell className="max-w-md truncate">{c.content}</TableCell>
                    <TableCell>{c.createdAt.slice(0, 10)}</TableCell>
                    <TableCell><AdminDeleteCommentButton commentId={c.id} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </section>
      </main>
    </>
  );
}
