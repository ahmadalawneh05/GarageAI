import { useState } from 'react';
import { Link } from 'react-router';
import { Settings, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ApiError, forgotPassword } from '../lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <Settings className="h-12 w-12 text-primary" strokeWidth={2} />
            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary" />
          </div>
          <span className="text-2xl font-semibold text-foreground">Garage AI</span>
        </Link>

        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <p className="text-sm text-muted-foreground">
              {submitted 
                ? "Check your email for reset instructions" 
                : "Enter your email to receive a password reset code"
              }
            </p>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  We've sent a password reset code to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
                <Link to="/login">
                  <Button className="w-full rounded-lg gap-2" size="lg">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-lg gap-2"
                  size="lg"
                  disabled={isSubmitting}
                >
                  <Mail className="h-4 w-4" />
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Link to="/login">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full rounded-lg gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
