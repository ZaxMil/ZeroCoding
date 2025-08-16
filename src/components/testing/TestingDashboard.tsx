import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomatedTestSuite } from './AutomatedTestSuite';
import { QualityAssurancePanel } from './QualityAssurancePanel';
import { TestMonitoring } from './TestMonitoring';
import { 
  TestTube, 
  Bug, 
  Activity, 
  Shield,
  Target,
  Zap
} from 'lucide-react';

export const TestingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Testing & Quality Assurance
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive testing suite, quality monitoring, and automated QA processes
            to ensure your manga reader application meets the highest standards.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Test Coverage</p>
                  <p className="text-3xl font-bold text-green-800">87.3%</p>
                  <p className="text-xs text-green-600">+2.1% from last week</p>
                </div>
                <TestTube className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Pass Rate</p>
                  <p className="text-3xl font-bold text-blue-800">94.2%</p>
                  <p className="text-xs text-blue-600">+1.8% improvement</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Security Score</p>
                  <p className="text-3xl font-bold text-purple-800">9.2/10</p>
                  <p className="text-xs text-purple-600">All critical checks passed</p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Performance</p>
                  <p className="text-3xl font-bold text-orange-800">98.5%</p>
                  <p className="text-xs text-orange-600">Core Web Vitals passed</p>
                </div>
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Testing Interface */}
        <Card className="border-2">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tests" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Automated Tests
                </TabsTrigger>
                <TabsTrigger value="qa" className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Quality Assurance
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Test Monitoring
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tests" className="mt-6">
                <AutomatedTestSuite />
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <QualityAssurancePanel />
              </TabsContent>

              <TabsContent value="monitoring" className="mt-6">
                <TestMonitoring />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Testing Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-green-600" />
                  Unit Testing
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Test individual components in isolation</li>
                  <li>• Aim for 90%+ code coverage</li>
                  <li>• Mock external dependencies</li>
                  <li>• Write descriptive test names</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Bug className="h-5 w-5 text-blue-600" />
                  Integration Testing
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Test component interactions</li>
                  <li>• Validate API integrations</li>
                  <li>• Test database operations</li>
                  <li>• Verify user workflows</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Security Testing
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Validate input sanitization</li>
                  <li>• Test authentication flows</li>
                  <li>• Check for XSS vulnerabilities</li>
                  <li>• Verify access controls</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};