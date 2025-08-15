import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, Crown, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTestAccounts } from '@/hooks/useTestAccounts';
import { createTestAccounts } from '@/utils/setupTestAccounts';
import { CaptchaWrapper } from '@/components/auth/CaptchaWrapper';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

const AuthModal = ({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) => {
  console.log('🔐 AuthModal render:', { isOpen, initialTab }); // Debug log
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const { signIn, signUp } = useAuth();
  const { loginAsAdmin, loginAsMember } = useTestAccounts();
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const { toast } = useToast();
  useEffect(() => { setTab(initialTab); }, [initialTab, isOpen]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast({ title: 'Captcha required', description: 'Please complete the captcha verification.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        toast({ title: 'Login failed', description: error.message || 'Please try again.', variant: 'destructive' });
      } else {
        handleClose();
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      toast({ title: 'Unexpected error', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please confirm your password.', variant: 'destructive' });
      return;
    }
    
    if (password.length < 6) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        console.error('Signup error:', error);
        toast({ title: 'Sign up failed', description: error.message || 'Please try again.', variant: 'destructive' });
      } else {
        toast({ title: 'Account created successfully!', description: 'Please check your email to confirm your account.' });
        handleClose();
      }
    } catch (err: any) {
      console.error('Unexpected signup error:', err);
      toast({ title: 'Unexpected error', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (type: 'admin' | 'member') => {
    setIsLoading(true);
    const result = type === 'admin' ? await loginAsAdmin() : await loginAsMember();
    if (!result.error) {
      handleClose(); // This will now properly close the modal
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50 max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-manga-red">
            Welcome Back
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm">
            Sign in to access your reading progress and bookmarks
          </p>
        </DialogHeader>

        {/* Quick Test Login Section */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-center text-muted-foreground">Quick Test Login</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
              className="w-full border-manga-red/30 hover:bg-manga-red/10"
            >
              <Crown className="h-4 w-4 mr-2 text-manga-red" />
              Login as Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickLogin('member')}
              disabled={isLoading}
              className="w-full border-primary/30 hover:bg-primary/10"
            >
              <UserCheck className="h-4 w-4 mr-2 text-primary" />
              Login as Member
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
            <Separator className="flex-1" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <CaptchaWrapper onVerify={setCaptchaToken} action="login" />
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-accent hover:opacity-90 h-11" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-accent hover:opacity-90 h-11" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;