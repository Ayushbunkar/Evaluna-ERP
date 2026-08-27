import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, BookOpen, FileText, Search, HelpCircle, Video, Download, Database } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Internal Documentation
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            Comprehensive documentation, guides, and resources for our ERP system.
            Find everything you need to effectively use our business management tools.
          </p>
        </div>

        {/* Search Section */}
        <section className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Search className="h-5 w-5 text-primary mr-2" />
                Search Documentation
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for topics, features, or keywords..."
                  className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" /> Search
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching for: "inventory management", "payroll processing", "report generation", etc.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">System Overview</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Learn about our ERP system architecture, modules, and key features.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ System architecture</li>
                  <li>â€¢ Module descriptions</li>
                  <li>â€¢ User roles and permissions</li>
                  <li>â€¢ System requirements</li>
                  <li>â€¢ Navigation guide</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Read Overview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <HelpCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Quick Start Guide</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Step-by-step guide to get you up and running quickly with our ERP system.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ First-time login</li>
                  <li>â€¢ Dashboard setup</li>
                  <li>â€¢ Basic navigation</li>
                  <li>â€¢ Common tasks</li>
                  <li>â€¢ Tips and best practices</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Start Quick Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Video className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Video Tutorials</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Visual guides and walkthroughs for key system features.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ System tour (5:32)</li>
                  <li>â€¢ Dashboard setup (4:18)</li>
                  <li>â€¢ Basic workflows (6:45)</li>
                  <li>â€¢ Reporting tools (7:22)</li>
                  <li>â€¢ Advanced features (8:10)</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Watch Tutorials
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Module Documentation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Module Documentation
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Database className="h-5 w-5 text-primary mr-2" />
                  Core Modules
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Financial Management:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Accounts payable/receivable</li>
                      <li>â€¢ General ledger</li>
                      <li>â€¢ Budget management</li>
                      <li>â€¢ Financial reporting</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Docs</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Inventory Management:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Stock tracking</li>
                      <li>â€¢ Supplier management</li>
                      <li>â€¢ Reorder automation</li>
                      <li>â€¢ Warehouse operations</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Docs</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  Business Operations
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Sales & POS:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Point of sale system</li>
                      <li>â€¢ Order management</li>
                      <li>â€¢ Customer records</li>
                      <li>â€¢ Sales analytics</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Docs</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Human Resources:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Employee management</li>
                      <li>â€¢ Payroll processing</li>
                      <li>â€¢ Attendance tracking</li>
                      <li>â€¢ Performance reviews</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Docs</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User Guides */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            User Guides & Manuals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <Download className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-semibold">Department Guides</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Role-specific guides tailored to different departments.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Sales Team Guide</span>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Finance Guide</span>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Operations Guide</span>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>HR Guide</span>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <HelpCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Quick Reference</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Handy cheat sheets and quick reference guides.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Keyboard Shortcuts</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Common Workflows</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Error Codes</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span>Data Entry Tips</span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* API Documentation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            API & Integration
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Database className="h-5 w-5 text-primary mr-2" />
                  API Documentation
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Comprehensive API documentation for developers and system integrators.
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">REST API:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Authentication methods</li>
                      <li>â€¢ Endpoint reference</li>
                      <li>â€¢ Request/response formats</li>
                      <li>â€¢ Rate limiting</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">API Reference</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Webhooks:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Event types</li>
                      <li>â€¢ Payload structures</li>
                      <li>â€¢ Security requirements</li>
                      <li>â€¢ Error handling</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">Webhook Guide</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  Integration Guides
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Step-by-step guides for integrating with third-party systems.
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Accounting Software:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ QuickBooks integration</li>
                      <li>â€¢ Xero setup</li>
                      <li>â€¢ Data mapping</li>
                      <li>â€¢ Synchronization</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Guide</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Payment Gateways:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Stripe integration</li>
                      <li>â€¢ PayPal setup</li>
                      <li>â€¢ Transaction processing</li>
                      <li>â€¢ Security requirements</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Guide</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Advanced Topics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Advanced Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Custom Reports</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Create and manage custom reports tailored to your needs.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Report builder guide</li>
                  <li>â€¢ Custom fields</li>
                  <li>â€¢ Advanced filtering</li>
                  <li>â€¢ Scheduled reports</li>
                  <li>â€¢ Export options</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Reporting Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Data Management</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Advanced data import, export, and management techniques.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Bulk data import</li>
                  <li>â€¢ Data validation</li>
                  <li>â€¢ Backup procedures</li>
                  <li>â€¢ Data cleanup</li>
                  <li>â€¢ Migration guides</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Data Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <HelpCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Troubleshooting</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Solutions to common issues and error resolution.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>â€¢ Error code reference</li>
                  <li>â€¢ Performance issues</li>
                  <li>â€¢ Login problems</li>
                  <li>â€¢ Data sync errors</li>
                  <li>â€¢ Browser compatibility</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Troubleshooting Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <BookOpen className="h-5 w-5 text-primary mr-2" />
                  Training Materials
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Training Courses:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ Beginner course (2 hours)</li>
                      <li>â€¢ Intermediate course (4 hours)</li>
                      <li>â€¢ Advanced course (6 hours)</li>
                      <li>â€¢ Department-specific training</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">View Courses</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Certification:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ User certification program</li>
                      <li>â€¢ Exam preparation</li>
                      <li>â€¢ Certification benefits</li>
                      <li>â€¢ Renewal process</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">Certification Info</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <HelpCircle className="h-5 w-5 text-primary mr-2" />
                  Support & Community
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Support Options:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ IT help desk (Ext. 1500)</li>
                      <li>â€¢ Email support (support@evaluna.com)</li>
                      <li>â€¢ Live chat support</li>
                      <li>â€¢ Priority support levels</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">Contact Support</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Community:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>â€¢ User forum</li>
                      <li>â€¢ Knowledge base</li>
                      <li>â€¢ Best practices sharing</li>
                      <li>â€¢ Feature requests</li>
                    </ul>
                    <Button className="mt-2" variant="outline" size="sm">Join Community</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Need More Help?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our IT support team is available to assist you
            with any questions or issues you may have.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/contact">Contact IT Support</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/features">Explore System Features</Link>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

