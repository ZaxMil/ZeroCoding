// Centralized Admin Dashboard Security Validator
import { SecurityValidator, VALIDATION_PATTERNS, ValidationRule } from './validation';

// Admin-specific validation patterns
export const ADMIN_VALIDATION_PATTERNS = {
  ...VALIDATION_PATTERNS,
  moderationNote: /^[\w\s\.\,\!\?\-\(\)\'\"]{1,1000}$/,
  banReason: /^[\w\s\.\,\!\?\-\(\)\'\"]{1,500}$/,
  seriesTitle: /^[\w\s\.\,\!\?\-\(\)\'\"]{1,200}$/,
  chapterTitle: /^[\w\s\.\,\!\?\-\(\)\'\"]{1,200}$/,
  metaTitle: /^[\w\s\.\,\!\?\-\(\)\'\"]{1,60}$/,
  metaDescription: /^[\w\s\.\,\!\?\-\(\)\'\"]{1,160}$/,
  rolePermission: /^(admin|author|editor|member|user)$/,
  statusValue: /^(ongoing|completed|hiatus|cancelled|active|inactive|published|draft)$/,
} as const;

// Admin validation schemas
export const ADMIN_VALIDATION_SCHEMAS = {
  // Series Management
  seriesForm: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 200,
      pattern: ADMIN_VALIDATION_PATTERNS.seriesTitle,
      sanitize: true
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 2000,
      sanitize: true,
      allowedTags: ['p', 'br', 'strong', 'em'] as string[]
    },
    author: {
      required: true,
      minLength: 1,
      maxLength: 100,
      pattern: ADMIN_VALIDATION_PATTERNS.safeText,
      sanitize: true
    },
    artist: {
      maxLength: 100,
      pattern: ADMIN_VALIDATION_PATTERNS.safeText,
      sanitize: true
    },
    status: {
      required: true,
      pattern: ADMIN_VALIDATION_PATTERNS.statusValue
    },
    publication_date: {
      pattern: /^\d{4}-\d{2}-\d{2}$/
    },
    meta_title: {
      maxLength: 60,
      pattern: ADMIN_VALIDATION_PATTERNS.metaTitle,
      sanitize: true
    },
    meta_description: {
      maxLength: 160,
      pattern: ADMIN_VALIDATION_PATTERNS.metaDescription,
      sanitize: true
    },
    meta_keywords: {
      maxLength: 200,
      sanitize: true
    },
    age_rating: {
      required: true,
      pattern: /^(E|T|M|A)$/
    },
    language: {
      required: true,
      pattern: /^[a-z]{2}$/
    }
  },

  // Chapter Management
  chapterForm: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 200,
      pattern: ADMIN_VALIDATION_PATTERNS.chapterTitle,
      sanitize: true
    },
    chapter_number: {
      required: true,
      pattern: /^\d+$/
    },
    release_date: {
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    },
    meta_title: {
      maxLength: 60,
      pattern: ADMIN_VALIDATION_PATTERNS.metaTitle,
      sanitize: true
    },
    meta_description: {
      maxLength: 160,
      pattern: ADMIN_VALIDATION_PATTERNS.metaDescription,
      sanitize: true
    },
    notes_admin: {
      maxLength: 1000,
      pattern: ADMIN_VALIDATION_PATTERNS.moderationNote,
      sanitize: true
    }
  },

  // User Management
  userForm: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: VALIDATION_PATTERNS.username,
      sanitize: true
    },
    email: {
      required: true,
      pattern: VALIDATION_PATTERNS.email,
      sanitize: true
    },
    role: {
      required: true,
      pattern: ADMIN_VALIDATION_PATTERNS.rolePermission
    }
  },

  // Content Moderation
  moderationForm: {
    moderation_note: {
      required: true,
      minLength: 5,
      maxLength: 1000,
      pattern: ADMIN_VALIDATION_PATTERNS.moderationNote,
      sanitize: true
    },
    ban_reason: {
      required: true,
      minLength: 5,
      maxLength: 500,
      pattern: ADMIN_VALIDATION_PATTERNS.banReason,
      sanitize: true
    },
    warning_message: {
      required: true,
      minLength: 10,
      maxLength: 500,
      pattern: ADMIN_VALIDATION_PATTERNS.moderationNote,
      sanitize: true
    }
  },

  // File Upload
  fileUpload: {
    filename: {
      required: true,
      pattern: /^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|gif)$/i,
      maxLength: 255
    },
    filesize: {
      required: true,
      pattern: /^\d+$/
    }
  }
} as const;

