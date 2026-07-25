import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const deliveryRouter = router({
  getDashboard: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      // Mock data for Delivery Dashboard
      return {
        // KPIs
        todaysDeliveries: 482,
        completedDeliveries: 345,
        pendingDeliveries: 120,
        failedDeliveries: 17,
        codCollection: 45800.50,
        deliverySuccessRate: 95.3,
        averageDeliveryTime: "42 mins",
        vehiclesActive: 24,
        driversOnline: 28,
        ordersWaiting: 45,
        lateDeliveries: 8,
        distanceTravelled: 1245, // km

        // Live Map Simulated Data
        activeDrivers: [
          { id: "D1", name: "John Smith", lat: 28.6139, lng: 77.2090, status: "driving", battery: 85 },
          { id: "D2", name: "Alex Kumar", lat: 28.6239, lng: 77.2190, status: "delivering", battery: 42 },
          { id: "D3", name: "Mike Davis", lat: 28.6039, lng: 77.1990, status: "idle", battery: 98 },
        ],
        
        // Notifications
        notifications: [
          { id: 1, type: "traffic", title: "Heavy Traffic", message: "Route 4 delayed by 15 mins", time: "5m ago" },
          { id: 2, type: "delay", title: "Late Delivery", message: "Order #8892 is running late", time: "12m ago" },
          { id: 3, type: "emergency", title: "Vehicle Breakdown", message: "Van V-04 reported issue", time: "28m ago" },
          { id: 4, type: "success", title: "Large COD Collected", message: "$1,200 collected by John", time: "45m ago" },
        ],

        // Performance Metrics
        topDrivers: [
          { name: "John Smith", deliveries: 42, rating: 4.9 },
          { name: "Sarah Lee", deliveries: 38, rating: 4.8 },
          { name: "Alex Kumar", deliveries: 35, rating: 4.7 },
        ],
        
        // Delivery Orders Table
        deliveryOrders: [
          { id: "ORD-9921", customer: "Acme Corp", address: "123 Business Rd, Tech Park", status: "out_for_delivery", driver: "John Smith", amount: 145.00 },
          { id: "ORD-9922", customer: "Sarah Jenkins", address: "45 Residential Blvd, Apt 4B", status: "pending", driver: "Unassigned", amount: 89.50 },
          { id: "ORD-9923", customer: "Tech Solutions", address: "88 Innovation Ave", status: "delivered", driver: "Alex Kumar", amount: 450.00 },
          { id: "ORD-9924", customer: "Global Retail", address: "Warehouse 4, Industrial Est", status: "failed", driver: "Mike Davis", amount: 1200.00 },
        ],
        
        // Order Status Breakdown for Chart
        ordersByStatus: [
          { name: "Delivered", value: 345 },
          { name: "Out for Delivery", value: 85 },
          { name: "Pending", value: 35 },
          { name: "Failed", value: 17 },
        ]
      };
    }),
});
