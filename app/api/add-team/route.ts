import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";

export async function POST() {
  const db = getDb();
  const password = await bcrypt.hash("MidasOS2026!", 10);

  const newUsers = [
    {
      name: "Powell",
      email: "powell@midaspropertyauctions.co.uk",
      role: "member" as const,
      password,
    },
    {
      name: "Tah Fongyen",
      email: "tah@midaspropertyauctions.co.uk",
      role: "member" as const,
      password,
    },
    {
      name: "Collins",
      email: "collins@midaspropertyauctions.co.uk",
      role: "member" as const,
      password,
    },
  ];

  for (const user of newUsers) {
    await db.insert(users).values(user).onConflictDoNothing();
  }

  return Response.json({ success: true, message: "Powell, Tah and Collins added" });
}
