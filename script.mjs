import fs from 'fs';
import path from 'path';

const layoutsDir = path.join(process.cwd(), 'apps', 'web', 'src', 'app', '(dashboards)');

const findLayouts = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findLayouts(filePath, fileList);
        } else if (file === 'layout.tsx') {
            fileList.push(filePath);
        }
    }
    return fileList;
};

const layouts = findLayouts(layoutsDir);

const iconMap = {
    'Dashboard': 'LayoutDashboard',
    'Employees': 'Users',
    'Suppliers': 'Truck',
    'Customers': 'Users',
    'Companies': 'Building2',
    'Branches': 'MapPin',
    'Finance': 'DollarSign',
    'Settings': 'Settings',
    'Inventory': 'Package',
    'Orders': 'ShoppingCart',
    'Audit': 'FileCheck',
    'HR': 'UsersRound',
    'Manager': 'UserCog',
    'Auditor': 'ClipboardCheck',
    'Driver': 'Car',
    'Picker': 'Box',
    'Checker': 'CheckSquare',
    'Packer': 'PackagePlus',
    'POS': 'Monitor',
    'Purchases': 'ShoppingBag',
    'Route Manager': 'Route',
    'Sales': 'TrendingUp',
    'Superadmin': 'Shield',
    'Evaluna Admin': 'ShieldAlert',
    'Profile': 'User',
    'Findings': 'AlertCircle',
    'Tasks': 'ListTodo',
    'Backups': 'DatabaseBackup',
    'Monitoring': 'Activity',
    'Roles & Permissions': 'Key',
    'Departments': 'Network',
    'Store Credit': 'CreditCard',
    'Order History': 'History',
    'Delivery Tracking': 'Map',
    'My Routes': 'MapRoute',
    'Delivery History': 'History',
    'Vehicle Status': 'Truck',
    'Support Tickets': 'Ticket',
    'Financial Dashboard': 'LineChart',
    'Invoices & Payments': 'FileText',
    'Cashbook': 'BookOpen',
    'Bank Reconciliations': 'Building',
    'Expense Reports': 'Receipt',
    'Employee Directory': 'BookUser',
    'Attendance & Leave': 'CalendarClock',
    'Payroll': 'Banknote',
    'Performance Reviews': 'Star',
    'Inventory Dashboard': 'PackageCheck',
    'Low Stock Alerts': 'BellRing',
    'Purchase Orders': 'FileSignature',
    'Transfers': 'ArrowRightLeft',
    'Reports': 'FileBarChart',
    'Active Picks': 'PlaySquare',
    'Completed Picks': 'CheckSquare',
    'Pack Orders': 'PackageOpen',
    'Batch Validation': 'ListChecks',
    'Create Invoice': 'FilePlus',
    'Payment Processing': 'CreditCard',
    'Refunds': 'Undo2',
    'Order Queue': 'List',
    'Vendor Management': 'Store',
    'Route Optimization': 'Route',
    'Dispatch': 'Send',
    'Users': 'Users',
    'Products': 'Package',
    'Approvals': 'CheckCircle'
};

for (const layoutPath of layouts) {
    let content = fs.readFileSync(layoutPath, 'utf8');
    let importedIcons = new Set();
    
    // Replace icon + span text
    content = content.replace(/<svg[\s\S]*?<\/svg>\s*<span className="ml-3">([^<]+)<\/span>/g, (match, text) => {
        const iconName = iconMap[text] || 'Circle';
        importedIcons.add(iconName);
        return \<\ className="h-5 w-5 text-gray-400" />
								<span className="ml-3">\</span>\;
    });
    
    // Replace brand icon
    content = content.replace(/<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500\/20">[\s\S]*?<\/span>\s*<span className="font-semibold text-gray-900 text-lg dark:text-gray-100">\s*([^<]+)\s*<\/span>/, (match, text) => {
        let trimmed = text.trim();
        const iconName = iconMap[trimmed] || 'Hexagon';
        importedIcons.add(iconName);
        return \<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
								<\ className="h-5 w-5 text-blue-600" />
							</span>
							<span className="font-semibold text-gray-900 text-lg dark:text-gray-100">
								\
							</span>\;
    });
    
    // Replace profile icon
    content = content.replace(/<button className="flex items-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">[\s\S]*?<\/svg>\s*<span className="ml-2 text-gray-600 text-sm dark:text-gray-300">\s*Profile\s*<\/span>\s*<\/button>/, (match) => {
        importedIcons.add('User');
        return \<button className="flex items-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
									<User className="h-5 w-5 text-gray-400" />
									<span className="ml-2 text-gray-600 text-sm dark:text-gray-300">
										Profile
									</span>
								</button>\;
    });

    if (importedIcons.size > 0 && !content.includes('lucide-react')) {
        const importStatement = \import { \ } from "lucide-react";\\n\;
        // Insert after first import
        content = content.replace(/import Link from "next\/link";\n/, \import Link from "next/link";\n\\);
    }

    fs.writeFileSync(layoutPath, content);
    console.log('Updated', layoutPath);
}
