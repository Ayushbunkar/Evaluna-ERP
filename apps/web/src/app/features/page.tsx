import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, BarChart3, Package, ShoppingCart, Users, Truck, MountainIcon } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MountainIcon className="h-8 w-8 text-primary" strokeWidth={2} />
              <span className="font-bold text-xl text-foreground">Evaluna ERP</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" className="text-sm">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Our Internal ERP System Features
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            Evaluna ERP provides comprehensive tools for managing our business operations efficiently.
            All features are tailored for our internal use and operational needs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: <BarChart3 className="h-8 w-8 text-primary" />,
              title: "Real-time Analytics",
              description: "Monitor our business performance with live dashboards and comprehensive reports that update in real-time for better decision making.",
              id: "analytics"
            },
            {
              icon: <Package className="h-8 w-8 text-primary" />,
              title: "Inventory Management",
              description: "Track our stock levels across all locations, manage supplier relationships, and receive automated alerts for low stock items.",
              id: "inventory"
            },
            {
              icon: <ShoppingCart className="h-8 w-8 text-primary" />,
              title: "Point of Sale",
              description: "Our internal POS system supports multiple locations with offline capabilities, ensuring smooth sales operations even during connectivity issues.",
              id: "pos"
            },
            {
              icon: <Users className="h-8 w-8 text-primary" />,
              title: "Customer Management",
              description: "Maintain comprehensive customer records, track purchase history, and manage loyalty programs for our valued customers.",
              id: "crm"
            },
            {
              icon: <Truck className="h-8 w-8 text-primary" />,
              title: "Supply Chain Management",
              description: "Manage our supplier relationships, track purchases, and monitor deliveries with complete end-to-end visibility of our supply chain.",
              id: "supply-chain"
            },
            {
              icon: <MountainIcon className="h-8 w-8 text-primary" />,
              title: "Multi-Branch Operations",
              description: "Centralized management system for all our branches with role-based access control tailored to our organizational structure.",
              id: "multi-branch"
            }
          ].map((feature, index) => (
            <Card key={index} id={feature.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-col items-center text-center">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Internal Systems Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Our Internal Business Systems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Financial Management</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Comprehensive accounting tools for managing our finances, including accounts payable/receivable,
                  general ledger, and financial reporting.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Expense tracking and approval workflows</li>
                  <li>â€¢ Budget management and forecasting</li>
                  <li>â€¢ Tax calculation and compliance tools</li>
                  <li>â€¢ Multi-currency support for international operations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Human Resources</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Complete HR management system for our workforce, including employee records,
                  attendance tracking, and payroll processing.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Employee onboarding and offboarding</li>
                  <li>â€¢ Time and attendance management</li>
                  <li>â€¢ Leave and vacation tracking</li>
                  <li>â€¢ Performance evaluation system</li>
                  <li>â€¢ Payroll processing and tax filings</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Operations Management</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Tools for managing our day-to-day business operations across all departments.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Workflow automation and process management</li>
                  <li>â€¢ Document management and version control</li>
                  <li>â€¢ Task assignment and progress tracking</li>
                  <li>â€¢ Inter-departmental communication tools</li>
                  <li>â€¢ Compliance and audit tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Business Intelligence</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Advanced analytics and reporting tools to help us make data-driven decisions.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Custom report builder with drag-and-drop interface</li>
                  <li>â€¢ Data visualization tools and dashboards</li>
                  <li>â€¢ Predictive analytics for business forecasting</li>
                  <li>â€¢ Key performance indicator tracking</li>
                  <li>â€¢ Data export and integration capabilities</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Access Our Internal Systems
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our ERP system is designed exclusively for internal use. All employees can access
            the tools they need based on their roles and permissions.
          </p>
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/login">Employee Login</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MountainIcon className="h-6 w-6 text-primary" strokeWidth={2} />
              <span className="font-bold text-lg text-foreground">Evaluna ERP</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Â© {new Date().getFullYear()} Evaluna Technologies. Internal Use Only.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact IT Support</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Internal Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

