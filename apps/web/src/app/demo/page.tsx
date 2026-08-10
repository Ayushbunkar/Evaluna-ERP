import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, Monitor, MousePointer, Database, Shield, User, Settings } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
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
            System Overview & Interactive Demo
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            Explore our comprehensive ERP system through interactive demonstrations and detailed walkthroughs
            of our internal business management tools.
          </p>
        </div>

        {/* Demo Sections */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Interactive System Demonstrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <Monitor className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-xl font-semibold">Dashboard Overview</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Explore our comprehensive dashboard with real-time analytics, KPI tracking,
                  and customized views for different departments.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Sales Dashboard</span>
                    <Button variant="outline" size="sm">View Demo</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Inventory Dashboard</span>
                    <Button variant="outline" size="sm">View Demo</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Financial Dashboard</span>
                    <Button variant="outline" size="sm">View Demo</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <MousePointer className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-xl font-semibold">Interactive Features</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Try out our key system features with guided demonstrations and interactive tutorials.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">POS System Demo</span>
                    <Button variant="outline" size="sm">Try Now</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Inventory Management</span>
                    <Button variant="outline" size="sm">Try Now</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Reporting Tools</span>
                    <Button variant="outline" size="sm">Try Now</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* System Modules */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            System Modules & Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Database className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Data Management</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Our robust data management system ensures data integrity, security, and accessibility.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Centralized database</li>
                  <li>• Real-time synchronization</li>
                  <li>• Data backup & recovery</li>
                  <li>• Advanced search capabilities</li>
                  <li>• Custom data views</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Security Features</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Comprehensive security measures to protect our business data and ensure compliance.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Role-based access control</li>
                  <li>• Data encryption</li>
                  <li>• Audit logging</li>
                  <li>• Two-factor authentication</li>
                  <li>• Regular security updates</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <User className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">User Management</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Flexible user management system with customizable permissions and profiles.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• User roles & permissions</li>
                  <li>• Profile customization</li>
                  <li>• Activity tracking</li>
                  <li>• Department-based access</li>
                  <li>• User onboarding workflows</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Video Tutorials Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Video Tutorials & Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Monitor className="h-5 w-5 text-primary mr-2" />
                  Getting Started
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Video tutorials to help new users get familiar with our ERP system.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">System Overview (5:32)</span>
                    <Button variant="outline" size="sm">Watch</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Navigation Guide (3:45)</span>
                    <Button variant="outline" size="sm">Watch</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Dashboard Tour (4:12)</span>
                    <Button variant="outline" size="sm">Watch</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Settings className="h-5 w-5 text-primary mr-2" />
                  Advanced Features
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  In-depth guides for advanced system features and customization.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Reporting Tools (7:22)</span>
                    <Button variant="outline" size="sm">Watch</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Custom Dashboards (6:18)</span>
                    <Button variant="outline" size="sm">Watch</Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Integration Guide (8:05)</span>
                    <Button variant="outline" size="sm">Watch</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* System Requirements */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            System Requirements & Access
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Technical Requirements</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our ERP system is designed to work on modern devices and browsers.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Supported Browsers:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Chrome (latest version)</li>
                      <li>• Firefox (latest version)</li>
                      <li>• Safari (latest version)</li>
                      <li>• Edge (latest version)</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Device Requirements:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Desktop or laptop computer</li>
                      <li>• Tablet devices</li>
                      <li>• Minimum 1024x768 resolution</li>
                      <li>• Internet connection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Access Information</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Learn how to access our ERP system and get support when needed.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Access Methods:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Web browser access</li>
                      <li>• Mobile responsive design</li>
                      <li>• VPN access for remote users</li>
                      <li>• Single sign-on (SSO) support</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Support Options:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• IT help desk</li>
                      <li>• Online documentation</li>
                      <li>• Training sessions</li>
                      <li>• User community forum</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Ready to Explore Our System?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Access our comprehensive ERP system to manage all aspects of our business operations.
            Login with your credentials to get started.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/login">Employee Login</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/features">View System Features</Link>
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
              © {new Date().getFullYear()} Evaluna Technologies. Internal Use Only.
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