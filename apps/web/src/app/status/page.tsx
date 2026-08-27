import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, CheckCircle2, AlertTriangle, Clock, Server, Database, Shield, Activity } from "lucide-react";
import Link from "next/link";

export default function StatusPage() {
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
            System Status
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            Real-time status and performance monitoring of our ERP system and related services.
          </p>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* System Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Server className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">ERP System</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="flex justify-center items-center mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                    <span className="font-medium text-green-600">Operational</span>
                  </div>
                  <p className="text-sm text-muted-foreground">All core services are running normally</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Uptime (24h):</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-medium">187</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Database className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Database</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="flex justify-center items-center mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                    <span className="font-medium text-green-600">Healthy</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Database connections stable</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Query Performance:</span>
                    <span className="font-medium">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Usage:</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backup Status:</span>
                    <span className="font-medium text-green-600">Complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Security</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="flex justify-center items-center mb-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                    <span className="font-medium text-green-600">Secure</span>
                  </div>
                  <p className="text-sm text-muted-foreground">No active security alerts</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Failed Login Attempts:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions:</span>
                    <span className="font-medium">214</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Updates:</span>
                    <span className="font-medium text-green-600">Current</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Status */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Service Status
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Activity className="h-5 w-5 text-primary mr-2" />
                  Core Services
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Authentication Service</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>API Gateway</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Notification Service</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Reporting Engine</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Server className="h-5 w-5 text-primary mr-2" />
                  Integration Services
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Payment Gateway</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Email Service</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>SMS Gateway</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Cloud Storage</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  Response Times
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">API Endpoints:</span>
                      <span className="font-medium">187ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Database Queries:</span>
                      <span className="font-medium">42ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Page Load:</span>
                      <span className="font-medium">845ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Authentication:</span>
                      <span className="font-medium">212ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  All response times are within acceptable performance thresholds
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Activity className="h-5 w-5 text-primary mr-2" />
                  System Activity
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Active Sessions:</span>
                      <span className="font-medium">214</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">API Requests:</span>
                      <span className="font-medium">1,248</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Database Queries:</span>
                      <span className="font-medium">3,872</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Data Updates:</span>
                      <span className="font-medium">845</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  System activity levels are normal for current usage patterns
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Recent Incidents & Maintenance
          </h2>
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Incident History</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start p-3 bg-green-50/50 rounded-lg border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Scheduled Maintenance</h4>
                        <p className="text-sm text-muted-foreground">Database optimization and security updates</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">2026-07-15 02:00 AM</span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>
                      <span className="text-xs text-muted-foreground ml-2">Duration: 45 minutes</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-green-50/50 rounded-lg border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Performance Optimization</h4>
                        <p className="text-sm text-muted-foreground">Query optimization and caching improvements</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">2026-07-08 01:30 AM</span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>
                      <span className="text-xs text-muted-foreground ml-2">Duration: 30 minutes</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-green-50/50 rounded-lg border border-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Security Patch</h4>
                        <p className="text-sm text-muted-foreground">Critical security updates applied</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">2026-07-01 03:15 AM</span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>
                      <span className="text-xs text-muted-foreground ml-2">Duration: 22 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                No active incidents or outages. All maintenance completed successfully.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Upcoming Maintenance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Upcoming Maintenance
          </h2>
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Scheduled Maintenance Windows</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <Clock className="h-5 w-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Monthly Security Updates</h4>
                        <p className="text-sm text-muted-foreground">Security patches and vulnerability fixes</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">2026-08-01 03:00 AM</span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Scheduled</span>
                      <span className="text-xs text-muted-foreground ml-2">Expected duration: 30-45 minutes</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Impact:</strong> Brief service interruption during update window
                    </div>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <Clock className="h-5 w-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Performance Tuning</h4>
                        <p className="text-sm text-muted-foreground">Database optimization and index rebuilding</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">2026-08-15 02:30 AM</span>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Scheduled</span>
                      <span className="text-xs text-muted-foreground ml-2">Expected duration: 45-60 minutes</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Impact:</strong> Reduced performance during maintenance, no downtime expected
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                All maintenance is scheduled during low-usage periods to minimize impact on operations.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* System Health */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            System Health Summary
          </h2>
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <h3 className="text-xl font-semibold text-center">Overall System Status</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="flex justify-center items-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mr-3" />
                  <div>
                    <h2 className="text-3xl font-bold text-green-600">All Systems Operational</h2>
                    <p className="text-muted-foreground">No active incidents or performance issues</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-sm text-muted-foreground">Uptime (30 days)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">99.8%</div>
                  <div className="text-sm text-muted-foreground">SLA Compliance</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">Active Incidents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">245ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg">
                  <span>â€¢ Core ERP System</span>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg">
                  <span>â€¢ Database Services</span>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">Healthy</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg">
                  <span>â€¢ Authentication Services</span>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg">
                  <span>â€¢ Integration Services</span>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">Operational</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg">
                  <span>â€¢ Security Systems</span>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-medium">Secure</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Need Assistance?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you're experiencing any issues or have questions about system status,
            please contact our IT support team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/contact">Contact IT Support</Link>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

