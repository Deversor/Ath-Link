import StaffAdminPortalLayout from '../../components/layout/StaffAdminPortalLayout';
import { CoachSchedulesContent } from '../shared/CoachSchedulesContent';

export default function StaffAdminCoachSchedulesPage() {
  return (
    <StaffAdminPortalLayout>
      <CoachSchedulesContent />
    </StaffAdminPortalLayout>
  );
}