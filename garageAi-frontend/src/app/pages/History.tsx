import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Filter, Loader2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ProbabilityBreakdown } from '../components/ProbabilityBreakdown';
import { ApiError, deleteHistoryItem, getHistory, type PastAnalysis } from '../lib/api';
import { formatLabel } from '../lib/format';
import { confidenceBadgeClass, isUncertain } from '../lib/confidence';

export function History() {
  const [analyses, setAnalyses] = useState<PastAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedModelBreakdown, setExpandedModelBreakdown] = useState<Set<number>>(new Set());

  const toggleModelBreakdown = (id: number) => {
    setExpandedModelBreakdown((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    getHistory()
      .then(({ analyses }) => setAnalyses(analyses))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your history.'))
      .finally(() => setIsLoading(false));
  }, []);

  const problemTypes = useMemo(
    () => Array.from(new Set(analyses.map((a) => a.final_prediction))),
    [analyses]
  );

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesSearch =
      analysis.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.final_prediction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || analysis.final_prediction === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteHistoryItem(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // leave the item in place if deletion failed
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Your Past Analyses</h1>
          <p className="text-muted-foreground">Review and track your vehicle diagnostics history</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search analyses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[220px] rounded-xl">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Issues</SelectItem>
              {problemTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Analysis List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.length > 0 ? (
              filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <span className="font-medium">{analysis.filename}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {analysis.final_prediction === 'other' ? (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <AlertCircle className="h-4 w-4" />
                              <h4 className="text-foreground">Not a Recognized Fault Sound</h4>
                            </span>
                          ) : isUncertain(analysis.final_confidence) ? (
                            <span className="flex items-center gap-1.5 text-amber-700">
                              <AlertTriangle className="h-4 w-4" />
                              <h4 className="text-foreground">No Clear Match</h4>
                            </span>
                          ) : (
                            <h4>{formatLabel(analysis.final_prediction)}</h4>
                          )}
                          <Badge className={`${confidenceBadgeClass(analysis.final_confidence)} border`}>
                            {Math.round(analysis.final_confidence * 100)}% Confidence
                          </Badge>
                        </div>

                        {analysis.final_prediction !== 'other' && isUncertain(analysis.final_confidence) && (
                          <p className="text-xs text-muted-foreground">
                            Closest guess:{' '}
                            <span className="font-medium text-foreground">
                              {formatLabel(analysis.final_prediction)}
                            </span>
                          </p>
                        )}

                        <ProbabilityBreakdown
                          allProbabilities={analysis.all_probabilities}
                          predictedClass={analysis.final_prediction}
                          title="Confidence by Class"
                        />

                        {analysis.individual_models.length > 0 && (
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-transparent"
                              onClick={() => toggleModelBreakdown(analysis.id)}
                            >
                              {expandedModelBreakdown.has(analysis.id) ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              See other models' results
                            </Button>
                            {expandedModelBreakdown.has(analysis.id) && (
                              <div className="space-y-1 mt-2">
                                {analysis.individual_models.map((model) => (
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
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(analysis.id)}
                        disabled={deletingId === analysis.id}
                        aria-label="Delete analysis"
                      >
                        {deletingId === analysis.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {analyses.length === 0
                    ? "You don't have any analyses yet. Go analyze a sound from the Home page."
                    : 'No analyses found matching your criteria'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
