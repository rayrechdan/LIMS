import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role === "DOCTOR") redirect("/doctor");
  if (session.user.role === "PATIENT") redirect("/portal");
  redirect("/dashboard");
}
