import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SpamRule {
  id: string;
  rule_type: 'keyword' | 'url' | 'rate_limit' | 'content_similarity';
  rule_value: string;
  severity: 'low' | 'medium' | 'high';
  action: 'flag' | 'block' | 'require_review';
  is_active: boolean;
  created_at: string;
}

interface RateLimitStatus {
  canComment: boolean;
  remainingAttempts: number;
  resetTime?: Date;
  lastComment?: Date;
}

interface SpamDetectionResult {
  isSpam: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
  action: 'allow' | 'flag' | 'block' | 'require_review';
}

const BLOCKED_KEYWORDS = [
  'spam', 'fake', 'scam', 'phishing', 'viagra', 'cialis',
  'casino', 'lottery', 'winner', 'congratulations',
  'click here', 'free money', 'earn money fast'
];

const BLOCKED_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /suspicious-domain\.com/i,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
];

export const useSpamPrevention = () => {
  const { user } = useAuth();
  const [spamRules, setSpamRules] = useState<SpamRule[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({
    canComment: true,
    remainingAttempts: 10
  });
  const [userReputation, setUserReputation] = useState(100);
  const [loading, setLoading] = useState(true);

  // Rate limiting configuration
  const RATE_LIMITS = {
    guest: { maxComments: 3, windowMinutes: 60 },
    user: { maxComments: 10, windowMinutes: 60 },
    trusted: { maxComments: 50, windowMinutes: 60 },
    admin: { maxComments: 1000, windowMinutes: 60 }
  };

  useEffect(() => {
    if (user) {
      checkRateLimit();
      fetchUserReputation();
    } else {
      checkGuestRateLimit();
    }
    fetchSpamRules();
  }, [user]);

  const fetchSpamRules = async () => {
    try {
      // Mock spam rules since the table doesn't exist yet
      const mockRules: SpamRule[] = [
        {
          id: '1',
          rule_type: 'keyword',
          rule_value: 'spam',
          severity: 'high',
          action: 'block',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          rule_type: 'url',
          rule_value: 'bit.ly',
          severity: 'medium',
          action: 'flag',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      
      setSpamRules(mockRules);
    } catch (error) {
      console.error('Error fetching spam rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRateLimit = async () => {
    if (!user) return;

    try {
      // Mock rate limit check since we don't have the advanced tables
      const userRole = user.app_metadata?.role || 'user';
      const limits = RATE_LIMITS[userRole as keyof typeof RATE_LIMITS] || RATE_LIMITS.user;

      // Simulate checking recent comments
      const totalComments = 2; // Mock data
      const remainingAttempts = Math.max(0, limits.maxComments - totalComments);

      setRateLimitStatus({
        canComment: remainingAttempts > 0,
        remainingAttempts,
        resetTime: new Date(Date.now() + limits.windowMinutes * 60 * 1000),
        lastComment: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      });
    } catch (error) {
      console.error('Error checking rate limit:', error);
    }
  };

  const checkGuestRateLimit = () => {
    const guestComments = JSON.parse(localStorage.getItem('guestComments') || '[]');
    const windowStart = Date.now() - (RATE_LIMITS.guest.windowMinutes * 60 * 1000);
    
    const recentComments = guestComments.filter((timestamp: number) => timestamp > windowStart);
    const remainingAttempts = Math.max(0, RATE_LIMITS.guest.maxComments - recentComments.length);

    setRateLimitStatus({
      canComment: remainingAttempts > 0,
      remainingAttempts,
      resetTime: new Date(windowStart + (RATE_LIMITS.guest.windowMinutes * 60 * 1000)),
      lastComment: recentComments.length > 0 ? new Date(Math.max(...recentComments)) : undefined
    });
  };

  const fetchUserReputation = async () => {
    if (!user) return;

    try {
      // Mock user reputation since the table doesn't exist yet
      setUserReputation(85); // Mock reputation score
    } catch (error) {
      console.error('Error fetching user reputation:', error);
    }
  };

  const analyzeContent = useCallback((content: string): SpamDetectionResult => {
    const reasons: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let action: 'allow' | 'flag' | 'block' | 'require_review' = 'allow';

    // Check for blocked keywords
    const lowerContent = content.toLowerCase();
    const foundKeywords = BLOCKED_KEYWORDS.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      reasons.push(`Contains blocked keywords: ${foundKeywords.join(', ')}`);
      severity = 'medium';
      action = 'flag';
    }

    // Check for suspicious URLs
    const urlMatches = BLOCKED_URL_PATTERNS.some(pattern => pattern.test(content));
    if (urlMatches) {
      reasons.push('Contains suspicious URLs');
      severity = 'high';
      action = 'block';
    }

    // Check content length (too short might be spam)
    if (content.trim().length < 10) {
      reasons.push('Content too short');
      severity = 'low';
      action = 'flag';
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 20) {
      reasons.push('Excessive use of capital letters');
      severity = 'medium';
      action = 'flag';
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) {
      reasons.push('Contains excessive repeated characters');
      severity = 'low';
      action = 'flag';
    }

    // Check against custom spam rules
    spamRules.forEach(rule => {
      if (rule.rule_type === 'keyword' && lowerContent.includes(rule.rule_value.toLowerCase())) {
        reasons.push(`Matches spam rule: ${rule.rule_value}`);
        severity = rule.severity;
        action = rule.action;
      }
    });

    // User reputation factor
    if (userReputation < 50) {
      action = 'require_review';
      reasons.push('User has low reputation score');
    }

    return {
      isSpam: reasons.length > 0,
      reasons,
      severity,
      action
    };
  }, [spamRules, userReputation]);

  const trackGuestComment = () => {
    const guestComments = JSON.parse(localStorage.getItem('guestComments') || '[]');
    guestComments.push(Date.now());
    
    // Keep only recent comments
    const windowStart = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    const recentComments = guestComments.filter((timestamp: number) => timestamp > windowStart);
    
    localStorage.setItem('guestComments', JSON.stringify(recentComments));
  };

  const checkCanComment = useCallback((content: string): { 
    canComment: boolean; 
    reason?: string; 
    analysis: SpamDetectionResult 
  } => {
    // Check rate limit
    if (!rateLimitStatus.canComment) {
      return {
        canComment: false,
        reason: `Rate limit exceeded. You can comment again in ${Math.ceil((rateLimitStatus.resetTime!.getTime() - Date.now()) / 60000)} minutes.`,
        analysis: { isSpam: false, reasons: [], severity: 'low', action: 'allow' }
      };
    }

    // Analyze content for spam
    const analysis = analyzeContent(content);

    if (analysis.action === 'block') {
      return {
        canComment: false,
        reason: `Comment blocked: ${analysis.reasons.join(', ')}`,
        analysis
      };
    }

    return {
      canComment: true,
      analysis
    };
  }, [rateLimitStatus, analyzeContent]);

  const reportSpam = async (commentId: string, reason: string) => {
    try {
      // Mock spam reporting since the table doesn't exist yet
      console.log('Spam reported:', { commentId, reason });
      toast.success('Comment reported successfully');
    } catch (error) {
      console.error('Error reporting spam:', error);
      toast.error('Failed to report comment');
    }
  };

  const addSpamRule = async (rule: Omit<SpamRule, 'id' | 'created_at'>) => {
    try {
      // Mock adding spam rule
      const newRule: SpamRule = {
        ...rule,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      
      setSpamRules(prev => [...prev, newRule]);
      toast.success('Spam rule added successfully');
    } catch (error) {
      console.error('Error adding spam rule:', error);
      toast.error('Failed to add spam rule');
    }
  };

  const removeSpamRule = async (ruleId: string) => {
    try {
      setSpamRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success('Spam rule removed successfully');
    } catch (error) {
      console.error('Error removing spam rule:', error);
      toast.error('Failed to remove spam rule');
    }
  };

  // Temporary ban system
  const applyTemporaryBan = async (userId: string, reason: string, durationHours: number = 24) => {
    try {
      // Mock temporary ban
      console.log('Temporary ban applied:', { userId, reason, durationHours });
      toast.success(`User temporarily banned for ${durationHours} hours`);
    } catch (error) {
      console.error('Error applying temporary ban:', error);
      toast.error('Failed to apply temporary ban');
    }
  };

  const checkTemporaryBan = async (userId: string): Promise<boolean> => {
    try {
      // Mock checking temporary ban
      return false; // No ban in demo
    } catch (error) {
      console.error('Error checking temporary ban:', error);
      return false;
    }
  };

  return {
    loading,
    rateLimitStatus,
    userReputation,
    spamRules,
    checkCanComment,
    analyzeContent,
    reportSpam,
    addSpamRule,
    removeSpamRule,
    applyTemporaryBan,
    checkTemporaryBan,
    trackGuestComment,
    checkRateLimit: user ? checkRateLimit : checkGuestRateLimit
  };
};
