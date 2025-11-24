import { DashboardLayout } from "../../components/users/DashboardLayout";
import { Card } from "@/components/ui/card";
import { CreditCard, Calendar } from "lucide-react";

const payments = [
  {
    id: "PAY001",
    bookingId: "BK2025HS001",
    amount: "500,000 VND",
    date: "01 Nov 2025",
    status: "Completed",
  },
  {
    id: "PAY002",
    bookingId: "BK2025HH002",
    amount: "350,000 VND",
    date: "15 Oct 2025",
    status: "Completed",
  },
];

const Payments = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Payments</h1>
          <p className="text-muted-foreground">View your payment history and receipts</p>
        </div>

        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">
                      Payment for {payment.bookingId}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{payment.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Transaction ID: {payment.id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground mb-1">
                    {payment.amount}
                  </p>
                  <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {payment.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