// Security threat levels
export enum SecurityThreatLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityAssessment {
  level: SecurityThreatLevel;
  threats: string[];
  score: number;
  blocked: boolean;
}

// Enhanced Admin Security Validator
export class AdminSecurityValidator extends SecurityValidator {
  
  // Role-based validation
  static validateRolePermission(currentUserRole: string, targetRole: string): boolean {
    const roleHierarchy = {
      'admin': 5,
      'author': 4,
      'editor': 3,
      'member': 2,
      'user': 1
    };
    
    const currentLevel = roleHierarchy[currentUserRole as keyof typeof roleHierarchy] || 0;
    const targetLevel = roleHierarchy[targetRole as keyof typeof roleHierarchy] || 0;
    
    // Users can only assign roles equal to or lower than their own
    return currentLevel >= targetLevel;
  }

  // Enhanced file validation
  static validateImageFile(file: File): { isValid: boolean; error?: string; threats?: string[] } {
    const threats: string[] = [];
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      threats.push('Invalid file type');
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      threats.push('File too large');
    }
    
    // Check file name for suspicious patterns
    const fileName = file.name.toLowerCase();
    const suspiciousPatterns = [
      /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.sh$/i,
      /\.htaccess$/i, /\.htpasswd$/i, /\.config$/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
      threats.push('Suspicious file extension');
    }
    
    // Check for double extensions
    if ((fileName.match(/\./g) || []).length > 1) {
      threats.push('Multiple file extensions detected');
    }
    
