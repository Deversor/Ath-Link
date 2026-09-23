interface PasswordStrengthMeterProps {
  password: string;
}

function scorePassword(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'bg-neutral-200' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
  return { score: 4, label: 'Strong', color: 'bg-green-500' };
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color } = scorePassword(password);

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? color : 'bg-neutral-200'}`} />
        ))}
      </div>
      <p className="text-xs text-neutral-500 mt-1">
        {label && (
          <>
            Password strength: <span className="font-medium">{label}</span>
          </>
        )}
      </p>
    </div>
  );
}
