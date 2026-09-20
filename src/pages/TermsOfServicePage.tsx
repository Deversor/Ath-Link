import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-neutral-950 text-white px-6 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold">
          PalawanSU <span className="text-orange-500">AthLink</span>
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-8">Last updated: September 2026</p>

        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">1. Acceptance of terms</h2>
            <p>
              By creating an account or using Ath-Link, you agree to these Terms of Service and to our{' '}
              <Link to="/privacy-policy" className="text-orange-600 underline hover:text-orange-700">
                Privacy Policy
              </Link>
              . If you do not agree, please do not use the system.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">2. Eligibility and account registration</h2>
            <p>
              Student Athlete and Coach accounts require prior authorization from the PalSU Sports Office before
              registration is possible. Staff Admin, Registrar, and Super Admin accounts are created only through
              internal authorization and require a valid institutional login key. Facility Requester accounts are
              open to any verified PalSU community member with an official university email address.
            </p>
            <p className="mt-2">
              You must provide accurate, current, and complete information when registering, and keep it up to date.
              You are responsible for maintaining the confidentiality of your password and login credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">3. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use the system for any purpose other than legitimate PalSU sports administration or facility booking</li>
              <li>Attempt to access accounts, data, or portals you are not authorized to access</li>
              <li>Submit false information in any document, form, or reservation request</li>
              <li>Interfere with or attempt to disrupt the normal operation of the system</li>
              <li>Share your account credentials with another person</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">4. Document submissions and eligibility review</h2>
            <p>
              Athletes are responsible for the accuracy of documents they upload. Submitted documents pass through a
              review pipeline (Coach, Staff Admin, and Registrar) and may be sent back for revision. Academic
              eligibility determinations made through the system are based on the information submitted and do not
              override official university academic records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">5. Facility reservations</h2>
            <p>By submitting a facility reservation request, you agree that:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Reservations are not confirmed until they pass full review and, where applicable, an uploaded approval letter is accepted</li>
              <li>Cancellations must be made at least 24 hours in advance where reasonably possible</li>
              <li>You will comply with the specific rules and operating hours of the facility you reserve</li>
              <li>The Sports Office may reject or cancel a reservation for legitimate administrative, safety, or scheduling reasons</li>
              <li>Facility use is provided free of charge for university-affiliated purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">6. Account suspension and termination</h2>
            <p>
              The Sports Office may deactivate any account found to violate these terms, submit fraudulent
              information, or misuse the system. During system-wide maintenance, access may be temporarily restricted
              for all non-administrative accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">7. Limitation of liability</h2>
            <p>
              Ath-Link is provided as an administrative tool for the PalSU Sports Office. While reasonable care is
              taken to keep the system accurate and available, the Sports Office is not liable for losses arising
              from system downtime, data entry errors, or reliance on information within the system in place of
              official university records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">8. Changes to these terms</h2>
            <p>
              These terms may be updated periodically. Continued use of Ath-Link after changes take effect
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">9. Contact us</h2>
            <p>Questions about these terms can be directed to the PalSU Sports Office.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
