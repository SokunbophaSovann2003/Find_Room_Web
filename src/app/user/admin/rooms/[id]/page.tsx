import RoomDetailView from "@/components/RoomDetailView";

// Admin moderation view of a single room. Lives under /user/admin/* so it is
// gated by the admin shell and kept fully separate from the public renter page
// at /rooms/[id]. Renders the shared view in admin mode (moderation actions,
// no renter CTAs).
export default function AdminRoomDetailPage({ params }: { params: { id: string } }) {
  return <RoomDetailView roomId={params.id} admin={true} />;
}
