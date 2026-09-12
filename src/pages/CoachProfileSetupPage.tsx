import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Trophy, User as UserIcon } from 'lucide-react';
import {
  coachProfileSetupSchema,
  type CoachProfileSetupValues,
} from '../lib/schemas/coachProfileSetupSchema';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';

interface HandoffState {
  fullName?: string;
  email?: string;
  sport?: string;
}

export default function CoachProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const handoff = (location.state ?? {}) as HandoffState;
  const { user, fetchProfile, isInitialized, init } = useAuthStore();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Same two entry paths as the student version: straight from sign-up
  // (handoff has everything) or via the confirmation email link (fresh
  // page load — need to establish the session first).
  useEffect(() => {
    if (!isInitialized) init();
  }, [isInitialized, init]);

  const fallbackFullName = (user?.user_metadata?.full_name as string) ?? '';
  const fallbackSport = (user?.user_metadata?.sport as string) ?? '';
  const effectiveFullName = handoff.fullName ?? fallbackFullName;
  const effectiveSport = handoff.sport ?? fallbackSport;
  const effectiveEmail = handoff.email ?? user?.email ?? '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CoachProfileSetupValues>({
    resolver: zodResolver(coachProfileSetupSchema),
    defaultValues: {
      firstName: effectiveFullName.split(' ')[0] ?? '',
      lastName: effectiveFullName.split(' ').slice(1).join(' ') ?? '',
    },
  });

  // Fill in the name once the session/metadata loads on the
  // confirmation-link path (router state won't have it that way).
  useEffect(() => {
    if (user && !handoff.fullName && fallbackFullName) {
      reset({
        firstName: fallbackFullName.split(' ')[0] ?? '',
        lastName: fallbackFullName.split(' ').slice(1).join(' ') ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (values: CoachProfileSetupValues) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSaveError(null);

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: values.firstName,
      last_name: values.lastName,
      full_name: `${values.firstName} ${values.lastName}`.trim(),
      phone_number: values.phoneNumber,
      specialization: values.specialization,
      years_experience: values.yearsExperience,
      sport: effectiveSport || null,
      role: 'coach',
      email: effectiveEmail,
    });

    if (upsertError) {
      setSaveError(upsertError.message);
      return;
    }

    // Session is now guaranteed real — safe to mark the whitelist entry
    // used and log the account creation.
    if (effectiveEmail && effectiveSport) {
      await supabase.rpc('mark_coach_whitelist_used', {
        p_email: effectiveEmail,
        p_sport: effectiveSport,
      });
    }
    await supabase.rpc('log_activity', {
      p_action_type: 'user_created',
      p_entity_type: 'user',
      p_description: `Created new coach account for ${effectiveEmail} (${effectiveSport})`,
    });

    await fetchProfile();
    navigate('/coach/dashboard');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm">
        Verifying your account…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Complete Your Coach Profile</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Set up your coaching profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="mb-1.5 block">
                  First Name
                </Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-1.5 block">
                  Last Name
                </Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="mb-1.5 block">
                Contact Number
              </Label>
              <Input id="phoneNumber" placeholder="+63 912 345 6789" {...register('phoneNumber')} />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="specialization" className="mb-1.5 block">
                Specialization
              </Label>
              <Input
                id="specialization"
                placeholder="e.g., Basketball, Volleyball, Swimming"
                {...register('specialization')}
              />
              {errors.specialization && (
                <p className="mt-1 text-xs text-red-600">{errors.specialization.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="yearsExperience" className="mb-1.5 block">
                Years of Experience
              </Label>
              <Input
                id="yearsExperience"
                type="number"
                {...register('yearsExperience', { valueAsNumber: true })}
              />
              {errors.yearsExperience && (
                <p className="mt-1 text-xs text-red-600">{errors.yearsExperience.message}</p>
              )}
            </div>

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving…' : 'Complete Profile Setup'}
            </Button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}