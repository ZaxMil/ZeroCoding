import React from 'react';
import { UserProfile } from '@/components/profile/UserProfile';

const Profile: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserProfile />
    </div>
  );
};

export default Profile;