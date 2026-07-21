import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, MessageSquare, Calendar, DollarSign } from "lucide-react";

type Order = {
  id: string;
  title: string;
  subject: string;
  type: string;
  pages: number;
  deadline: string;
  budget: number;
  status: string;
  client?: {
    id: string;
    name: string;
    avatar?: string;
    country?: string;
  };
  progress: number;
  description: string;
};

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  console.log(orders);
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" }
    > = {
      active: { label: "In Progress", variant: "default" },
      pending: { label: "In Review", variant: "secondary" },
      completed: { label: "Completed", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  function formatDeadlineRemaining(deadlineIso: string): string {
    const deadline = new Date(deadlineIso);
    const now = new Date();

    if (isNaN(deadline.getTime())) return "Invalid deadline";

    let diffMs = deadline.getTime() - now.getTime();

    const isOverdue = diffMs < 0;
    diffMs = Math.abs(diffMs);

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    const timeLabel =
      days > 0
        ? `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`
        : `${hours} hour${hours !== 1 ? "s" : ""}`;

    return isOverdue ? `Overdue by ${timeLabel}` : `${timeLabel} left`;
  }


  function deadlineClass(deadlineIso: string) {
    const diffMs = new Date(deadlineIso).getTime() - Date.now();
    const hoursLeft = diffMs / (1000 * 60 * 60);

    if (hoursLeft < 0) return "text-red-700 font-semibold";
    if (hoursLeft <= 6) return "text-red-600";
    if (hoursLeft <= 24) return "text-orange-600";
    return "text-amber-600";
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No orders found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order.id}
            onClick={() => navigate(`/writer/order-view/${order.id}`)}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <TableCell>
              <div>
                <p className="font-medium">{order.title}</p>
                <p className="text-sm text-muted-foreground">{order.id}</p>
              </div>
            </TableCell>

            <TableCell>
              <Badge
                variant="outline"
                onClick={(e) => e.stopPropagation()}
              >
                {order.subject}
              </Badge>
            </TableCell>

            <TableCell>
              <div className="text-sm">
                <p>{order.type}</p>
                <p className="text-muted-foreground">{order.pages} pages</p>
              </div>
            </TableCell>

            <TableCell>
              <div
                className={`flex items-center text-sm ${deadlineClass(order.deadline)}`}
              >
                {/*<Calendar className="h-4 w-4 mr-1" />*/}
                {formatDeadlineRemaining(order.deadline)}
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center font-medium">
                <DollarSign className="h-4 w-4" />
                {order.budget}
              </div>
            </TableCell>

            <TableCell>{getStatusBadge(order.status)}</TableCell>

            <TableCell>
              <div
                className="inline-flex w-auto border divide-x"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-0 shadow-none"
                  onClick={() =>
                    navigate(`/writer/order-view/${order.id}`)
                  }
                >
                  <Eye className="h-4 w-4 mr-1" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-0 shadow-none"
                  onClick={() =>
                    navigate(
                      `/writer/chats?order=${order.id}&client=${order.client?.id}`
                    )
                  }
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
