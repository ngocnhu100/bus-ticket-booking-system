import { DashboardLayout } from "../../components/users/DashboardLayout";
import { TripCard } from "../../components/users/TripCard";

const pastTrips = [
  {
    from: "Hanoi",
    to: "Da Nang",
    date: "10 Oct 2025",
    time: "09:00",
    seats: "C1, C2",
    bookingId: "BK2025HD003",
    status: "completed" as const,
  },
  {
    from: "HCM",
    to: "Nha Trang",
    date: "05 Sep 2025",
    time: "07:30",
    seats: "D5",
    bookingId: "BK2025HN004",
    status: "completed" as const,
  },
];

const History = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Trip History</h1>
          <p className="text-muted-foreground">View your past bookings and trips</p>
        </div>

        <div className="space-y-4">
          {pastTrips.map((trip) => (
            <TripCard key={trip.bookingId} {...trip} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default History;
