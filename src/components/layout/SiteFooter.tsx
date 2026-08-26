import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="bg-neutral-950 text-neutral-300 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <p className="font-semibold text-white mb-2">PalawanSU AthLink</p>
          <p className="text-neutral-400">
            Empowering student athletes to achieve excellence in sports and academics.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Quick Links</p>
          <ul className="space-y-1">
            <li>
              <Link to="/login" className="hover:text-orange-500">
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" className="hover:text-orange-500">
                Sign Up
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Contact</p>
          <ul className="space-y-1 text-neutral-400">
            <li>Email: sports@psu.edu</li>
            <li>Phone: (555) 123-4567</li>
            <li>Office Hours: Mon–Fri 8AM–5PM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-800 text-center text-xs text-neutral-500 py-4">
        © 2026 PalawanSU AthLink. All rights reserved.
      </div>
    </footer>
  );
}
