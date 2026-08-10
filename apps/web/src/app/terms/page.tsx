import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { ArrowLeft, MountainIcon, FileText, Shield, Gavel, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
            These Terms of Service govern your access to and use of our internal ERP system.
          </p>
          <div className="text-sm text-muted-foreground">
            Effective date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                Introduction
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Welcome to Evaluna Technologies Internal ERP System. These Terms of Service ("Terms") govern your access to and use of our
                proprietary business management system, including all related services, tools, and content.
              </p>
              <p className="text-muted-foreground">
                By accessing or using our ERP system, you agree to be bound by these Terms. If you do not agree to these Terms,
                you may not access or use our system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                Acceptable Use Policy
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                When using our ERP system, you agree to:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use the system only for authorized business purposes</li>
                <li>• Comply with all company policies and procedures</li>
                <li>• Maintain the confidentiality of sensitive information</li>
                <li>• Use only your assigned credentials and not share them</li>
                <li>• Report any security issues or suspicious activity immediately</li>
                <li>• Follow all data protection and privacy regulations</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Prohibited activities include, but are not limited to:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Unauthorized access to data or systems</li>
                <li>• Sharing confidential information externally</li>
                <li>• Attempting to bypass security measures</li>
                <li>• Using the system for personal gain</li>
                <li>• Introducing malware or harmful software</li>
                <li>• Any activity that violates company policies</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Gavel className="h-5 w-5 text-primary mr-2" />
                User Responsibilities
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                As a user of our ERP system, you are responsible for:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Maintaining the confidentiality of your login credentials</li>
                <li>• Using the system in compliance with all applicable laws</li>
                <li>• Reporting any suspected security breaches immediately</li>
                <li>• Ensuring the accuracy of data you enter into the system</li>
                <li>• Completing required training on system usage</li>
                <li>• Following all company IT security policies</li>
                <li>• Using the system only for authorized business purposes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <AlertTriangle className="h-5 w-5 text-primary mr-2" />
                System Access and Security
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Access Control:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Access is granted based on job role and responsibilities</li>
                    <li>• Users may only access data necessary for their job functions</li>
                    <li>• Access levels are reviewed and updated regularly</li>
                    <li>• Unauthorized access attempts will be investigated</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Data Security:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• All data is encrypted in transit and at rest</li>
                    <li>• Regular security audits are conducted</li>
                    <li>• System vulnerabilities are patched promptly</li>
                    <li>• Data backups are performed regularly</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Incident Reporting:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Report lost or compromised credentials immediately</li>
                    <li>• Report any suspicious system behavior</li>
                    <li>• Report unauthorized access attempts</li>
                    <li>• Report any potential data breaches</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                Intellectual Property
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                All content, software, and materials within our ERP system are the property of Evaluna Technologies
                and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground">
                You may not copy, modify, distribute, or create derivative works from any part of our system without
                explicit written permission from Evaluna Technologies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                Confidentiality and Data Protection
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                All information within our ERP system is considered confidential and proprietary to Evaluna Technologies.
                You agree to:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Maintain the confidentiality of all business data</li>
                <li>• Not disclose confidential information to unauthorized parties</li>
                <li>• Use confidential information only for authorized business purposes</li>
                <li>• Comply with all data protection laws and regulations</li>
                <li>• Report any potential confidentiality breaches immediately</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Gavel className="h-5 w-5 text-primary mr-2" />
                Termination of Access
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your access to our ERP system may be terminated immediately for any of the following reasons:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Violation of these Terms of Service</li>
                <li>• Violation of company policies or procedures</li>
                <li>• Suspicion of unauthorized or fraudulent activity</li>
                <li>• Termination of employment or contract</li>
                <li>• Security concerns or potential breaches</li>
                <li>• Failure to comply with training requirements</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Upon termination of access, you must immediately cease all use of the system and return any company
                property or data in your possession.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <AlertTriangle className="h-5 w-5 text-primary mr-2" />
                Disclaimer of Warranties
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Our ERP system is provided "as is" without any warranties, express or implied. We do not guarantee that:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• The system will be error-free or uninterrupted</li>
                <li>• The system will meet your specific requirements</li>
                <li>• Any defects will be corrected</li>
                <li>• The system will be compatible with all devices or browsers</li>
                <li>• The system will be secure from all vulnerabilities</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We strive to maintain system availability and performance, but we do not guarantee 100% uptime.
                Scheduled maintenance and unexpected outages may occur.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                Limitation of Liability
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                To the fullest extent permitted by law, Evaluna Technologies shall not be liable for:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Any indirect, incidental, or consequential damages</li>
                <li>• Loss of data or business interruption</li>
                <li>• Errors or omissions in system data</li>
                <li>• Unauthorized access to the system</li>
                <li>• Any damages resulting from system use or inability to use</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                Changes to Terms
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms at any time. When we make changes, we will:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Post the updated Terms on our internal systems</li>
                <li>• Update the "Effective date" at the top of these Terms</li>
                <li>• Notify employees of significant changes via company communication channels</li>
                <li>• Provide reasonable notice before major changes take effect</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Your continued use of the system after any changes constitutes your acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <Gavel className="h-5 w-5 text-primary mr-2" />
                Governing Law
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
                where Evaluna Technologies is incorporated, without regard to its conflict of law principles.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <section className="text-center mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Questions About These Terms?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you have any questions about these Terms of Service or need clarification,
            please contact our IT or legal department.
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact IT Support</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Internal Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}