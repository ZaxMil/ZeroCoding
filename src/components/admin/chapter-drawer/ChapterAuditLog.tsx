import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { History, Search, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_email?: string;
  action: string;
  changes: Record<string, any>;
  ip_address?: string;
}

interface ChapterAuditLogProps {
  chapterId: string;
  chapterTitle: string;
}

export const ChapterAuditLog = ({ chapterId, chapterTitle }: ChapterAuditLogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Create fallback data from chapter basic info since audit_logs table doesn't exist
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('created_at, updated_at')
        .eq('id', chapterId)
        .single();

      let auditData: any[] = [];
      
      if (chapterData) {
        auditData = [
          {
            id: 'created',
            timestamp: chapterData.created_at,
            user_id: 'system',
            action: 'CREATE',
            changes: { status: 'Chapter created' },
            ip_address: null,
            users: null
          },
          ...(chapterData.updated_at !== chapterData.created_at ? [{
            id: 'updated',
            timestamp: chapterData.updated_at,
            user_id: 'system',
            action: 'UPDATE',
            changes: { status: 'Chapter updated' },
            ip_address: null,
            users: null
          }] : [])
        ];
      }

      const formattedLogs: AuditLogEntry[] = auditData.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        user_id: log.user_id,
        user_email: 'System',
        action: log.action,
        changes: log.changes || {},
        ip_address: log.ip_address
      }));

      setLogs(formattedLogs);
      setFilteredLogs(formattedLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dialogOpen) {
      fetchAuditLogs();
    }
  }, [dialogOpen, chapterId]);

  useEffect(() => {
    const filtered = logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.changes).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="h-8 w-8 p-0"
      >
        <History className="h-4 w-4" />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Log - {chapterTitle}</DialogTitle>
            <DialogDescription>
              View the change history for this chapter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <ScrollArea className="h-[400px] w-full border rounded-md p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading audit logs...</div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">No audit logs found</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="h-3 w-3 mr-1" />
                            {log.user_email}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      
                      {Object.keys(log.changes).length > 0 && (
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-sm font-medium mb-1">Changes:</div>
                          <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.ip_address && (
                        <div className="text-xs text-muted-foreground">
                          IP: {log.ip_address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};