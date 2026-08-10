import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, Shield, FileText, Lock, Eye, User } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-6">
            Privacy Policy
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our internal ERP system.
          </p>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                Introduction
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Evaluna Technologies ("we", "our", "us") is committed to protecting the privacy and security of our employees'
                personal information. This Privacy Policy describes how we collect, use, and safeguard information within our
                internal ERP system.
              </p>
              <p className="text-muted-foreground">
                This policy applies to all users of our ERP system, including employees, contractors, and authorized personnel.
                By accessing or using our system, you consent to the practices described in this policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                Information We Collect
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We collect various types of information to provide and improve our ERP system services:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Personal Information:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Full name and contact information</li>
                    <li>• Employee ID and job title</li>
                    <li>• Department and location</li>
                    <li>• Contact information (email, phone)</li>
                    <li>• Emergency contact details</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Business Information:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Job performance data</li>
                    <li>• Attendance and time records</li>
                    <li>• Training and certification records</li>
                    <li>• Project assignments and progress</li>
                    <li>• Department-specific operational data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">System Usage Data:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Login times and session duration</li>
                    <li>• IP addresses and device information</li>
                    <li>• System access logs</li>
                    <li>• Feature usage patterns</li>
                    <li>• Error reports and debugging information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Lock className="h-5 w-5 text-primary mr-2" />
                How We Use Your Information
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We use the information we collect for various business purposes:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• To provide and maintain our ERP system services</li>
                <li>• To manage employee records and HR processes</li>
                <li>• To process payroll and benefits administration</li>
                <li>• To track business operations and performance</li>
                <li>• To generate reports and analytics for management</li>
                <li>• To ensure system security and prevent fraud</li>
                <li>• To comply with legal and regulatory requirements</li>
                <li>• To improve system functionality and user experience</li>
                <li>• To communicate important company information</li>
                <li>• To provide technical support and troubleshooting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <User className="h-5 w-5 text-primary mr-2" />
                Information Sharing and Disclosure
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We may share your information in the following circumstances:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Within Our Organization:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• With your direct managers and supervisors</li>
                    <li>• With HR and payroll departments</li>
                    <li>• With IT support staff for troubleshooting</li>
                    <li>• With authorized personnel based on role-based access</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">With Service Providers:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Cloud hosting and infrastructure providers</li>
                    <li>• Payroll processing services</li>
                    <li>• IT security and maintenance vendors</li>
                    <li>• All service providers are bound by confidentiality agreements</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">For Legal Compliance:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• To comply with applicable laws and regulations</li>
                    <li>• To respond to lawful requests from authorities</li>
                    <li>• To protect our rights and property</li>
                    <li>• To investigate potential violations of our policies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Eye className="h-5 w-5 text-primary mr-2" />
                Data Security and Retention
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Security Measures:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Role-based access control and authentication</li>
                    <li>• Data encryption in transit and at rest</li>
                    <li>• Regular security audits and vulnerability testing</li>
                    <li>• Secure data backup and disaster recovery procedures</li>
                    <li>• Employee training on data security best practices</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Data Retention:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Employee records: Retained for duration of employment + 7 years</li>
                    <li>• Financial records: Retained for 7 years as per legal requirements</li>
                    <li>• System logs: Retained for 12 months</li>
                    <li>• Deleted data may be retained in backups for up to 90 days</li>
                    <li>• Specific retention periods may vary based on legal requirements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <User className="h-5 w-5 text-primary mr-2" />
                Your Rights and Choices
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                As an employee using our ERP system, you have certain rights regarding your personal information:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Right to access your personal information</li>
                <li>• Right to request correction of inaccurate data</li>
                <li>• Right to request deletion of certain information (subject to legal requirements)</li>
                <li>• Right to limit processing of your personal data</li>
                <li>• Right to receive information about data sharing</li>
                <li>• Right to file complaints with appropriate authorities</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact our HR department or IT security team.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                Policy Updates
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. When we make changes, we will:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Post the updated policy on our internal systems</li>
                <li>• Update the "Last updated" date at the top of this policy</li>
                <li>• Notify employees of significant changes via company communication channels</li>
                <li>• Provide reasonable notice before major policy changes take effect</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                Contact Information
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">HR Department:</h3>
                  <p className="text-sm text-muted-foreground">hr@evaluna.com</p>
                  <p className="text-sm text-muted-foreground">Ext. 1200</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">IT Security Team:</h3>
                  <p className="text-sm text-muted-foreground">security@evaluna.com</p>
                  <p className="text-sm text-muted-foreground">Ext. 1201</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Data Protection Officer:</h3>
                  <p className="text-sm text-muted-foreground">dpo@evaluna.com</p>
                  <p className="text-sm text-muted-foreground">Ext. 1202</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <section className="text-center mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Need More Information?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you have any questions about our privacy practices or need to exercise your rights,
            please don't hesitate to contact our HR or IT security teams.
          </p>
          <Button asChild variant="outline">
            <Link href="/contact">Contact IT Support</Link>
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
              © {new Date().getFullYear()} Evaluna Technologies. Internal Use Only.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact IT Support</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Internal Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}