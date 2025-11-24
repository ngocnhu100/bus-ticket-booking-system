import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Calendar, MapPin, Users } from "lucide-react";

interface TripCardProps {
  from: string;
  to: string;
  date: string;
  time: string;
  seats: string;
  bookingId: string;
  status?: "upcoming" | "completed" | "cancelled";
  onCancel?: () => void;
  onModify?: () => void;
  onViewTicket?: () => void;
}

export const TripCard = ({
  from,
  to,
  date,
  time,
  seats,
  bookingId,
  status = "upcoming",
  onCancel,
  onModify,
  onViewTicket,
}: TripCardProps) => {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 text-lg font-semibold text-blue-600">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>{from} → {to}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{date}, {time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Seats: {seats}</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Booking ID: <span className="font-mono">{bookingId}</span>
            </p>
          </div>
          
          {status === "upcoming" && (
            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
              Upcoming
            </span>
          )}
          {status === "completed" && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Completed
            </span>
          )}
          {status === "cancelled" && (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Cancelled
            </span>
          )}
        </div>
        
        {status === "upcoming" && (
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel} className="text-destructive hover:text-destructive">
                Cancel
              </Button>
            )}
            {onModify && (
              <Button variant="outline" size="sm" onClick={onModify}>
                Modify
              </Button>
            )}
            {onViewTicket && (
              <Button size="sm" onClick={onViewTicket} className="bg-blue-500 text-white hover:bg-blue-600">
                View E-ticket
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
