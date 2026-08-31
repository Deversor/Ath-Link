import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { User as UserIcon, Trophy } from 'lucide-react';
import { profileSchema, type ProfileFormValues } from '../lib/schemas/profileSchema';
import { useSports } from '../hooks/useSports';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
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

export default function ProfileSetupPage() {
  const sports = useSports();
  const navigate = useNavigate();
  const location = useLocation();
  const handoff = (location.state ?? {}) as HandoffState;
  const { user } = useAuthStore();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: handoff.fullName ?? '',
      email: handoff.email ?? '',
      sport: handoff.sport ?? '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setSaveError(null);

    if (!user) {
      setSaveError('Your session expired. Please sign in again.');
      navigate('/login');
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: values.fullName,
      student_id: values.studentId,
      email: values.email,
      sport: values.sport,
      year_level: values.yearLevel,
      course: values.course,
      age: values.age,
      position: values.position || null,
      hometown: values.hometown || null,
      emergency_contact_name: values.emergencyContactName,
      emergency_contact_phone: values.emergencyContactPhone,
      bio: values.bio || null,
    });

    if (error) {
      setSaveError(error.message);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Complete Your Profile</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Set up your athlete profile to get started
            </p>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center mb-2">
              <UserIcon className="w-8 h-8 text-neutral-400" />
            </div>
            <button
              type="button"
              className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-600 hover:bg-neutral-50"
            >
              Upload Photo (Optional)
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="mb-1.5 block">
                  Full Name *
                </Label>
                <Input id="fullName" {...register('fullName')} />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="studentId" className="mb-1.5 block">
                  Student ID *
                </Label>
                <Input id="studentId" {...register('studentId')} />
                {errors.studentId && (
                  <p className="mt-1 text-xs text-red-600">{errors.studentId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="mb-1.5 block">
                  Email *
                </Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="sport" className="mb-1.5 block">
                  Sport *
                </Label>
                <select
                  id="sport"
                  defaultValue={handoff.sport ?? ''}
                  className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors"
                  {...register('sport')}
                >
                  <option value="" disabled>
                    Select your sport
                  </option>
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                {errors.sport && (
                  <p className="mt-1 text-xs text-red-600">{errors.sport.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="yearLevel" className="mb-1.5 block">
                  Year Level *
                </Label>
                <Input id="yearLevel" placeholder="e.g., 1st Year" {...register('yearLevel')} />
                {errors.yearLevel && (
                  <p className="mt-1 text-xs text-red-600">{errors.yearLevel.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="course" className="mb-1.5 block">
                  Course *
                </Label>
                <Input id="course" placeholder="e.g., BS Computer Science" {...register('course')} />
                {errors.course && (
                  <p className="mt-1 text-xs text-red-600">{errors.course.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="age" className="mb-1.5 block">
                  Age *
                </Label>
                <Input
                  id="age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                />
                {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age.message}</p>}
              </div>
              <div>
                <Label htmlFor="position" className="mb-1.5 block">
                  Position
                </Label>
                <Input id="position" placeholder="e.g., Forward, Point Guard" {...register('position')} />
              </div>

              <div>
                <Label htmlFor="hometown" className="mb-1.5 block">
                  Hometown
                </Label>
                <Input id="hometown" placeholder="City, Province" {...register('hometown')} />
              </div>
              <div />

              <div>
                <Label htmlFor="emergencyContactName" className="mb-1.5 block">
                  Emergency Contact Name *
                </Label>
                <Input id="emergencyContactName" {...register('emergencyContactName')} />
                {errors.emergencyContactName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.emergencyContactName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone" className="mb-1.5 block">
                  Emergency Contact Phone *
                </Label>
                <Input id="emergencyContactPhone" {...register('emergencyContactPhone')} />
                {errors.emergencyContactPhone && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.emergencyContactPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="mb-1.5 block">
                Bio (Optional)
              </Label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Tell us about yourself, your athletic background, and your goals..."
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors resize-none"
                {...register('bio')}
              />
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