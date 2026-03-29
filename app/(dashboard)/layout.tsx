import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ShellClient from "@/components/ShellClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    role: (session.user as { role?: string }).role ?? "member",
  };

  return <ShellClient user={user}>{children}</ShellClient>;
}
