import { useState } from 'react';
import { Flag, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface ReportIssueButtonProps {
  chapterId: string;
  pageNumber?: number;
}

export const ReportIssueButton = ({ chapterId, pageNumber }: ReportIssueButtonProps) => {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!issueType || !description.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Select an issue type and provide a description",
        variant: "destructive",
      });
      return;
    }

    // Store report locally (in real app would send to backend)
    const report = {
      chapterId,
      pageNumber,
      issueType,
      description,
      timestamp: new Date().toISOString(),
    };
    
    const reports = JSON.parse(localStorage.getItem('manga_reports') || '[]');
    reports.push(report);
    localStorage.setItem('manga_reports', JSON.stringify(reports));

    toast({
      title: "Report submitted",
      description: "Thank you for helping us improve the reading experience",
    });

    setOpen(false);
    setIssueType('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
          <span className="ml-2">Report Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Chapter Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Issue Type</Label>
            <RadioGroup value={issueType} onValueChange={setIssueType} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="image-quality" id="image-quality" />
                <Label htmlFor="image-quality">Image Quality Issues</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missing-pages" id="missing-pages" />
                <Label htmlFor="missing-pages">Missing Pages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wrong-order" id="wrong-order" />
                <Label htmlFor="wrong-order">Pages in Wrong Order</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="translation" id="translation" />
                <Label htmlFor="translation">Translation Issues</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>

          {pageNumber && (
            <div className="text-sm text-muted-foreground">
              Reporting issue on page {pageNumber}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Submit Report
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};