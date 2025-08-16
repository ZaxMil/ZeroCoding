import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { User, Shield, Users, Edit, Upload, Search } from 'lucide-react';

export const AuthDemo = () => {
  const { user, userProfile, signOut } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Authentication Status
          </CardTitle>
          <CardDescription>
            Current authentication state and user information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Authenticated
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Role:</span>
                <Badge variant="secondary">
                  {userProfile?.role || 'Loading...'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Display Name:</span>
                <span className="text-sm text-muted-foreground">
                  {userProfile?.display_name || userProfile?.username || 'Not set'}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="w-full mt-4"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Not Authenticated
              </Badge>
              <p className="text-sm text-muted-foreground">
                You need to sign in to access protected features
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protected Content Examples</CardTitle>
          <CardDescription>
            These sections demonstrate role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member-only content */}
          <AuthGuard>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                <Users className="h-4 w-4" />
                Member Content
              </div>
              <p className="text-sm text-blue-600">
                This content is visible to all authenticated users.
              </p>
            </div>
          </AuthGuard>

          {/* Admin-only content */}
          <AuthGuard requireRole="admin">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <Shield className="h-4 w-4" />
                Admin Only
              </div>
              <p className="text-sm text-red-600">
                This content is only visible to administrators.
              </p>
            </div>
          </AuthGuard>

          {/* Author-only content */}
          <AuthGuard requireRole="author">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
                <Edit className="h-4 w-4" />
                Author Dashboard
              </div>
              <p className="text-sm text-purple-600">
                Author-specific tools and content management.
              </p>
            </div>
          </AuthGuard>

          {/* Uploader-only content */}
          <AuthGuard requireRole="uploader">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                <Upload className="h-4 w-4" />
                Content Upload
              </div>
              <p className="text-sm text-green-600">
                Upload and manage manga content.
              </p>
            </div>
          </AuthGuard>

          {/* SEO Manager-only content */}
          <AuthGuard requireRole="seo_manager">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                <Search className="h-4 w-4" />
                SEO Management
              </div>
              <p className="text-sm text-yellow-600">
                SEO optimization tools and analytics.
              </p>
            </div>
          </AuthGuard>
        </CardContent>
      </Card>
    </div>
  );
};