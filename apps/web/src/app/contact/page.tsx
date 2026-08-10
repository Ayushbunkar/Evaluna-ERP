import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, Mail, Phone, MapPin, User, Laptop, Shield, Headset, FileText } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
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
            Contact IT Support
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            Need assistance with our ERP system? Our IT support team is here to help with any technical issues,
            questions, or training needs.
          </p>
        </div>

        {/* Contact Options */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            How to Reach Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Email Support</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  For non-urgent issues and detailed requests
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">General Support</span>
                    <span className="text-sm text-muted-foreground">support@evaluna.com</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">ERP Issues</span>
                    <span className="text-sm text-muted-foreground">erp-support@evaluna.com</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Security Concerns</span>
                    <span className="text-sm text-muted-foreground">security@evaluna.com</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Response time: 1-2 business days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Phone Support</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  For urgent issues requiring immediate assistance
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">IT Help Desk</span>
                    <span className="text-sm text-muted-foreground">Ext. 1500</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">ERP Hotline</span>
                    <span className="text-sm text-muted-foreground">Ext. 1501</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">After Hours</span>
                    <span className="text-sm text-muted-foreground">Ext. 1502</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Available: Mon-Fri, 8 AM - 6 PM
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Support Teams */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Our Support Teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <User className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">User Support</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Assistance with system navigation, features, and general usage.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Account access issues</li>
                  <li>• Feature explanations</li>
                  <li>• Basic troubleshooting</li>
                  <li>• User guide assistance</li>
                  <li>• Password resets</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Contact User Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Laptop className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Technical Support</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Help with technical issues, system errors, and performance problems.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• System errors</li>
                  <li>• Performance issues</li>
                  <li>• Integration problems</li>
                  <li>• Data import/export</li>
                  <li>• Browser compatibility</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Contact Technical Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Security Team</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Report security concerns, access issues, and compliance questions.
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• Suspicious activity</li>
                  <li>• Access violations</li>
                  <li>• Data breaches</li>
                  <li>• Compliance questions</li>
                  <li>• Security training</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Contact Security Team
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Common Issues */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Common Issues & Solutions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Headset className="h-5 w-5 text-primary mr-2" />
                  Login Problems
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Forgot Password:</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the "Forgot Password" link on the login page or contact IT support.
                    </p>
                    <Button variant="outline" size="sm">Reset Password</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Account Locked:</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      After 5 failed attempts, your account will be locked for 30 minutes.
                    </p>
                    <Button variant="outline" size="sm">Unlock Account</Button>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Access Denied:</h4>
                    <p className="text-sm text-muted-foreground">
                      Contact your manager or IT support to verify your access permissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <Laptop className="h-5 w-5 text-primary mr-2" />
                  System Performance
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Slow Performance:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Clear your browser cache</li>
                      <li>• Try a different browser</li>
                      <li>• Check your internet connection</li>
                      <li>• Close unused tabs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Error Messages:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Note the exact error message</li>
                      <li>• Try refreshing the page</li>
                      <li>• Check if others are experiencing issues</li>
                      <li>• Report to IT with screenshots</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Data Not Saving:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Check your internet connection</li>
                      <li>• Verify you have edit permissions</li>
                      <li>• Try saving smaller batches of data</li>
                      <li>• Contact IT if issues persist</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Support Resources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Self-Help Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-semibold">IT Support Portal</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Access our comprehensive support portal for knowledge base articles,
                  FAQs, and troubleshooting guides.
                </p>
                <Button className="w-full" variant="outline">
                  Visit Support Portal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <Headset className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-semibold">Training Videos</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Watch step-by-step video tutorials on using our ERP system
                  features and best practices.
                </p>
                <Button className="w-full" variant="outline">
                  View Training Videos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-semibold">User Guides</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Download comprehensive user manuals and quick reference
                  guides for all system modules.
                </p>
                <Button className="w-full" variant="outline">
                  Download User Guides
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <User className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-semibold">Community Forum</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">
                  Connect with other users, share tips, and get answers from
                  our community of experienced ERP users.
                </p>
                <Button className="w-full" variant="outline">
                  Join Community Forum
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Office Locations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-8 text-center">
            Our Office Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  Headquarters
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Address:</h4>
                    <p className="text-sm text-muted-foreground">
                      Evaluna Business Park<br />
                      123 Tech Avenue, Suite 500<br />
                      Innovation City, ST 12345
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Contact:</h4>
                    <p className="text-sm text-muted-foreground">
                      Phone: (555) 123-4567<br />
                      Fax: (555) 123-4568
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">IT Support:</h4>
                    <p className="text-sm text-muted-foreground">
                      Ext. 1500 (Internal)<br />
                      support@evaluna.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  Regional Office
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Address:</h4>
                    <p className="text-sm text-muted-foreground">
                      Evaluna Tech Center<br />
                      456 Innovation Drive<br />
                      Business City, ST 67890
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Contact:</h4>
                    <p className="text-sm text-muted-foreground">
                      Phone: (555) 234-5678<br />
                      Fax: (555) 234-5679
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">IT Support:</h4>
                    <p className="text-sm text-muted-foreground">
                      Ext. 1501 (Internal)<br />
                      regional-support@evaluna.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Need Immediate Assistance?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our IT support team is available to help with any issues you're experiencing.
            Don't hesitate to reach out for prompt assistance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="shadow-lg">
              <Link href="mailto:support@evaluna.com">Email Support Team</Link>
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
              © {new Date().getFullYear()} Evaluna Technologies. Internal Use Only.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Internal Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}