import StaffAdminPortalLayout from '../../components/layout/StaffAdminPortalLayout';
import { CoachManagementContent } from '../shared/CoachManagementContent';

export default function StaffAdminCoachManagementPage() {
  return (
    <StaffAdminPortalLayout>
      <CoachManagementContent />
    </StaffAdminPortalLayout>
  );
}