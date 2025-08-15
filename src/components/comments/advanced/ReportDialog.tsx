import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ReportDialogProps {
  onSubmit: (reason: string, details?: string) => void;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({ onSubmit }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (reason) {
      onSubmit(reason, details);
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={reason} onValueChange={setReason}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="spam" id="spam" />
          <Label htmlFor="spam">Spam</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="harassment" id="harassment" />
          <Label htmlFor="harassment">Harassment</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="inappropriate" id="inappropriate" />
          <Label htmlFor="inappropriate">Inappropriate content</Label>
        </div>
      </RadioGroup>
      
      <Textarea
        placeholder="Additional details (optional)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      
      <Button onClick={handleSubmit} disabled={!reason}>
        Submit Report
      </Button>
    </div>
  );
};