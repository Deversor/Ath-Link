import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Activity, GraduationCap, Trophy, LogOut, ArrowLeft } from 'lucide-react';
import {
  profileSettingsSchema,
  type ProfileSettingsValues,
} from '../../lib/schemas/profileSettingsSchema';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { profile, user, updateProfile, signOut, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
  });

  // Fill the form once the profile has loaded
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name ?? profile.full_name?.split(' ')[0] ?? '',
        lastName: profile.last_name ?? '',
        phoneNumber: profile.phone_number ?? '',
        emergencyContact: profile.emergency_contact_name ?? '',
        age: profile.age ?? undefined,
        bloodType: profile.blood_type ?? '',
        heightCm: profile.height_cm ?? undefined,
        weightKg: profile.weight_kg ?? undefined,
        collegeDepartment: profile.college_department ?? '',
        degreeProgram: profile.course ?? '',
        yearLevel: profile.year_level ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileSettingsValues) => {
    await updateProfile({
      first_name: values.firstName,
      last_name: values.lastName,
      full_name: `${values.firstName} ${values.lastName}`.trim(),
      phone_number: values.phoneNumber,
      emergency_contact_name: values.emergencyContact,
      age: values.age,
      blood_type: values.bloodType || null,
      height_cm: values.heightCm ?? null,
      weight_kg: values.weightKg ?? null,
      college_department: values.collegeDepartment,
      course: values.degreeProgram,
      year_level: values.yearLevel,
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
          <p className="text-xs text-neutral-400">Student Athlete</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900">Profile & Settings</h1>
        <p className="text-sm text-neutral-500 mb-6">Manage your personal information and account settings</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
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
              <div className="sm:col-span-2">
                <Label htmlFor="email" className="mb-1.5 block">
                  Email Address
                </Label>
                <Input id="email" type="email" value={user?.email ?? ''} disabled />
                <p className="mt-1 text-xs text-neutral-400">
                  Your login email can't be changed here.
                </p>
              </div>
            </div>
          </section>

          {/* Contact & Emergency Information */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
              <Phone className="w-4 h-4 text-orange-500" />
              Contact & Emergency Information
            </h2>
            <p className="text-sm text-neutral-500 mb-4">Contact details and emergency contacts</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber" className="mb-1.5 block">
                  Phone Number
                </Label>
                <Input id="phoneNumber" placeholder="+63 912 345 6789" {...register('phoneNumber')} />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="emergencyContact" className="mb-1.5 block">
                  Emergency Contact
                </Label>
                <Input
                  id="emergencyContact"
                  placeholder="Name and phone number"
                  {...register('emergencyContact')}
                />
                {errors.emergencyContact && (
                  <p className="mt-1 text-xs text-red-600">{errors.emergencyContact.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Physical Information */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
              <Activity className="w-4 h-4 text-orange-500" />
              Physical Information
            </h2>
            <p className="text-sm text-neutral-500 mb-4">Health and physical measurements</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="age" className="mb-1.5 block">
                  Age
                </Label>
                <Input id="age" type="number" {...register('age', { valueAsNumber: true })} />
                {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age.message}</p>}
              </div>
              <div>
                <Label htmlFor="bloodType" className="mb-1.5 block">
                  Blood Type
                </Label>
                <Input id="bloodType" placeholder="O+, A, B" {...register('bloodType')} />
              </div>
              <div>
                <Label htmlFor="heightCm" className="mb-1.5 block">
                  Height (cm)
                </Label>
                <Input id="heightCm" type="number" {...register('heightCm', { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="weightKg" className="mb-1.5 block">
                  Weight (kg)
                </Label>
                <Input id="weightKg" type="number" {...register('weightKg', { valueAsNumber: true })} />
              </div>
            </div>
          </section>

          {/* Academic Information */}
          <section className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
              <GraduationCap className="w-4 h-4 text-orange-500" />
              Academic Information
            </h2>
            <p className="text-sm text-neutral-500 mb-4">Academic and enrollment details</p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="studentId" className="mb-1.5 block">
                  Student ID
                </Label>
                <Input id="studentId" value={profile?.student_id ?? ''} disabled />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collegeDepartment" className="mb-1.5 block">
                    College/Department
                  </Label>
                  <Input id="collegeDepartment" {...register('collegeDepartment')} />
                  {errors.collegeDepartment && (
                    <p className="mt-1 text-xs text-red-600">{errors.collegeDepartment.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="degreeProgram" className="mb-1.5 block">
                    Degree Program
                  </Label>
                  <Input id="degreeProgram" {...register('degreeProgram')} />
                  {errors.degreeProgram && (
                    <p className="mt-1 text-xs text-red-600">{errors.degreeProgram.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="yearLevel" className="mb-1.5 block">
                  Year Level
                </Label>
                <Input id="yearLevel" {...register('yearLevel')} />
                {errors.yearLevel && (
                  <p className="mt-1 text-xs text-red-600">{errors.yearLevel.message}</p>
                )}
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

        {/* Account Actions */}
        <section className="bg-white border border-neutral-200 rounded-xl p-6 mt-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Account Actions</h2>
          <p className="text-sm text-neutral-500 mb-4">Logout or manage your session</p>
          <Button
            type="button"
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </section>
      </main>
    </div>
  );
}