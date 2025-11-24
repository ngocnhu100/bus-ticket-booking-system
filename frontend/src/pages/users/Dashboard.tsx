import { TripCard } from "@/components/users/TripCard";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const upcomingTrips = [
  {
    from: "HCM",
    to: "Hanoi",
    date: "15 Nov 2025",
    time: "08:00",
    seats: "A1, A2",
    bookingId: "BK2025HS001",
  },
  {
    from: "Hanoi",
    to: "Hue",
    date: "20 Nov 2025",
    time: "14:00",
    seats: "B3",
    bookingId: "BK2025HH002",
  },
];

const Dashboard = () => {
  const { toast } = useToast();

  const handleCancel = (bookingId: string) => {
    toast({
      title: "Cancellation Request",
      description: `Processing cancellation for booking ${bookingId}`,
    });
  };

  const handleModify = (bookingId: string) => {
    toast({
      title: "Modify Booking",
      description: `Opening modification form for ${bookingId}`,
    });
  };

  const handleViewTicket = (bookingId: string) => {
    toast({
      title: "E-Ticket",
      description: `Viewing e-ticket for ${bookingId}`,
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upcoming Trips</h1>
        <p className="text-muted-foreground">Manage your upcoming travel bookings</p>
      </div>

      <div className="space-y-4">
        {upcomingTrips.map((trip) => (
          <TripCard
            key={trip.bookingId}
            {...trip}
            status="upcoming"
            onCancel={() => handleCancel(trip.bookingId)}
            onModify={() => handleModify(trip.bookingId)}
            onViewTicket={() => handleViewTicket(trip.bookingId)}
          />
        ))}
      </div>

      <div className="mt-12 text-center py-12">
        <p className="text-muted-foreground mb-6 text-sm uppercase tracking-wide">
          No more upcoming trips
        </p>
        <Button size="lg" className="gap-2 bg-blue-500 text-white hover:bg-blue-600">
          <Search className="w-5 h-5" />
          Search New Trip
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
