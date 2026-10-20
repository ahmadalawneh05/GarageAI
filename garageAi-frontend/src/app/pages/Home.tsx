import { useRef, useState } from 'react';
import { Mic, Upload, Send, Loader2, FileAudio, X, MessageCircle, AlertTriangle, AlertCircle, Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ProbabilityBreakdown } from '../components/ProbabilityBreakdown';
import { SeverityFormDialog } from '../components/SeverityFormDialog';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useAudioAnalysis } from '../context/AudioAnalysisContext';
import { formatLabel } from '../lib/format';
import { confidenceBadgeClass, isUncertain } from '../lib/confidence';
import type { SeverityFormCategory } from '../lib/severityForm';

const SEVERITY_FORM_CATEGORIES: readonly string[] = ['belt', 'brake', 'sway'];

function isSeverityFormCategory(value: string): value is SeverityFormCategory {
  return SEVERITY_FORM_CATEGORIES.includes(value);
}

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModelBreakdown, setShowModelBreakdown] = useState(false);
  const {
    audioLabel,
    isRecording,
    isAnalyzing,
    result,
    error,
    hasAudio,
    audioLevel,
    silenceWarning,
    extraModel,
    setExtraModel,
    resetSelection,
    selectFile,
    toggleRecording,
    analyze,
  } = useAudioAnalysis();

  const [isSeverityFormOpen, setIsSeverityFormOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    selectFile(file);
  };

  const askAboutResult = () => {
    if (!result) return;
    const seedMessage = `طلع معي من تحليل الصوت إنه في احتمال "${formatLabel(result.final_prediction)}" (نسبة ثقة ${Math.round(
      result.final_confidence * 100
    )}%). شو ممكن يكون السبب وشو الحل المناسب؟`;
    // Pass the classifier's own result along structurally too -- the seed message above
    // is prose ABOUT the result, not a symptom description, so it can't be relied on
    // alone to ground the chat on the right fault category.
    navigate('/chat', {
      state: {
        seedMessage,
        audioResult: { predicted_class: result.final_prediction, confidence: result.final_confidence },
      },
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Background Wave Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="#3B82F6"
            d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      <div className="w-full max-w-3xl mx-auto relative z-10">
        {/* Result Area */}
        <div className="mb-8 min-h-[400px] flex items-center justify-center">
          {isAnalyzing ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Analyzing the sound with GarageAI...</p>
              <p className="text-xs text-muted-foreground">
                You can browse other pages while this finishes -- we'll keep the result waiting for you here.
              </p>
            </div>
          ) : result ? (
            <Card className="w-full shadow-lg border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    {result.final_prediction === 'other' ? (
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                        <h3 className="text-xl">Not a Recognized Fault Sound</h3>
                      </div>
                    ) : isUncertain(result.final_confidence) ? (
                      <div className="flex items-center gap-2 mb-2 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="text-xl">No Clear Match</h3>
                      </div>
                    ) : (
                      <h3 className="text-xl mb-2">{formatLabel(result.final_prediction)}</h3>
                    )}
                    <Badge className={`${confidenceBadgeClass(result.final_confidence)} border`}>
                      {Math.round(result.final_confidence * 100)}% Confidence
                    </Badge>
                  </div>
                </div>

                {result.final_prediction === 'other' ? (
                  <p className="text-sm text-muted-foreground">
                    This doesn't sound like belt, brake, or sway -- the three fault types GarageAI
                    recognizes. Try recording the actual car sound you're concerned about.
                  </p>
                ) : isUncertain(result.final_confidence) && (
                  <p className="text-sm text-muted-foreground">
                    We couldn't find a confident match for this sound. The closest guess was{' '}
                    <span className="font-medium text-foreground">{formatLabel(result.final_prediction)}</span>, but
                    the confidence is too low to treat as a diagnosis -- try recording a longer, clearer sample.
                  </p>
                )}

                <ProbabilityBreakdown
                  allProbabilities={result.all_probabilities}
                  predictedClass={result.final_prediction}
                />

                {result.individual_models.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      onClick={() => setShowModelBreakdown((v) => !v)}
                    >
                      {showModelBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      See other models' results
                    </Button>
                    {showModelBreakdown && (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs text-muted-foreground">
                          The final prediction is generated by our trained ensemble, combining Traditional ML, CNN, and YAMNet. Below are the individual models' predictions for comparison.
                        </p>
                        {result.individual_models.map((model) => (
                          <div key={model.model_name} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{formatLabel(model.model_name)}</span>
                            <span className="flex items-center gap-2">
                              <span>{formatLabel(model.predicted_class)}</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(model.confidence * 100)}%
                              </Badge>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Processed in {Math.round(result.processing_time_ms)} ms
                </p>

                <div className="flex items-center justify-between gap-3 pt-2 border-t">
                  {user ? (
                    <p className="text-xs text-muted-foreground">
                      Saved to your <Link to="/history" className="text-primary hover:underline">history</Link>.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      <Link to="/login" className="text-primary hover:underline">Log in</Link> to save this analysis to your history.
                    </p>
                  )}
                  <div className="flex gap-2">
                    {isSeverityFormCategory(result.final_prediction) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0 rounded-lg"
                        onClick={() => setIsSeverityFormOpen(true)}
                      >
                        <Gauge className="h-3.5 w-3.5" />
                        Assess Severity
                      </Button>
                    )}
                    {result.final_prediction !== 'other' && (
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0 rounded-lg" onClick={askAboutResult}>
                        <MessageCircle className="h-3.5 w-3.5" />
                        Ask GarageAI about this
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h2 className="text-2xl">Analyze Your Vehicle Sounds</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Record or upload an audio file of your vehicle's sound, and our AI will diagnose potential issues.
              </p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <Card className="shadow-xl border-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              {audioLabel && (
                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-muted text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileAudio className="h-4 w-4" />
                    {audioLabel}
                  </span>
                  <button onClick={resetSelection} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {error && (
                <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              {silenceWarning && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {silenceWarning}
                </div>
              )}

              {isRecording && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground text-center">Recording level</p>
                  <Progress value={Math.min(100, audioLevel * 300)} className="h-2" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.oga,.opus,.flac,.webm,.wma,.3gp,.3gpp,.amr,.aiff,.aif"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm text-muted-foreground shrink-0">
                  Compare with an extra model
                </label>
                <Select
                  value={extraModel ?? 'none'}
                  onValueChange={(value) =>
                    setExtraModel(value === 'none' ? null : (value as 'ast' | 'clap' | 'passt' | 'beats'))
                  }
                  disabled={isAnalyzing}
                >
                  <SelectTrigger className="w-full sm:w-[220px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (fastest)</SelectItem>
                    <SelectItem value="ast">AST</SelectItem>
                    <SelectItem value="clap">CLAP</SelectItem>
                    <SelectItem value="passt">PaSST</SelectItem>
                    <SelectItem value="beats">BEATs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {extraModel && (
                <p className="text-xs text-muted-foreground -mt-1">
                  This adds a slower research comparison model to the results below -- expect roughly 10-30 extra
                  seconds.
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant={isRecording ? 'destructive' : 'outline'}
                  size="lg"
                  onClick={toggleRecording}
                  className="rounded-xl flex-1"
                  disabled={isAnalyzing}
                >
                  <Mic className={`h-5 w-5 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                  {isRecording ? 'Stop Recording' : 'Record Sound'}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl flex-1"
                  onClick={handleUploadClick}
                  disabled={isAnalyzing || isRecording}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload File
                </Button>

                <Button
                  size="lg"
                  onClick={analyze}
                  className="rounded-xl flex-1 bg-primary hover:bg-primary/90"
                  disabled={isAnalyzing || isRecording || !hasAudio}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  Analyze
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC, WEBM, WMA, AMR • Max size: 20MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && isSeverityFormCategory(result.final_prediction) && (
        <SeverityFormDialog
          open={isSeverityFormOpen}
          onOpenChange={setIsSeverityFormOpen}
          category={result.final_prediction}
        />
      )}
    </div>
  );
}
