// Real-time Admin Form Validation Component
import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react';
import { AdminSecurityValidator, SecurityThreatLevel, ADMIN_VALIDATION_SCHEMAS } from '@/utils/security/AdminSecurityValidator';
import { cn } from '@/lib/utils';

interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  securityLevel: SecurityThreatLevel;
  threats: string[];
}

interface AdminFormValidatorProps {
  formType: keyof typeof ADMIN_VALIDATION_SCHEMAS;
  data: Record<string, any>;
  userRole?: string;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  showSecurityStatus?: boolean;
  className?: string;
}

export const AdminFormValidator: React.FC<AdminFormValidatorProps> = ({
  formType,
  data,
  userRole,
  onValidationChange,
  showSecurityStatus = true,
  className
}) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: {},
    warnings: [],
    securityLevel: SecurityThreatLevel.NONE,
    threats: []
  });

  const validateData = useCallback(() => {
    const result = AdminSecurityValidator.validateAdminForm(formType, data, userRole);
    
    const newState: ValidationState = {
      isValid: result.isValid && !result.securityAssessment.blocked,
      errors: result.errors,
      warnings: result.securityAssessment.threats.length > 0 ? [`Security warnings: ${result.securityAssessment.threats.join(', ')}`] : [],
      securityLevel: result.securityAssessment.level,
      threats: result.securityAssessment.threats
    };
    
    setValidationState(newState);
    onValidationChange?.(newState.isValid, newState.errors);
  }, [formType, data, userRole, onValidationChange]);

  useEffect(() => {
    validateData();
  }, [validateData]);

  const getSecurityBadgeVariant = (level: SecurityThreatLevel) => {
    switch (level) {
      case SecurityThreatLevel.NONE: return 'outline';
      case SecurityThreatLevel.LOW: return 'secondary';
      case SecurityThreatLevel.MEDIUM: return 'default';
      case SecurityThreatLevel.HIGH: return 'destructive';
      case SecurityThreatLevel.CRITICAL: return 'destructive';
      default: return 'outline';
    }
  };

  const getSecurityIcon = (level: SecurityThreatLevel) => {
    switch (level) {
      case SecurityThreatLevel.NONE: return <CheckCircle className="h-4 w-4" />;
      case SecurityThreatLevel.LOW: return <AlertTriangle className="h-4 w-4" />;
      case SecurityThreatLevel.MEDIUM: return <AlertTriangle className="h-4 w-4" />;
      case SecurityThreatLevel.HIGH: return <XCircle className="h-4 w-4" />;
      case SecurityThreatLevel.CRITICAL: return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (!showSecurityStatus && validationState.isValid && Object.keys(validationState.errors).length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Field-specific errors */}
      {Object.entries(validationState.errors).map(([field, error]) => (
        field !== '_security' && (
          <Alert key={field} variant="destructive" className="py-2">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <span className="font-medium capitalize">{field.replace('_', ' ')}:</span> {error}
            </AlertDescription>
          </Alert>
        )
      ))}

      {/* Security status */}
      {showSecurityStatus && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-1">
            {getSecurityIcon(validationState.securityLevel)}
            <span className="text-sm font-medium">Security:</span>
          </div>
          <Badge variant={getSecurityBadgeVariant(validationState.securityLevel)}>
            {validationState.securityLevel.toUpperCase()}
          </Badge>
          {validationState.threats.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({validationState.threats.length} warning{validationState.threats.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}

      {/* Security errors */}
      {validationState.errors._security && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {validationState.errors._security}
          </AlertDescription>
        </Alert>
      )}

      {/* Security warnings */}
      {validationState.warnings.map((warning, index) => (
        <Alert key={index} variant="default" className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            {warning}
          </AlertDescription>
        </Alert>
      ))}

      {/* Overall validation status */}
      <div className="flex items-center gap-2 text-sm">
        {validationState.isValid ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Form validation passed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Form validation failed</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Field-level validation component
interface FieldValidatorProps {
  field: string;
  value: any;
  rule: any;
  showIcon?: boolean;
  className?: string;
}

export const FieldValidator: React.FC<FieldValidatorProps> = ({
  field,
  value,
  rule,
  showIcon = true,
  className
}) => {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    sanitizedValue?: any;
  }>({ isValid: true });

  useEffect(() => {
    const result = AdminSecurityValidator.validateField(value, rule);
    setValidationResult(result);
  }, [value, rule]);

  if (validationResult.isValid && !validationResult.error) {
    return showIcon ? (
      <div className={cn("flex items-center gap-1", className)}>
        <CheckCircle className="h-3 w-3 text-green-500" />
      </div>
    ) : null;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showIcon && <XCircle className="h-3 w-3 text-red-500" />}
      {validationResult.error && (
        <span className="text-xs text-red-600">{validationResult.error}</span>
      )}
    </div>
  );
};

// Bulk operation confirmation component
interface BulkOperationValidatorProps {
  operation: 'delete' | 'ban' | 'role_change';
  targetIds: string[];
  userRole: string;
  additionalData?: Record<string, any>;
  onValidationChange?: (isValid: boolean, errors: string[], warnings: string[]) => void;
}

export const BulkOperationValidator: React.FC<BulkOperationValidatorProps> = ({
  operation,
  targetIds,
  userRole,
  additionalData,
  onValidationChange
}) => {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });

  useEffect(() => {
    const result = AdminSecurityValidator.validateBulkOperation(operation, targetIds, userRole, additionalData);
    setValidation(result);
    onValidationChange?.(result.isValid, result.errors, result.warnings);
  }, [operation, targetIds, userRole, additionalData, onValidationChange]);

  if (validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {validation.errors.map((error, index) => (
        <Alert key={`error-${index}`} variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ))}
      
      {validation.warnings.map((warning, index) => (
        <Alert key={`warning-${index}`} variant="default" className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};