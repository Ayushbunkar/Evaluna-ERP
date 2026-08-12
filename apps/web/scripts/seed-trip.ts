import { db } from "../src/lib/db/index";
import { deliveryTrips, vehicles } from "@evaluna/db/schema/delivery";
import { tripStops } from "@evaluna/db/schema/delivery";
import { customers, orders, orderItems, products, staff, user } from "@evaluna/db/schema";
import { eq, desc } from "drizzle-orm";

async function seed() {
    console.log("Seeding dummy active trip...");

    // 1. Get first driver
    const driver = await db.query.user.findFirst({
        where: eq(user.role, 'delivery'),
    });
    
    let driverId = driver?.id;
    if (!driverId) {
        // Find any user just to assign
        const anyUser = await db.query.user.findFirst();
        if (!anyUser) throw new Error("No users found");
        driverId = anyUser.id;
    }

    // 2. Get/create a customer
    let cust = await db.query.customers.findFirst();
    if (!cust) {
        const [insertedCust] = await db.insert(customers).values({
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            address: "123 Main St, Springfield",
            user_uid: "uid_" + Date.now(),
        }).returning();
        cust = insertedCust;
    }

    // 3. Get/create a vehicle
    let vh = await db.query.vehicles.findFirst();
    if (!vh) {
        const [insertedVh] = await db.insert(vehicles).values({
            registration_number: "ABC-1234",
            type: "truck",
            capacity: "1000",
            status: "active",
        }).returning();
        vh = insertedVh;
    }

    // 4. Create an active trip
    const [trip] = await db.insert(deliveryTrips).values({
        driver_id: driverId,
        vehicle_id: vh.id,
        status: "active",
        route_id: 1, // Optional but might be needed by DB constraints? 
                     // Wait, route_id is not null! Let's get/create a route
    }).returning().catch(async (e) => {
        // If route_id constraint fails, create a route
        const { deliveryRoutes } = await import("@evaluna/db/schema/delivery");
        let route = await db.query.deliveryRoutes.findFirst();
        if (!route) {
            const [newRoute] = await db.insert(deliveryRoutes).values({
                name: "Main Route",
                branch_id: 1,
            }).returning();
            route = newRoute;
        }
        return db.insert(deliveryTrips).values({
            driver_id: driverId,
            vehicle_id: vh.id,
            status: "active",
            route_id: route.id,
        }).returning();
    });

    // 5. Create an order for the customer
    const [ord] = await db.insert(orders).values({
        customer_id: cust.id,
        total_amount: "150.00",
        user_uid: cust.user_uid,
        status: "pending"
    }).returning();

    // 6. Create product and order item
    let prod = await db.query.products.findFirst();
    if (!prod) {
        const [newProd] = await db.insert(products).values({
            name: "Premium Package",
            sku: "PKG-001",
            price: "150.00",
        }).returning();
        prod = newProd;
    }

    await db.insert(orderItems).values({
        order_id: ord.id,
        product_id: prod.id,
        quantity: 1,
        price: "150.00",
    });

    // 7. Create a trip stop
    await db.insert(tripStops).values({
        trip_id: trip.id,
        customer_id: cust.id,
        sequence: 1,
        status: "pending",
    });

    console.log("Seed complete! Trip ID:", trip.id);
    process.exit(0);
}

seed().catch(console.error);
