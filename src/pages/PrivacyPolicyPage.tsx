import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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

        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Last updated: September 2026 · Issued under Republic Act 10173, the Data Privacy Act of 2012
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">1. Who we are</h2>
            <p>
              Ath-Link is operated by the Palawan State University (PalSU) Sports Office for the purpose of managing
              athlete records, coaching operations, facility reservations, and related sports program administration.
              This policy explains what personal information we collect through the system, why we collect it, and
              how it is protected, in compliance with the Data Privacy Act of 2012.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">2. Information we collect</h2>
            <p>Depending on your role, we may collect and process:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Basic identity information — full name, email address, contact number, PalSU ID number</li>
              <li>
                Athlete-specific information — student ID, sport, position, year level, college/course, age, blood
                type, height and weight, hometown, and a short biography
              </li>
              <li>Emergency contact name and phone number</li>
              <li>
                Supporting documents you upload — medical clearance, grade sheets, parental consent forms,
                eligibility forms, and ID photos
              </li>
              <li>Coach-specific information — specialization and years of experience</li>
              <li>
                Facility reservation details — event or session information, purpose, expected attendees, and
                (where applicable) an uploaded approval letter
              </li>
              <li>Academic records entered into the GWA calculator, for athletic eligibility verification</li>
              <li>Account activity such as login times and administrative actions, for security and audit purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">3. Why we collect it</h2>
            <p>Your information is used strictly to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Verify eligibility to register as a student athlete, coach, or other authorized system user</li>
              <li>Administer athlete documentation, academic eligibility checks, and coaching assignments</li>
              <li>Process and manage facility reservation requests</li>
              <li>Contact you regarding your account, submissions, or reservations</li>
              <li>Maintain system security, including detecting unauthorized access attempts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">4. Who can see your information</h2>
            <p>
              Access to your information is limited by role. Coaches can view information for athletes under their
              own sport. Staff Admin, Registrar, and Super Admin accounts have broader access strictly for
              document verification, eligibility review, and system administration. We do not sell, rent, or share
              your personal information with any third party outside the PalSU Sports Office for commercial purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">5. How your information is protected</h2>
            <p>
              Data is stored in an access-controlled database with row-level security, meaning each account can only
              read the information its role is authorized to see. Uploaded documents are stored in private storage
              accessible only to authorized reviewers. Administrative login keys and passwords are stored in hashed
              form and are never visible to anyone, including system administrators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">6. Your rights under RA 10173</h2>
            <p>As a data subject, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Be informed that your personal data is being processed (this notice)</li>
              <li>Access your own personal data held in the system</li>
              <li>Request correction of inaccurate information via your Profile Settings</li>
              <li>Object to or request the deletion of your data, subject to any legal or administrative retention requirements of the university</li>
              <li>Lodge a complaint with the National Privacy Commission if you believe your rights have been violated</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact the PalSU Sports Office directly or reach out to your Staff
              Admin.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">7. Data retention</h2>
            <p>
              Information is retained for as long as your account remains active and for a reasonable period
              afterward as required for academic, athletic, and administrative record-keeping. Deactivated accounts
              may have their access revoked immediately while records are retained per university policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">8. Changes to this policy</h2>
            <p>
              This policy may be updated from time to time to reflect changes in the system or in applicable law.
              Continued use of Ath-Link after an update constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">9. Contact us</h2>
            <p>
              Questions or concerns about this policy or how your data is handled can be directed to the PalSU
              Sports Office.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
