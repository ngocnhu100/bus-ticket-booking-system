import { DashboardLayout } from "../../components/users/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Info, CheckCircle } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "info",
    title: "Trip Reminder",
    message: "Your trip to Hanoi is scheduled for tomorrow at 08:00",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "success",
    title: "Booking Confirmed",
    message: "Your booking BK2025HH002 has been confirmed",
    time: "1 day ago",
    read: true,
  },
  {
    id: 3,
    type: "info",
    title: "New Route Available",
    message: "Check out our new express route from HCM to Hanoi",
    time: "3 days ago",
    read: true,
  },
];

const Notifications = () => {
  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your bookings and offers</p>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 ${!notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    notification.type === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {notification.type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-foreground">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
