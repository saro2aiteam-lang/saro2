import React from 'react';
import { Metadata } from 'next';
import SEOHead from '@/components/SEOHead';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI video generation service',
  description: 'Privacy Policy for AI video generation service - Learn how we collect, use, and protect your personal information.',
  keywords: 'privacy policy, data protection, AI video generation service, personal information, GDPR',
  alternates: {
    canonical: 'https://saro2.ai/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | AI video generation service',
    description: 'Privacy Policy for AI video generation service - Learn how we collect, use, and protect your personal information.',
    url: 'https://saro2.ai/privacy',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Privacy Policy',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | AI video generation service',
    description: 'Privacy Policy for AI video generation service - Learn how we collect, use, and protect your personal information.',
    images: ['https://saro2.ai/logo.png']
  },
};

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | AI video generation service"
        description="Privacy Policy for AI video generation service - Learn how we collect, use, and protect your personal information."
        keywords="privacy policy, data protection, AI video generation service, personal information, GDPR"
        canonical="https://saro2.ai/privacy"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-primary">Privacy Policy</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Thank you for using our AI video generation service (referred to as "we," "our," or "us"). This Privacy Policy outlines 
                    our practices regarding the collection, usage, sharing, and protection of your personal data when you engage with our platform. 
                    We encourage you to review this document thoroughly. Should you disagree with any aspect of this policy, 
                    we kindly ask that you refrain from using our service.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For more information about our services, please visit our <a href="/" className="text-primary hover:underline">homepage</a>, 
                    check out our <a href="/faq" className="text-primary hover:underline">FAQ</a>, or review our 
                    <a href="/terms" className="text-primary hover:underline"> Terms of Service</a>.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">2.1 Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We gather personal details that you willingly share with us during the following activities:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Creating a user account</li>
                    <li>Utilizing our video creation features</li>
                    <li>Reaching out to our customer support</li>
                    <li>Signing up for email communications</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Such data encompasses your full name, email contact details, billing information, and any additional 
                    details you decide to supply.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">2.2 Usage Data</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Certain information is automatically captured when you interact with our platform, such as:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Internet protocol addresses and device identifiers</li>
                    <li>Web browser specifications and version numbers</li>
                    <li>Navigation patterns and session duration</li>
                    <li>Content creation requests and user settings</li>
                    <li>System logs and operational metrics</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. How We Use Your Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The data we gather serves the following purposes:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Delivering, managing, and sustaining our video generation platform</li>
                    <li>Handling your content creation submissions</li>
                    <li>Enhancing and customizing your user journey</li>
                    <li>Communicating system updates and assistance notifications</li>
                    <li>Facilitating transactions and safeguarding against fraudulent activity</li>
                    <li>Meeting regulatory and legal requirements</li>
                    <li>Safeguarding our interests and preventing unauthorized use</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Information Sharing and Disclosure</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your personal data is not sold, exchanged, or transferred to external parties, with the exception of these situations:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Service Providers:</strong> Information may be shared with verified third-party partners who help us deliver our services</li>
                    <li><strong>Legal Requirements:</strong> We may release information when mandated by legislation or to defend our legal interests</li>
                    <li><strong>Business Transfers:</strong> Should a merger or acquisition occur, your data may be part of the transferred assets</li>
                    <li><strong>Consent:</strong> Information may be shared when you have given us clear authorization to do so</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Security</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We employ robust technical safeguards and organizational protocols to shield your personal data from 
                    unauthorized access, modification, exposure, or loss. That said, no internet transmission method 
                    or digital storage solution can be considered completely secure, and we cannot provide absolute security guarantees.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Data Retention</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We maintain your personal data solely for the duration needed to achieve the objectives stated in this 
                    Privacy Policy, except when extended retention is legally mandated or authorized. Created content and 
                    related information may be preserved to enhance our service offerings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Your Rights</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Based on your geographic location, you may be entitled to exercise the following rights concerning your personal data:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Request access to your personal data</li>
                    <li>Request corrections to erroneous information</li>
                    <li>Request deletion of your personal data</li>
                    <li>Request limitations on data processing</li>
                    <li>Request transferability of your data</li>
                    <li>Object to certain processing activities</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    To invoke any of these rights, please reach out to us using the contact details provided below.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Cookies and Tracking Technologies</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our platform utilizes cookies and comparable tracking mechanisms to improve your browsing experience. 
                    Cookie preferences can be managed via your web browser settings. Please note that disabling cookies 
                    may impact some features and functionality of our platform.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Third-Party Services</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our platform may connect with external service providers (including payment gateways and AI technology partners). 
                    These entities maintain independent privacy policies, which we recommend you examine. 
                    We bear no responsibility for the privacy practices implemented by these external parties.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. International Data Transfers</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your data may be transmitted and processed in jurisdictions outside your home country. 
                    We take measures to ensure these transfers adhere to relevant data protection regulations and apply 
                    suitable protective measures for your information.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Children's Privacy</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our platform is not designed for individuals under the age of 13. We do not intentionally collect 
                    personal data from minors under 13 years old. Parents or legal guardians who believe their child 
                    has submitted personal information to us should contact us immediately.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Changes to This Privacy Policy</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Privacy Policy may be revised periodically. We will inform you of updates by 
                    publishing the revised policy on this page and modifying the "Last updated" timestamp. 
                    Continued usage of our service following policy changes indicates your acceptance of the updated terms.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Should you have any inquiries regarding this Privacy Policy or our data handling practices, please reach out to us at:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Email:</strong> support@saro2.ai</p>
                    <p className="text-gray-700 mb-2"><strong>Team:</strong> Saro2 team</p>
                    <p className="text-gray-700 mb-2"><strong>Address:</strong> 123 Victoria Street, London, SW1E 6QX, United Kingdom</p>
                    <p className="text-gray-700">We will respond to your inquiry within 30 days.</p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    For more information, visit our <a href="/" className="text-primary hover:underline">homepage</a>, 
                    <a href="/faq" className="text-primary hover:underline"> FAQ</a>, or 
                    <a href="/terms" className="text-primary hover:underline"> Terms of Service</a>.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
