import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Settings, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ApiError, resetPassword } from '../lib/api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <Settings className="h-12 w-12 text-primary" strokeWidth={2} />
            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary" />
          </div>
          <span className="text-2xl font-semibold text-foreground">Garage AI</span>
        </Link>

        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <p className="text-sm text-muted-foreground">
              {done ? 'Your password has been updated' : 'Choose a new password for your account'}
            </p>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-destructive">
                  This reset link is missing its token. Please request a new one.
                </p>
                <Link to="/forgot-password">
                  <Button className="w-full rounded-lg gap-2" size="lg">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Forgot Password
                  </Button>
                </Link>
              </div>
            ) : done ? (
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  You can now log in with your new password.
                </p>
                <Button className="w-full rounded-lg gap-2" size="lg" onClick={() => navigate('/login')}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Create a new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-lg"
                  />
                </div>

                <Button type="submit" className="w-full rounded-lg gap-2" size="lg" disabled={isSubmitting}>
                  <KeyRound className="h-4 w-4" />
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
