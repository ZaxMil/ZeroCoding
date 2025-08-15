import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Zap, RefreshCw, Search, BookOpen, Trash2 } from 'lucide-react';
import { QuickDataResetPanel } from './QuickDataResetPanel';
import { CuratedReset10x10 } from './CuratedReset10x10';
import { ComprehensiveDataResetButton } from './ComprehensiveDataResetButton';
import { PlaceholderDetector } from './PlaceholderDetector';
import { MangaDataSeeder } from './MangaDataSeeder';
import { Phase6CleanupButton } from './Phase6CleanupButton';

export const DataResetPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Reset
        </CardTitle>
        <CardDescription>
          Consolidated tools to clean, detect placeholders, and seed test/production data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Warning: Many of these actions delete existing data. Proceed with caution.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Quick
            </TabsTrigger>
            <TabsTrigger value="curated" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Curated
            </TabsTrigger>
            <TabsTrigger value="comprehensive" className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Comprehensive
            </TabsTrigger>
            <TabsTrigger value="placeholder" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Placeholder Detector
            </TabsTrigger>
            <TabsTrigger value="seeder" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Manga Seeder
            </TabsTrigger>
            <TabsTrigger value="phase6" className="flex items-center gap-1">
              <Trash2 className="h-3 w-3" />
              Phase 6
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="mt-4">
            <QuickDataResetPanel />
          </TabsContent>

          <TabsContent value="curated" className="mt-4">
            <CuratedReset10x10 />
          </TabsContent>

          <TabsContent value="comprehensive" className="mt-4">
            <ComprehensiveDataResetButton />
          </TabsContent>

          <TabsContent value="placeholder" className="mt-4">
            <PlaceholderDetector />
          </TabsContent>

          <TabsContent value="seeder" className="mt-4">
            <MangaDataSeeder />
          </TabsContent>

          <TabsContent value="phase6" className="mt-4">
            <Phase6CleanupButton />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
