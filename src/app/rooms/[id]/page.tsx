import RoomDetailView from "@/components/RoomDetailView";

// Public room detail — renter experience only (contact, location, report).
// Admins moderate the same room from /user/admin/rooms/[id] instead.
export default function RoomDetailPage({ params }: { params: { id: string } }) {
  return <RoomDetailView roomId={params.id} admin={false} />;
}
