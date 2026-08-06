import { faker } from "@faker-js/faker";
import { db } from "../apps/web/src/lib/db";
import {
    companies,
    branches,
    roles,
    staff,
    staffAttendance,
    payroll,
    products,
    customers,
    orders,
    orderItems,
    paymentMethods
} from "../packages/db/src/schema";

async function main() {
    console.log("Starting full database seed...");

    // 1. Payment Methods
    console.log("Seeding payment methods...");
    const pmResult = await db.insert(paymentMethods).values([
        { name: "Cash", payment_type: "cash" },
        { name: "Bank Transfer", payment_type: "bank" },
        { name: "Credit Card", payment_type: "card" }
    ]).onConflictDoNothing().returning({ id: paymentMethods.id });

    let pms = await db.select().from(paymentMethods);
    if (pms.length === 0) {
        console.warn("No payment methods found, please check DB");
    }

    // 2. Companies & Branches
    console.log("Seeding companies...");
    const companyIds = await db.insert(companies).values([
        { name: faker.company.name(), status: "active" }
    ]).returning({ id: companies.id });
    const companyId = companyIds[0]?.id;

    console.log("Seeding branches...");
    await db.insert(branches).values([
        { name: "Main HQ", code: "HQ", is_headquarters: true },
        { name: "North Branch", code: "NB", is_headquarters: false },
        { name: "South Branch", code: "SB", is_headquarters: false }
    ]).onConflictDoNothing();
    const branchIds = await db.select().from(branches);

    // 3. Roles
    console.log("Seeding roles...");
    const rolesToCreate = ["superadmin", "hr", "sales_person", "auditor", "warehouse", "manager"];
    for (const r of rolesToCreate) {
        await db.insert(roles).values({ name: r, permissions: {} }).onConflictDoNothing();
    }
    const allRoles = await db.select().from(roles);

    // 4. Staff (Employees)
    console.log("Seeding staff (HR module)...");
    const staffRecords = [];
    for (let i = 0; i < 50; i++) {
        const randomRole = faker.helpers.arrayElement(allRoles);
        staffRecords.push({
            staff_code: `EMP-${faker.string.numeric(5)}`,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number().slice(0, 20),
            role: randomRole ? randomRole.name : "staff",
            department: faker.commerce.department(),
            join_date: faker.date.past({ years: 2 }),
            salary: faker.number.int({ min: 20000, max: 100000 }).toString(),
            branch_id: faker.helpers.arrayElement(branchIds).id,
            status: "active"
        });
    }
    const staffInserted = await db.insert(staff).values(staffRecords).returning({ id: staff.id, branch_id: staff.branch_id });

    // 5. Attendance & Payroll (HR module)
    console.log("Seeding attendance & payroll...");
    const attendanceRecords = [];
    const payrollRecords = [];
    
    // Previous two months
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const twoMonthsAgo = lastMonth === 1 ? 12 : lastMonth - 1;
    const year1 = now.getMonth() === 0 ? currentYear - 1 : currentYear;
    const year2 = lastMonth === 1 ? year1 - 1 : year1;

    const months = [
        `${year2}-${twoMonthsAgo.toString().padStart(2, '0')}`, 
        `${year1}-${lastMonth.toString().padStart(2, '0')}`
    ];
    
    for (const emp of staffInserted) {
        // Attendance
        for (let i = 1; i <= 28; i++) { // just use 28 days to be safe for Feb
            for (const month of months) {
                const dateStr = `${month}-${i.toString().padStart(2, '0')}`;
                
                // Randomly skip some days to simulate absent or weekend
                if (Math.random() > 0.2) {
                    attendanceRecords.push({
                        staff_id: emp.id,
                        branch_id: emp.branch_id,
                        date: dateStr,
                        clock_in_time: new Date(`${dateStr}T09:00:00`),
                        clock_out_time: new Date(`${dateStr}T17:00:00`),
                        shift_status: "completed",
                        work_type: "regular",
                    });
                }
            }
        }

        // Payroll
        for (const month of months) {
            const baseSalary = faker.number.int({ min: 20000, max: 80000 });
            payrollRecords.push({
                staff_id: emp.id,
                branch_id: emp.branch_id,
                month: month,
                base_salary: baseSalary.toString(),
                net_payable: baseSalary.toString(),
                status: "paid",
            });
        }
    }

    const chunkSize = 1000;
    for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
        await db.insert(staffAttendance).values(attendanceRecords.slice(i, i + chunkSize));
    }
    for (let i = 0; i < payrollRecords.length; i += chunkSize) {
        await db.insert(payroll).values(payrollRecords.slice(i, i + chunkSize));
    }

    // 6. Products
    console.log("Seeding products (Sales module)...");
    const productsRecords = [];
    for (let i = 0; i < 100; i++) {
        productsRecords.push({
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.commerce.price(),
            base_selling_price: faker.commerce.price(),
            category: faker.commerce.department(),
            barcode: faker.string.numeric(12),
            user_uid: "system"
        });
    }
    const insertedProducts = await db.insert(products).values(productsRecords).returning({ id: products.id, price: products.price });

    // 7. Customers
    console.log("Seeding customers...");
    const customerRecords = [];
    for (let i = 0; i < 50; i++) {
        customerRecords.push({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number().slice(0, 20),
            address: faker.location.streetAddress(),
            user_uid: "system",
            branch_id: faker.helpers.arrayElement(branchIds).id,
            customer_code: `CUST-${faker.string.numeric(5)}`
        });
    }
    const insertedCustomers = await db.insert(customers).values(customerRecords).returning({ id: customers.id });

    // 8. Orders & Order Items
    console.log("Seeding orders...");
    for (let i = 0; i < 200; i++) {
        const customer = faker.helpers.arrayElement(insertedCustomers);
        const branch = faker.helpers.arrayElement(branchIds);
        const pm = faker.helpers.arrayElement(pms);
        const orderTotal = faker.number.int({ min: 100, max: 5000 });
        
        const [order] = await db.insert(orders).values({
            customer_id: customer.id,
            branch_id: branch.id,
            total_amount: orderTotal.toString(),
            user_uid: "system",
            status: "completed",
            payment_method_id: pm ? pm.id : undefined,
            created_at: faker.date.recent({ days: 60 })
        }).returning({ id: orders.id });

        const itemsToPick = faker.number.int({ min: 1, max: 5 });
        const items = [];
        for (let j = 0; j < itemsToPick; j++) {
            const product = faker.helpers.arrayElement(insertedProducts);
            items.push({
                order_id: order.id,
                product_id: product.id,
                quantity: faker.number.int({ min: 1, max: 10 }),
                price: product.price
            });
        }
        await db.insert(orderItems).values(items);
    }

    console.log("Done seeding full database! All modules populated.");
    process.exit(0);
}

main().catch(e => {
    console.error("Error during seeding:", e);
    process.exit(1);
});
