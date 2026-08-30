import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { adminSignupSchema, type AdminSignupValues, ADMIN_ROLES } from '../lib/schemas/adminSignupSchema';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSignUpPage() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminSignupValues>({ resolver: zodResolver(adminSignupSchema) });

  const onSubmit = async (values: AdminSignupValues) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (signUpError || !data.user) {
      setError('email', { message: signUpError?.message ?? 'Could not create account.' });
      return;
    }

    // The store's `user` isn't set yet since we called supabase directly
    // above instead of going through the store's own signUp action.
    useAuthStore.setState({ user: data.user });

    const { data: claimed, error: claimError } = await supabase.rpc('claim_admin_whitelist', {
      p_role: values.role,
      p_full_name: values.fullName,
    });

    if (claimError || !claimed) {
      setError('role', {
        message: 'This email isn\u2019t whitelisted for that role. Ask your Super Admin to add you first.',
      });
      await supabase.auth.signOut();
      useAuthStore.setState({ user: null });
      return;
    }

    await fetchProfile();
    navigate('/admin-verify');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Admin Account Setup</h1>
          <p className="text-neutral-500 text-sm mt-1">
            This page is only for staff who have been pre-authorized by a Super Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="mb-1.5 block">
              Full Name
            </Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="mb-1.5 block">
              Email
            </Label>
            <Input id="email" type="email" placeholder="you@psu.edu" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="mb-1.5 block">
              Password
            </Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
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
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-neutral-900 hover:bg-neutral-800"
          >
            {isSubmitting ? 'Creating account…' : 'Create Admin Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          <Link to="/login" className="text-orange-600 font-medium hover:text-orange-700">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
