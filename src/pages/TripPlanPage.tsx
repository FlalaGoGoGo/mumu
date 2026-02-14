import { useParams } from 'react-router-dom';
import { MyVisitsList } from '@/components/plan/MyVisitsList';
import { VisitEditor } from '@/components/plan/VisitEditor';
import { VisitResults } from '@/components/plan/VisitResults';

/**
 * /plan              → My Visits list
 * /plan/:visitId     → Visit Results (generated plan)
 * /plan/:visitId/edit → Visit Editor
 */
export default function TripPlanPage() {
  // Routing is handled by App.tsx with separate routes
  // This component is kept for the /plan index route
  return <MyVisitsList />;
}
