import React from 'react';
import { Metadata } from 'next';
import SEOHead from '@/components/SEOHead';

export const metadata: Metadata = {
  title: 'Refund Policy | AI video generation service',
  description: 'Refund Policy for AI video generation service - Learn about our case-by-case refund policy for unused credits and service terms.',
  keywords: 'refund policy, money back guarantee, AI video generation service refund, unused credits refund, customer service',
  alternates: {
    canonical: 'https://saro2.ai/refund',
  },
  openGraph: {
    title: 'Refund Policy | AI video generation service',
    description: 'Refund Policy for AI video generation service - Learn about our case-by-case refund policy for unused credits and service terms.',
    url: 'https://saro2.ai/refund',
    siteName: 'Saro 2',
    images: [
      {
        url: 'https://saro2.ai/logo.png',
        width: 1200,
        height: 630,
        alt: 'Refund Policy',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Refund Policy | AI video generation service',
    description: 'Refund Policy for AI video generation service - Learn about our case-by-case refund policy for unused credits and service terms.',
    images: ['https://saro2.ai/logo.png']
  },
};

const RefundPolicy: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Refund Policy | AI video generation service"
        description="Refund Policy for AI video generation service - Learn about our case-by-case refund policy for unused credits and service terms."
        keywords="refund policy, money back guarantee, AI video generation service refund, unused credits refund, customer service"
        canonical="https://saro2.ai/refund"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="text-primary">Refund Policy</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Overview</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    At our AI video generation platform, we are committed to delivering outstanding video creation services. 
                    We recognize that certain situations may necessitate a refund request. 
                    Our refund guidelines are structured to be equitable and clear, while safeguarding 
                    the interests of both our customers and our business.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    <strong>Each refund request receives individual consideration.</strong> 
                    We maintain the authority to approve or reject refund requests depending on 
                    the particular facts and our evaluation of each case.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For more information about our services, please visit our <a href="/" className="text-primary hover:underline">homepage</a>, 
                    check out our <a href="/faq" className="text-primary hover:underline">FAQ</a>, or review our 
                    <a href="/terms" className="text-primary hover:underline"> Terms of Service</a> and 
                    <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Refund Eligibility</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">2.1 Eligible for Refund</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Refund consideration may be given under these conditions:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Unused Credits:</strong> Credits that remain unused for video creation</li>
                    <li><strong>Technical Issues:</strong> Platform malfunctions or technical difficulties that block video generation</li>
                    <li><strong>Service Downtime:</strong> Prolonged periods when the service is inaccessible</li>
                    <li><strong>Duplicate Purchases:</strong> Unintentional duplicate credit acquisitions</li>
                    <li><strong>Billing Errors:</strong> Erroneous charges resulting from system mistakes</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">2.2 Timeframe</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Refund applications must be filed within <strong>30 days</strong> from the date of purchase. 
                    Applications received beyond this timeframe will not be entertained.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Non-Refundable Items</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The following items are <strong>ineligible</strong> for refunds:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Used Credits:</strong> Credits that have been expended on video creation</li>
                    <li><strong>Generated Videos:</strong> Videos that have been successfully produced and retrieved</li>
                    <li><strong>Service Fees:</strong> Processing charges, transaction costs, or administrative fees</li>
                    <li><strong>Subscription Fees:</strong> Recurring monthly or yearly subscription payments (where applicable)</li>
                    <li><strong>Change of Mind:</strong> Refunds requested due to dissatisfaction with video output or content quality</li>
                    <li><strong>Violation of Terms:</strong> Accounts closed for breaches of our Terms of Service</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Refund Process</h2>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">4.1 How to Request a Refund</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    To submit a refund request, please adhere to these steps:
                  </p>
                  <ol className="list-decimal pl-6 text-gray-700 mb-4">
                    <li>Reach out to our support department at <strong>support@saro2.ai</strong></li>
                    <li>Provide your account email address and transaction/payment information</li>
                    <li>Submit a comprehensive explanation for your refund request</li>
                    <li>Attach any pertinent screenshots or supporting documents</li>
                    <li>Indicate the quantity of unused credits (where applicable)</li>
                  </ol>

                  <h3 className="text-xl font-semibold mb-3 text-gray-800">4. Review Process</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Upon receipt of your refund application:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>We will examine your request within <strong>2-3 business days</strong></li>
                    <li>We may seek supplementary information or clarification</li>
                    <li>We will communicate our decision through email</li>
                    <li>If approved, refund processing will occur within <strong>5-10 business days</strong></li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Refund Methods</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Authorized refunds will be issued through the identical payment method utilized for the initial transaction:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Credit Card:</strong> Funds returned to the original card (appearance may require 1-2 billing cycles)</li>
                    <li><strong>PayPal:</strong> Funds returned to your PayPal account</li>
                    <li><strong>Other Payment Methods:</strong> Handled in accordance with the payment provider's regulations</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    <strong>Note:</strong> We are unable to process refunds to a payment method different from the one used during purchase.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Account Credits</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    In certain situations, we may provide account credits usable for upcoming video creation projects instead of monetary refunds. 
                    These credits will be deposited into your account and are available for use whenever you need them.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Account credits cannot be transferred to other accounts and are not exchangeable for cash or subject to refund.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Dispute Resolution</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Should you contest our refund determination, you have the option to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Seek reconsideration by our management team</li>
                    <li>Submit further documentation or supporting evidence</li>
                    <li>Initiate a charge dispute through your payment provider (if applicable)</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We are dedicated to resolving disagreements equitably and will collaborate with you to reach an acceptable resolution.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Fraud Prevention</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We retain the authority to examine refund applications for possible fraudulent activity or misuse. 
                    This examination may involve:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Confirming account activity and user behavior patterns</li>
                    <li>Identifying duplicate or suspicious refund applications</li>
                    <li>Analyzing payment records and transaction histories</li>
                    <li>Contacting payment processors for validation</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Refund requests determined to be fraudulent may lead to account closure and potential legal proceedings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Changes to This Policy</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Refund Policy may be amended periodically. We will inform users of material modifications 
                    through email notifications or service announcements. Revised policies take effect immediately upon publication.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Continued utilization of our service following policy updates indicates your acceptance of the revised terms.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Contact Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For refund applications or inquiries regarding this policy, please reach out to us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Refund Requests:</strong> support@saro2.ai</p>
                    <p className="text-gray-700 mb-2"><strong>General Inquiries:</strong> team@saro2.ai</p>
                    <p className="text-gray-700 mb-2"><strong>Team:</strong> Saro2 team</p>
                    <p className="text-gray-700 mb-2"><strong>Address:</strong> 123 Victoria Street, London, SW1E 6QX, United Kingdom</p>
                    <p className="text-gray-700 mb-2"><strong>Subject Line:</strong> "Refund Request - [Your Account Email]"</p>
                    <p className="text-gray-700 mb-2"><strong>Response Time:</strong> Within 2-3 business days</p>
                    <p className="text-gray-700">We will respond to your inquiry as quickly as possible.</p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    For more information, visit our <a href="/" className="text-primary hover:underline">homepage</a>, 
                    <a href="/faq" className="text-primary hover:underline"> FAQ</a>, 
                    <a href="/terms" className="text-primary hover:underline"> Terms of Service</a>, or 
                    <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Legal Disclaimer</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Refund Policy constitutes an integral component of our Terms of Service and is subject to the same legal framework and jurisdiction. 
                    No provision within this policy should be interpreted as establishing legal obligations for refund provision exceeding 
                    those mandated by relevant consumer protection legislation.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    In legal jurisdictions where consumer protection statutes mandate refund entitlements, those rights 
                    continue to apply fully and are not constrained by this policy.
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

export default RefundPolicy;
