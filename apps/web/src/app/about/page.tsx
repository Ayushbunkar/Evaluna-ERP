import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, Users, Briefcase, Globe, Building2 } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
            About Our Internal ERP System
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            Evaluna ERP is our comprehensive internal business management system designed to streamline
            operations and improve efficiency across all departments.
          </p>
        </div>

        {/* Company Overview */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <h2 className="text-2xl font-bold">Company Overview</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Evaluna Technologies is a leading business organization that has developed and implemented
                our own comprehensive ERP system to manage all aspects of our operations. Our internal
                ERP system is tailored specifically to our business needs and processes.
              </p>
              <p className="text-muted-foreground">
                Founded with the vision of creating efficient business processes, we have grown into a
                multi-department organization with operations across various locations. Our ERP system
                serves as the backbone of our daily operations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <span className="font-medium">Headquarters:</span>
                  <span className="text-muted-foreground">Evaluna Business Park</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="font-medium">Employees:</span>
                  <span className="text-muted-foreground">150+ team members</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                  <span className="font-medium">Departments:</span>
                  <span className="text-muted-foreground">Sales, Operations, Finance, HR, IT</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-6 w-6 text-primary" />
                  <span className="font-medium">Locations:</span>
                  <span className="text-muted-foreground">Multiple branches nationwide</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Our Mission */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Our Mission & Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <MountainIcon className="h-5 w-5 text-primary mr-2" />
                  Our Mission
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  To create and maintain an efficient, integrated business management system that
                  empowers our team members with the tools and data they need to make informed
                  decisions and drive our business forward.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Streamline all business processes</li>
                  <li>â€¢ Provide real-time business insights</li>
                  <li>â€¢ Enhance inter-departmental collaboration</li>
                  <li>â€¢ Ensure data security and compliance</li>
                  <li>â€¢ Continuously improve operational efficiency</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  Our Values
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Innovation</h4>
                    <p className="text-sm text-muted-foreground">
                      We continuously improve our systems and processes to stay ahead.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Collaboration</h4>
                    <p className="text-sm text-muted-foreground">
                      Teamwork across departments is key to our success.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Integrity</h4>
                    <p className="text-sm text-muted-foreground">
                      We maintain the highest ethical standards in all our operations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Excellence</h4>
                    <p className="text-sm text-muted-foreground">
                      We strive for quality and efficiency in everything we do.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ERP System Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Our ERP System
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">System Architecture</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our ERP system is built on modern web technologies with a modular architecture
                  that allows for easy maintenance and scalability.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Cloud-based infrastructure for accessibility</li>
                  <li>â€¢ Role-based access control for security</li>
                  <li>â€¢ Real-time data synchronization</li>
                  <li>â€¢ Mobile-responsive design</li>
                  <li>â€¢ Comprehensive API integration capabilities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Key Features</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Financial Management</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Inventory Control</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Sales & POS</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Customer Management</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>HR & Payroll</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Supply Chain</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Reporting & Analytics</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">â€¢</span>
                      <span>Multi-branch Support</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <h3 className="text-lg font-semibold">Leadership Team</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Our experienced leadership team guides the strategic direction and implementation
                  of our ERP system to ensure it meets our business objectives.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ CEO & Founder</li>
                  <li>â€¢ CTO</li>
                  <li>â€¢ COO</li>
                  <li>â€¢ CFO</li>
                  <li>â€¢ Department Heads</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <h3 className="text-lg font-semibold">IT & Development</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Our dedicated IT team maintains, enhances, and supports our ERP system,
                  ensuring it runs smoothly and securely.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ System Administrators</li>
                  <li>â€¢ Software Developers</li>
                  <li>â€¢ Database Specialists</li>
                  <li>â€¢ IT Support Staff</li>
                  <li>â€¢ Security Experts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <h3 className="text-lg font-semibold">Department Users</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  All our department teams use the ERP system daily to manage their
                  respective operations and collaborate across the organization.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Sales & Marketing</li>
                  <li>â€¢ Operations</li>
                  <li>â€¢ Finance & Accounting</li>
                  <li>â€¢ Human Resources</li>
                  <li>â€¢ Customer Service</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Learn More About Our Systems
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Discover how our comprehensive ERP system supports all aspects of our business operations
            and helps us achieve our goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/features">Explore Our Systems</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
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

