import AuthGuard from "@/components/AuthGuard";

export default function RoomDetailLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
