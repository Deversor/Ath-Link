import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { signupSchema, type SignupFormValues, ROLES, SPORTS_LIST } from '../lib/schemas/signupSchema';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  // Watch the role field so the Sport dropdown can appear/disappear live
  const selectedRole = watch('role');

  const onSubmit = async (values: SignupFormValues) => {
    const { success } = await signUp({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      role: values.role,
      sport: values.sport,
    });

    if (success) {
      if (values.role === 'student') {
        navigate('/profile-setup', {
          state: {
            fullName: values.fullName,
            email: values.email,
            sport: values.sport,
          },
        });
      } else if (values.role === 'coach') {
        navigate('/coach-profile-setup', {
          state: {
            fullName: values.fullName,
            email: values.email,
            sport: values.sport,
          },
        });
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Create Account</h1>
            <p className="text-neutral-500 text-sm mt-1">Sign up to access the sports portal</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="mb-1.5 block">
                Full Name
              </Label>
              <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="mb-1.5 block">
                Email
              </Label>
              <Input id="email" type="email" placeholder="you@psu.edu" {...register('email')} />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="mb-1.5 block">
                Password
              </Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role" className="mb-1.5 block">
                Role
              </Label>
              <select
                id="role"
                defaultValue=""
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors"
                {...register('role')}
              >
                <option value="" disabled>
                  Select your role
                </option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
            </div>

            {/* Sport dropdown only shows up when Student Athlete is selected */}
            {(selectedRole === 'student' || selectedRole === 'coach') && (
              <div>
                <Label htmlFor="sport" className="mb-1.5 block">
                  {selectedRole === 'coach' ? 'Sport You Manage' : 'Sport'}
                </Label>
                <select
                  id="sport"
                  defaultValue=""
                  className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors"
                  {...register('sport')}
                >
                  <option value="" disabled>
                    Select your sport
                  </option>
                  {SPORTS_LIST.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                {errors.sport && (
                  <p className="mt-1 text-xs text-red-600">{errors.sport.message}</p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-600 font-medium hover:text-orange-700">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}