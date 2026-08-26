import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function SiteHeader() {
  return (
    <header className="bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <Link to="/" className="font-semibold">
          PalawanSU <span className="text-orange-500">AthLink</span>
        </Link>
      </div>
    </header>
  );
}
