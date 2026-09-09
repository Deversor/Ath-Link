import { useState } from 'react';
import { ClipboardList, Plus, Trash2, Calculator, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import RegistrarPortalLayout from '../../components/layout/RegistrarPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubjectRow {
  id: string;
  name: string;
  grade: string;
  units: string;
}

const PASSING_MAX = 3.0;

function emptyRow(): SubjectRow {
  return { id: crypto.randomUUID(), name: '', grade: '', units: '' };
}

export default function RegistrarGwaCalculatorPage() {
  const { user } = useAuthStore();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [graduatingStatus, setGraduatingStatus] = useState('Not Graduating');
  const [rows, setRows] = useState<SubjectRow[]>([emptyRow()]);
  const [result, setResult] = useState<{
    gwa: number;
    totalUnits: number;
    passRate: number;
    eligible: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateRow = (id: string, field: keyof SubjectRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const resetCalculator = () => {
    setStudentName('');
    setStudentId('');
    setYearLevel('1st Year');
    setGraduatingStatus('Not Graduating');
    setRows([emptyRow()]);
    setResult(null);
    setError(null);
  };

  const handleCalculate = async () => {
    setError(null);
    const validRows = rows.filter((r) => r.name && r.grade && r.units);

    if (!studentName || validRows.length === 0) {
      setError('Enter a student name and at least one subject with grade and units.');
      return;
    }

    let weightedSum = 0;
    let totalUnits = 0;
    let passingCount = 0;

    for (const row of validRows) {
      const grade = parseFloat(row.grade);
      const units = parseFloat(row.units);
      if (isNaN(grade) || isNaN(units)) {
        setError(`Invalid grade or units for "${row.name}".`);
        return;
      }
      weightedSum += grade * units;
      totalUnits += units;
      if (grade <= PASSING_MAX) passingCount += 1;
    }

    const gwa = Math.round((weightedSum / totalUnits) * 100) / 100;
    const passRate = Math.round((passingCount / validRows.length) * 1000) / 10;
    const eligible = gwa <= PASSING_MAX && passingCount === validRows.length;

    setResult({ gwa, totalUnits, passRate, eligible });

    setIsSaving(true);

    let matchedProfileId: string | null = null;
    if (studentId) {
      const { data: match } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();
      matchedProfileId = match?.id ?? null;
    }

    await supabase.from('gwa_records').insert({
      profile_id: matchedProfileId,
      student_name: studentName,
      student_id_text: studentId || null,
      year_level: yearLevel,
      is_graduating: graduatingStatus === 'Graduating',
      gwa,
      total_units: totalUnits,
      pass_rate: passRate,
      eligibility_met: eligible,
      subjects: validRows.map((r) => ({ name: r.name, grade: r.grade, units: r.units })),
      calculated_by: user?.id,
    });
    setIsSaving(false);
  };

  return (
    <RegistrarPortalLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            GWA Calculator & Eligibility Checker
          </h1>
          <p className="text-sm text-neutral-500">Calculate GWA and check athletic eligibility for any student</p>
        </div>
        <Button type="button" variant="outline" onClick={resetCalculator}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset Calculator
        </Button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">Student Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div>
            <Label htmlFor="studentName" className="mb-1.5 block">
              Student Name
            </Label>
            <Input id="studentName" placeholder="Enter student name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="studentId" className="mb-1.5 block">
              Student ID
            </Label>
            <Input id="studentId" placeholder="e.g., 2024-0011" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="yearLevel" className="mb-1.5 block">
              Year Level
            </Label>
            <select
              id="yearLevel"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
            >
              {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="graduatingStatus" className="mb-1.5 block">
              Graduating Status
            </Label>
            <select
              id="graduatingStatus"
              value={graduatingStatus}
              onChange={(e) => setGraduatingStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
            >
              <option>Not Graduating</option>
              <option>Graduating</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-900">Grade Entry</h2>
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Subject
          </Button>
        </div>

        <div className="grid grid-cols-[1fr_100px_80px_90px_36px] gap-2 text-xs font-medium text-neutral-500 mb-2 px-1">
          <span>Subject Name</span>
          <span>Grade</span>
          <span>Units</span>
          <span>Status</span>
          <span />
        </div>

        <div className="space-y-2 mb-4">
          {rows.map((row) => {
            const gradeNum = parseFloat(row.grade);
            const status = row.grade === '' ? null : gradeNum <= PASSING_MAX ? 'Passing' : 'Failing';
            return (
              <div key={row.id} className="grid grid-cols-[1fr_100px_80px_90px_36px] gap-2 items-center">
                <Input placeholder="e.g., Mathematics 101" value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} />
                <Input placeholder="1.0-5.0" value={row.grade} onChange={(e) => updateRow(row.id, 'grade', e.target.value)} />
                <Input placeholder="Units" value={row.units} onChange={(e) => updateRow(row.id, 'units', e.target.value)} />
                <span
                  className={`text-xs font-medium text-center rounded-full px-2 py-1 ${
                    status === 'Passing'
                      ? 'bg-green-100 text-green-700'
                      : status === 'Failing'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {status ?? '—'}
                </span>
                <button type="button" onClick={() => removeRow(row.id)} className="text-neutral-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <Button type="button" className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleCalculate} disabled={isSaving}>
          <Calculator className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving…' : 'Calculate GWA & Check Eligibility'}
        </Button>
      </div>

      {result && (
        <div className={`rounded-xl border p-6 ${result.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.eligible ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <h2 className="font-semibold text-neutral-900">
              {result.eligible ? 'Eligible for Athletics' : 'Not Eligible'}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{result.gwa.toFixed(2)}</p>
              <p className="text-xs text-neutral-500">GWA</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{result.totalUnits}</p>
              <p className="text-xs text-neutral-500">Total Units</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{result.passRate}%</p>
              <p className="text-xs text-neutral-500">Pass Rate</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-3 text-center">
            Eligibility rule: GWA of {PASSING_MAX.toFixed(1)} or better, with no failing subjects. This has been saved to Verification History.
          </p>
        </div>
      )}
    </RegistrarPortalLayout>
  );
}
