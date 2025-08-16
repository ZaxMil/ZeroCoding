import { ResetScansHomepage } from '@/components/homepage/ResetScansHomepage';
import { HomepageOverride } from '@/components/themes/HomepageOverride';
import { AuthDemo } from '@/components/demo/AuthDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Home = () => {
  return (
    <div className="space-y-8">
      <HomepageOverride defaultHomepage={ResetScansHomepage} />
      
      {/* Development auth demo - remove in production */}
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Authentication System Demo</CardTitle>
                <CardDescription>
                  Test the authentication and protected routes functionality
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Dev Mode
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AuthDemo />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;