    return {
      isValid: threats.length === 0,
      error: threats.length > 0 ? threats.join(', ') : undefined,
      threats
    };
  }

  // Comprehensive security assessment
  static assessSecurityLevel(input: string): SecurityAssessment {
    let score = 0;
    const threats: string[] = [];
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi
    ];
    
    xssPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        score += 30;
        threats.push('XSS Attack Pattern');
      }
    });
    
    // Check for SQL injection
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\'|\"|;|--|\||\*)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /(\bunion\b.*\bselect\b)/i,
      /(\bdrop\b.*\btable\b)/i
    ];
    
    sqlPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        score += 25;
        threats.push('SQL Injection Pattern');
      }
    });
    
    // Check for command injection
    if (/[;&|`$(){}[\]\\]/.test(input)) {
      score += 20;
      threats.push('Command Injection Pattern');
    }
    
    // Check for path traversal
    if (input.includes('../') || input.includes('..\\')) {
      score += 15;
      threats.push('Path Traversal Pattern');
    }
    
    // Check for LDAP injection
    if (/[()=*!&|]/.test(input) && input.length > 20) {
      score += 10;
      threats.push('LDAP Injection Pattern');
    }
    
    // Check for suspicious encodings
    if (/%[0-9a-f]{2}/gi.test(input)) {
      score += 5;
      threats.push('URL Encoding Detected');
    }
    
    // Determine security level
    let level: SecurityThreatLevel;
    if (score >= 50) level = SecurityThreatLevel.CRITICAL;
    else if (score >= 30) level = SecurityThreatLevel.HIGH;
    else if (score >= 15) level = SecurityThreatLevel.MEDIUM;
    else if (score > 0) level = SecurityThreatLevel.LOW;
    else level = SecurityThreatLevel.NONE;
    
    return {
      level,
      threats: Array.from(new Set(threats)),
      score,
      blocked: level === SecurityThreatLevel.CRITICAL || level === SecurityThreatLevel.HIGH
    };
  }

  // Validate admin form with enhanced security
  static validateAdminForm(
    formType: keyof typeof ADMIN_VALIDATION_SCHEMAS,
    data: Record<string, any>,
    userRole?: string
  ): {
    isValid: boolean;
    errors: Record<string, string>;
    sanitizedData: Record<string, any>;
    securityAssessment: SecurityAssessment;
  } {
    const schema = ADMIN_VALIDATION_SCHEMAS[formType];
    const result = this.validateObject(data, schema);
    
    // Perform security assessment on all string values
    let overallThreatLevel = SecurityThreatLevel.NONE;
    let overallScore = 0;
    const allThreats: string[] = [];
    
    Object.values(data).forEach(value => {
      if (typeof value === 'string') {
        const assessment = this.assessSecurityLevel(value);
        if (assessment.score > overallScore) {
          overallThreatLevel = assessment.level;
          overallScore = assessment.score;
        }
        allThreats.push(...assessment.threats);
      }
    });
    
    // Role-based validation for user management
    if (formType === 'userForm' && userRole && data.role) {
      if (!this.validateRolePermission(userRole, data.role)) {
        result.errors.role = 'Insufficient permissions to assign this role';
        result.isValid = false;
      }
    }
    
    const securityAssessment: SecurityAssessment = {
      level: overallThreatLevel,
      threats: Array.from(new Set(allThreats)),
      score: overallScore,
      blocked: overallThreatLevel >= SecurityThreatLevel.HIGH
    };
    
    // Block if security threat is too high
    if (securityAssessment.blocked) {
      result.isValid = false;
      result.errors._security = 'Security validation failed: potential threat detected';
    }
    
    // Double-check blocking condition
    if (securityAssessment.blocked) {
      result.isValid = false;
    }

    return {
      ...result,
      securityAssessment
    };
  }

  // Validate bulk operations
  static validateBulkOperation(
    operation: 'delete' | 'ban' | 'role_change',
    targetIds: string[],
    userRole: string,
    additionalData?: Record<string, any>
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check bulk operation limits
    if (targetIds.length > 100) {
      errors.push('Bulk operation limited to 100 items maximum');
    }
    
    if (targetIds.length === 0) {
      errors.push('No items selected for bulk operation');
    }
    
    // Role-based restrictions
    const roleHierarchy = { admin: 5, author: 4, editor: 3, member: 2, user: 1 };
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    
    if (operation === 'delete' && userLevel < 4) {
      errors.push('Insufficient permissions for bulk delete operation');
    }
    
    if (operation === 'ban' && userLevel < 3) {
      errors.push('Insufficient permissions for bulk ban operation');
    }
    
    if (operation === 'role_change' && userLevel < 4) {
      errors.push('Insufficient permissions for bulk role change operation');
    }
    
    // Warnings for potentially dangerous operations
    if (operation === 'delete' && targetIds.length > 10) {
      warnings.push('Large delete operation - consider doing this in smaller batches');
    }
    
    if (operation === 'ban' && targetIds.length > 20) {
      warnings.push('Large ban operation - ensure you have reviewed all selected users');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// React hook for admin form validation
export const useAdminValidation = () => {
  return {
    validateForm: (formType: keyof typeof ADMIN_VALIDATION_SCHEMAS, data: Record<string, any>, userRole?: string) =>
      AdminSecurityValidator.validateAdminForm(formType, data, userRole),
    
    validateFile: (file: File) =>
      AdminSecurityValidator.validateImageFile(file),
    
    validateBulkOperation: (operation: 'delete' | 'ban' | 'role_change', targetIds: string[], userRole: string, additionalData?: Record<string, any>) =>
      AdminSecurityValidator.validateBulkOperation(operation, targetIds, userRole, additionalData),
    
    assessSecurity: (input: string) =>
      AdminSecurityValidator.assessSecurityLevel(input),
    
    checkRolePermission: (currentRole: string, targetRole: string) =>
      AdminSecurityValidator.validateRolePermission(currentRole, targetRole)
  };
};