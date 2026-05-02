import { redirect } from "next/navigation";

export default function RegisterPage() {
  // Auth is handled via a popup modal on protected pages now.
  redirect("/explore");
}
