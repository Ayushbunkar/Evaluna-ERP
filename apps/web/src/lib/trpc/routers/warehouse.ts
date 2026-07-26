import { z } from "zod";
import { protectedProcedure, router } from "../init";

export const warehouseRouter = router({
  list: protectedProcedure
    .input(z.void())
    .query(async () => {
      return [
        { id: 1, zone: "Zone A - Fast Moving", rack: "A1", capacity: 1000, used: 850, status: "active" },
        { id: 2, zone: "Zone A - Fast Moving", rack: "A2", capacity: 1000, used: 920, status: "near_full" },
        { id: 3, zone: "Zone B - Standard", rack: "B1", capacity: 2000, used: 1200, status: "active" },
        { id: 4, zone: "Zone B - Standard", rack: "B2", capacity: 2000, used: 1950, status: "full" },
        { id: 5, zone: "Zone C - Heavy Goods", rack: "C1", capacity: 500, used: 450, status: "active" },
        { id: 6, zone: "Zone C - Heavy Goods", rack: "C2", capacity: 500, used: 100, status: "maintenance" },
        { id: 7, zone: "Zone D - Cold Storage", rack: "D1", capacity: 300, used: 280, status: "near_full" },
        { id: 8, zone: "Zone D - Cold Storage", rack: "D2", capacity: 300, used: 150, status: "active" },
      ];
    }),

  getStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ input }) => {
      // Return mock data for warehouse dashboard
      return {
        // KPIs
        itemsReceived: 1250,
        itemsPutAway: 840,
        pickingQueue: 145,
        packingQueue: 89,
        warehouseCapacity: 76, // percentage
        locationsUsed: 1205,
        damageItems: 12,
        expiredProducts: 4,

        // Heatmap Data (Mocked Grid 10x10)
        heatmapData: Array.from({ length: 50 }, (_, i) => ({
          x: Math.floor(Math.random() * 10),
          y: Math.floor(Math.random() * 10),
          activity: Math.floor(Math.random() * 100)
        })),

        // Rack Utilization Data
        rackUtilization: [
          { name: "Rack A (Fast Moving)", used: 85, total: 100 },
          { name: "Rack B (Standard)", used: 60, total: 100 },
          { name: "Rack C (Heavy)", used: 92, total: 100 },
          { name: "Rack D (Cold Storage)", used: 45, total: 100 },
        ],

        // FIFO Status Data (Inventory Age)
        fifoStatus: [
          { age: "0-30 Days", value: 4500 },
          { age: "31-60 Days", value: 3200 },
          { age: "61-90 Days", value: 1500 },
          { age: "90+ Days", value: 800 },
        ],

        // Worker Performance
        workerPerformance: [
          { name: "James Wilson", role: "Picker", items: 450, accuracy: 99.2 },
          { name: "Sarah Lee", role: "Packer", items: 380, accuracy: 99.8 },
          { name: "Mike Brown", role: "Forklift Operator", items: 250, accuracy: 100 },
        ],

        // Pending Tasks
        pendingTasks: [
          { id: 1, title: "Put away shipment #4456", priority: "high", status: "pending" },
          { id: 2, title: "Audit Rack C", priority: "medium", status: "in_progress" },
          { id: 3, title: "Restock Pick Face A12", priority: "high", status: "pending" },
        ],

        // Recent Activity
        recentActivity: [
          { id: 1, action: "Picked Order #8892", time: "5 mins ago", user: "James Wilson" },
          { id: 2, action: "Received PO #4451", time: "12 mins ago", user: "Receiving Dock" },
          { id: 3, action: "Moved 50 units to Rack B", time: "45 mins ago", user: "Mike Brown" },
        ],
        
        // Realtime Inventory Alerts
        inventoryAlerts: [
          { id: 1, type: "damage", message: "2 units reported damaged in A4", time: "1 hour ago" },
          { id: 2, type: "expiry", message: "Batch 44X expires in 15 days", time: "2 hours ago" },
        ]
      };
    }),
});