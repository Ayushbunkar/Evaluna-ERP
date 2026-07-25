import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const driverRouter = router({
  getMobileDashboard: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      // Mock data for Delivery Boy Mobile App
      return {
        // Driver Details
        driverName: "Alex Kumar",
        status: "Online",
        batteryLevel: 82,

        // KPIs
        assignedOrders: 24,
        delivered: 16,
        pending: 8,
        codCollected: 12500.00,
        distanceCovered: "42.5 km",
        rating: 4.8,

        // Immediate Next Delivery
        nextDelivery: {
          id: "ORD-9982",
          customerName: "Sarah Jenkins",
          phone: "+91 98765 43210",
          address: "45 Residential Blvd, Apartment 4B",
          landmark: "Near Central Park",
          paymentType: "COD",
          amountToCollect: 450.00,
          packages: 2,
          eta: "14 mins",
          distance: "2.4 km",
          isVerified: false
        },

        // Today's Route Stops
        routeStops: [
          { id: 1, status: "completed", time: "10:30 AM", address: "12 Business Road" },
          { id: 2, status: "completed", time: "11:15 AM", address: "88 Innovation Ave" },
          { id: 3, status: "completed", time: "12:45 PM", address: "Tech Park, Gate 2" },
          { id: 4, status: "next", time: "ETA 02:15 PM", address: "45 Residential Blvd" },
          { id: 5, status: "pending", time: "--:--", address: "Warehouse 4, Industrial Est" },
        ]
      };
    }),
});
