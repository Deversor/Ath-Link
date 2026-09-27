import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { User, Phone, LogOut, ArrowLeft, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const facilityRequesterSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
});

type FacilityRequesterSettingsValues = z.infer<typeof facilityRequesterSettingsSchema>;

export default function FacilityRequesterProfileSettingsPage() {
  const navigate = useNavigate();
  const { profile, user, updateProfile, signOut, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FacilityRequesterSettingsValues>({ resolver: zodResolver(facilityRequesterSettingsSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name ?? profile.full_name?.split(' ')[0] ?? '',
        lastName: profile.last_name ?? profile.full_name?.split(' ').slice(1).join(' ') ?? '',
        phoneNumber: profile.phone_number ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: FacilityRequesterSettingsValues) => {
    await updateProfile({
      first_name: values.firstName,
      last_name: values.lastName,
      full_name: `${values.firstName} ${values.lastName}`.trim(),
      phone_number: values.phoneNumber || null,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-950 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">
            PalawanSU <span className="text-orange-500">AthLink</span>
          </span>
        </div>
        <div className="text-right leading-tight hidden sm:block">
          <p className="text-sm font-medium">{profile?.full_name ?? user?.email}</p>
          <p className="text-xs text-neutral-400">Facility Requester</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link
          to="/facility-reservation"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Facility Booking
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900">Profile & Settings</h1>
        <p className="text-sm text-neutral-500 mb-6">Manage your personal information and account settings</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
              <User className="w-4 h-4 text-orange-500" />
              Personal Information
            </h2>
            <p className="text-sm text-neutral-500 mb-4">Update your basic account details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </section>

          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
              <Phone className="w-4 h-4 text-orange-500" />
              Contact Details
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Used so the Sports Office can reach you about your reservations
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 block">
                  Email
                </Label>
                <Input id="email" type="email" value={user?.email ?? ''} disabled />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="mb-1.5 block">
                  Contact Number
                </Label>
                <Input id="phoneNumber" placeholder="+63 912 345 6789" {...register('phoneNumber')} />
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {isSubmitSuccessful && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              Profile updated.
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            >
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>

        <section className="bg-white border border-neutral-200 rounded-xl p-6 mt-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Account Actions</h2>
          <p className="text-sm text-neutral-500 mb-4">Logout or manage your session</p>
          <Button type="button" onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </section>
      </main>
    </div>
  );
}
