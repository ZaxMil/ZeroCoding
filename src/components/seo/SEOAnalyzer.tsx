import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  TrendingUp, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Image as ImageIcon,
  Link
} from 'lucide-react';

interface SEOScore {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  improvements: string[];
}

interface SEOAnalysis {
  overallScore: number;
  scores: SEOScore[];
  pageSpeed: {
    mobile: number;
    desktop: number;
  };
  accessibility: {
    score: number;
    issues: string[];
  };
  recommendations: string[];
}

export const SEOAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(window.location.href);

  const analyzePageSEO = async () => {
    setLoading(true);
    
    // Simulate SEO analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAnalysis: SEOAnalysis = {
      overallScore: 87,
      scores: [
        {
          category: 'Content',
          score: 92,
          maxScore: 100,
          issues: [],
          improvements: ['Add more internal links', 'Optimize content length']
        },
        {
          category: 'Technical',
          score: 85,
          maxScore: 100,
          issues: ['Missing canonical tag on some pages'],
          improvements: ['Implement structured data', 'Optimize image alt tags']
        },
        {
          category: 'Performance',
          score: 78,
          maxScore: 100,
          issues: ['Large image files', 'Unused CSS'],
          improvements: ['Compress images', 'Remove unused code']
        },
        {
          category: 'Mobile',
          score: 95,
          maxScore: 100,
          issues: [],
          improvements: ['Optimize touch targets']
        }
      ],
      pageSpeed: {
        mobile: 82,
        desktop: 91
      },
      accessibility: {
        score: 88,
        issues: ['Missing alt text on 2 images', 'Low contrast on secondary text']
      },
      recommendations: [
        'Add structured data for better rich snippets',
        'Optimize Core Web Vitals for better user experience',
        'Implement lazy loading for images below the fold',
        'Add meta descriptions to all pages',
        'Improve internal linking structure'
      ]
    };
    
    setAnalysis(mockAnalysis);
    setLoading(false);
  };

  useEffect(() => {
    analyzePageSEO();
  }, []);

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Analyzing SEO...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={33} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Scanning page structure, content, and performance...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              SEO Analysis
            </span>
            <Badge variant={getScoreBadgeVariant(analysis.overallScore, 100)} className="text-lg px-3 py-1">
              {analysis.overallScore}/100
            </Badge>
          </CardTitle>
          <CardDescription>
            Analysis for: {currentUrl}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={analysis.overallScore} className="w-full h-3" />
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.scores.map((score, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                {score.category}
                <span className={`font-bold ${getScoreColor(score.score, score.maxScore)}`}>
                  {score.score}/{score.maxScore}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(score.score / score.maxScore) * 100} className="h-2" />
              
              {score.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 flex items-center gap-1 mb-2">
                    <XCircle className="h-4 w-4" />
                    Issues
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {score.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {score.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-1 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Improvements
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {score.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Page Speed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Page Speed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Mobile</span>
                <span className={`font-bold ${getScoreColor(analysis.pageSpeed.mobile, 100)}`}>
                  {analysis.pageSpeed.mobile}
                </span>
              </div>
              <Progress value={analysis.pageSpeed.mobile} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Desktop</span>
                <span className={`font-bold ${getScoreColor(analysis.pageSpeed.desktop, 100)}`}>
                  {analysis.pageSpeed.desktop}
                </span>
              </div>
              <Progress value={analysis.pageSpeed.desktop} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Accessibility Score</span>
              <span className={`font-bold ${getScoreColor(analysis.accessibility.score, 100)}`}>
                {analysis.accessibility.score}/100
              </span>
            </div>
            <Progress value={analysis.accessibility.score} className="h-2" />
            
            {analysis.accessibility.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 flex items-center gap-1 mb-2">
                  <XCircle className="h-4 w-4" />
                  Accessibility Issues
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.accessibility.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Top Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  {index + 1}
                </div>
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={analyzePageSEO} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Re-analyze
        </Button>
        <Button variant="outline">
          <Link className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
};