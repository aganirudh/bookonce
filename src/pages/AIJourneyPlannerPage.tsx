import React from 'react';
import Navbar from '@/components/Navbar';
import AIJourneyPlanner from '@/components/AIJourneyPlanner';

const AIJourneyPlannerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar onSafetyClick={() => undefined} isOffline={false} />
      <div className="pt-20">
        <AIJourneyPlanner />
      </div>
    </div>
  );
};

export default AIJourneyPlannerPage;
