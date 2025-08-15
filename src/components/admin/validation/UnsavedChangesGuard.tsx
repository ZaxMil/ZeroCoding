// Unsaved Changes Protection Component
import React, { useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesGuardProps {
  hasUnsavedChanges: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  saveButtonText?: string;
  discardButtonText?: string;
}

export const UnsavedChangesGuard: React.FC<UnsavedChangesGuardProps> = ({
  hasUnsavedChanges,
  onSave,
  onDiscard,
  isOpen,
  onClose,
  title = "Unsaved Changes",
  description = "You have unsaved changes that will be lost if you continue. Do you want to save your changes before leaving?",
  saveButtonText = "Save Changes",
  discardButtonText = "Discard Changes"
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          {onDiscard && (
            <Button
              variant="outline"
              onClick={() => {
                onDiscard();
                onClose();
              }}
            >
              {discardButtonText}
            </Button>
          )}
          {onSave && (
            <AlertDialogAction
              onClick={() => {
                onSave();
                onClose();
              }}
            >
              {saveButtonText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hook for managing unsaved changes
export const useUnsavedChanges = (initialData: Record<string, any>) => {
  const [originalData, setOriginalData] = React.useState(initialData);
  const [currentData, setCurrentData] = React.useState(initialData);
  const [showGuard, setShowGuard] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = React.useMemo(() => {
    return JSON.stringify(originalData) !== JSON.stringify(currentData);
  }, [originalData, currentData]);

  // Update current data
  const updateData = React.useCallback((newData: Record<string, any>) => {
    setCurrentData(newData);
  }, []);

  // Mark changes as saved
  const markAsSaved = React.useCallback((savedData?: Record<string, any>) => {
    const dataToSave = savedData || currentData;
    setOriginalData(dataToSave);
  }, [currentData]);

  // Reset to original data
  const resetChanges = React.useCallback(() => {
    setCurrentData(originalData);
  }, [originalData]);

  // Handle navigation attempt
  const handleNavigationAttempt = React.useCallback((navigationCallback: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationCallback);
      setShowGuard(true);
    } else {
      navigationCallback();
    }
  }, [hasUnsavedChanges]);

  // Handle save and navigate
  const handleSaveAndNavigate = React.useCallback((saveCallback: () => Promise<void> | void) => {
    const executeSaveAndNavigate = async () => {
      try {
        await saveCallback();
        markAsSaved();
        if (pendingNavigation) {
          pendingNavigation();
          setPendingNavigation(null);
        }
      } catch (error) {
        console.error('Failed to save changes:', error);
      }
      setShowGuard(false);
    };
    
    executeSaveAndNavigate();
  }, [pendingNavigation, markAsSaved]);

  // Handle discard and navigate
  const handleDiscardAndNavigate = React.useCallback(() => {
    resetChanges();
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowGuard(false);
  }, [pendingNavigation, resetChanges]);

  // Browser beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    currentData,
    originalData,
    updateData,
    markAsSaved,
    resetChanges,
    handleNavigationAttempt,
    handleSaveAndNavigate,
    handleDiscardAndNavigate,
    showGuard,
    setShowGuard
  };
};

// Browser navigation guard hook
export const useBrowserNavigationGuard = (hasUnsavedChanges: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);
};