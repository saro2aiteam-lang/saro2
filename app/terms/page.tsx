import React from 'react';
import { Metadata } from 'next';
import SEOHead from '@/components/SEOHead';

export const metadata: Metadata = {
  title: 'Terms of Service | AI video generation service',
  description: 'Terms of Service for AI video generation service - Read our terms and conditions for using our AI video generation service.',
  keywords: 'terms of service, terms and conditions, AI video generation service, user agreement, legal terms',
  alternates: {
    canonical: 'https://saro2.ai/terms',
  },
};

const TermsOfService: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service | AI video generation service"
        description="Terms of Service for AI video generation service - Read our terms and conditions for using our AI video generation service."
        keywords="terms of service, terms and conditions, AI video generation service, user agreement, legal terms"
        canonical="https://saro2.ai/terms"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-primary">Terms of Service</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    When you access and utilize our AI video generation service (referred to as "the Service"), you acknowledge and accept 
                    that you are bound by the terms and conditions set forth in this agreement. Should you not agree with these provisions, 
                    we request that you refrain from using our service.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For more information about our services, please visit our <a href="/" className="text-primary hover:underline">homepage</a>, 
                    check out our <a href="/faq" className="text-primary hover:underline">FAQ</a>, or review our 
                    <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Description of Service</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our platform offers an AI-driven video creation solution that enables users to produce videos 
                    from textual descriptions and image inputs through cutting-edge artificial intelligence. Our offerings encompass:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Converting text descriptions into video content</li>
                    <li>Transforming static images into dynamic video sequences</li>
                    <li>Content refinement and enhancement utilities</li>
                    <li>Online storage solutions for your created videos</li>
                    <li>Programmatic interfaces for technical integration</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. User Accounts</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">3.1 Account Creation</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    To access our service, you need to establish an account by submitting truthful and comprehensive details. 
                    You bear the responsibility for keeping your account login information secure and confidential.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">3.2 Account Responsibilities</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your responsibilities include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>All actions performed through your account</li>
                    <li>Securing your password and login credentials</li>
                    <li>Promptly reporting any unauthorized access or suspicious activity</li>
                    <li>Ensuring your account information remains current and accurate</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Acceptable Use Policy</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 Permitted Uses</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our service is restricted to legitimate uses, such as:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Developing original materials for personal or business applications</li>
                    <li>Academic and investigative endeavors</li>
                    <li>Producing content for digital marketing and social platforms</li>
                    <li>Creative and artistic ventures</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">4.2 Prohibited Uses</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our service must not be used to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Produce unlawful, dangerous, or objectionable materials</li>
                    <li>Develop synthetic media or deceptive content</li>
                    <li>Infringe upon copyrights or other intellectual property</li>
                    <li>Create content advocating violence, discriminatory language, or prejudice</li>
                    <li>Generate explicit or unsuitable material</li>
                    <li>Engage in system analysis, reverse engineering, or unauthorized access attempts</li>
                    <li>Utilize the platform for any illegal activities</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Content and Intellectual Property</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 User Content</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You maintain ownership rights over all content you submit or generate through our platform. Through your use of our service, 
                    you provide us with a restricted license to handle, retain, and present your content as needed to deliver our services.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Generated Content</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Videos produced through our AI systems belong to you, in accordance with these terms. Nevertheless, 
                    you recognize that content generated by artificial intelligence might not qualify for copyright protection in certain legal jurisdictions.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">5.3 Our Intellectual Property</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our platform, encompassing its visual design, operational features, and core technology, 
                    is safeguarded by intellectual property regulations. Reproduction, modification, or distribution of our service requires explicit authorization.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Payment and Billing</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">6.1 Pricing</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our platform functions using a credit-based payment model. Rates may be adjusted with prior notification. 
                    Up-to-date pricing information is available on our website and may differ depending on usage levels and selected features.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">6.2 Payment Terms</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Credits must be purchased upfront. Unless explicitly stated otherwise, all transactions are final and non-refundable. 
                    We support major credit card providers and additional payment options as indicated on our platform.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">6.3 Refunds</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Refund decisions are made at our sole discretion and may involve processing charges. 
                    Unused credits can potentially be refunded if requested within 30 days of the original purchase date.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Service Availability</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    While we work diligently to ensure consistent platform availability, we cannot guarantee continuous, uninterrupted access. 
                    Temporary service disruptions may occur due to system maintenance, software updates, or technical complications. 
                    We are not responsible for any downtime or interruptions in service delivery.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Privacy and Data Protection</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We value your privacy. Our handling of personal information is regulated by our 
                    Privacy Policy, which forms an integral part of these Terms through reference. Through your use of our service, 
                    you agree to the data collection and usage practices detailed in our Privacy Policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Limitation of Liability</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    To the fullest extent allowed by applicable law, our platform shall not be held responsible for any indirect, incidental, 
                    special, consequential, or punitive losses, including without limitation financial losses, data loss, 
                    or other non-material damages arising from your utilization of the service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Disclaimers</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The service is offered on an "as is" basis without any form of warranty. We renounce all warranties, 
                    whether expressed or implied, including without limitation warranties related to merchantability, suitability for a 
                    specific purpose, and absence of infringement.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Termination</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">11.1 Termination by You</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have the option to close your account at any time by reaching out to our support department or utilizing the account deletion functionality.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">11.2 Termination by Us</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We reserve the right to immediately terminate or suspend your account, without advance warning, for any cause, 
                    including but not limited to breaches of these Terms or engagement in unlawful activities.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">11.3 Effect of Termination</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Once termination occurs, your authorization to access the service ends immediately. We may remove your account 
                    and related data, although certain information might be preserved as legally mandated.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Governing Law</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    These Terms are subject to and interpreted according to the laws of [Jurisdiction], 
                    excluding any principles of conflict of laws. Any conflicts or disagreements stemming from these Terms will 
                    be adjudicated in the judicial courts of [Jurisdiction].
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Changes to Terms</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We retain the authority to amend these Terms whenever necessary. Users will be informed of material modifications 
                    through electronic mail or platform notifications. Ongoing use of the service after changes are implemented indicates acceptance 
                    of the revised Terms.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. Severability</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Should any section of these Terms be determined to be unenforceable or invalid, that particular provision will be 
                    restricted or removed to the least extent required, enabling the remaining Terms to continue in full legal effect.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">15. Contact Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For any questions or concerns regarding these Terms of Service, please get in touch with us at:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Email:</strong> support@saro2.ai</p>
                    <p className="text-gray-700 mb-2"><strong>Team:</strong> Saro2 team</p>
                    <p className="text-gray-700 mb-2"><strong>Address:</strong> 123 Victoria Street, London, SW1E 6QX, United Kingdom</p>
                    <p className="text-gray-700">We will respond to your inquiry within 5 business days.</p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    For more information, visit our <a href="/" className="text-primary hover:underline">homepage</a>, 
                    <a href="/faq" className="text-primary hover:underline"> FAQ</a>, or 
                    <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
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

export default TermsOfService;
