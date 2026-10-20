import React, { useState, useEffect } from 'react';
import { QuizData, QuizSubmissionResponse } from '../../types/index.js';
import { quizApi } from '../../services/api.js';
import { X, CheckCircle2, XCircle, Award, RotateCcw, ArrowRight, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../common/Badge.js';

interface QuizModalProps {
  lessonId: string;
  lessonTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCompletedSuccess?: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  lessonId,
  lessonTitle,
  isOpen,
  onClose,
  onCompletedSuccess,
}) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadQuiz();
    } else {
      // Reset state on close
      setSubmissionResult(null);
      setSelectedAnswers({});
    }
  }, [isOpen, lessonId]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setSubmissionResult(null);
    setSelectedAnswers({});
    try {
      const data = await quizApi.getQuizForLesson(lessonId);
      setQuizData(data.quiz);
      setPreviousAttempts(data.previousAttempts || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to prepare quiz for this lesson', 'error');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (submissionResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!quizData) return;

    // Check that all questions have been answered
    const unanswered = quizData.questions.filter((q) => selectedAnswers[q.index] === undefined);
    if (unanswered.length > 0) {
      showToast(`Please answer all ${quizData.questions.length} questions before submitting!`, 'error');
      return;
    }

    const payload = Object.entries(selectedAnswers).map(([qIdx, optIdx]) => ({
      questionIndex: parseInt(qIdx, 10),
      selectedOptionIndex: optIdx,
    }));

    setIsSubmitting(true);
    try {
      const result = await quizApi.submitQuiz(quizData.id, payload);
      setSubmissionResult(result);
      if (result.passed) {
        showToast(`🎉 Excellent! You passed with ${result.percentage}%!`, 'success');
        if (onCompletedSuccess) {
          onCompletedSuccess();
        }
      } else {
        showToast(`Quiz completed: ${result.score}/${result.totalQuestions} (${result.percentage}%). Review explanations below!`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to evaluate quiz', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSubmissionResult(null);
    setSelectedAnswers({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Comprehension Quiz</span>
              {submissionResult && (
                <Badge variant={submissionResult.passed ? 'emerald' : 'amber'} size="sm">
                  {submissionResult.passed ? 'Passed (≥60%)' : 'Needs Review (<60%)'}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-bold text-white truncate max-w-xl">
              {quizData?.title || `Quiz: ${lessonTitle}`}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Generating comprehension quiz from lesson content...</p>
            </div>
          ) : quizData ? (
            <>
              {/* Submission Score Banner */}
              {submissionResult && (
                <div
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    submissionResult.passed
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                        submissionResult.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {submissionResult.passed ? 'Lesson Mastered!' : 'Keep Learning!'}
                      </h4>
                      <p className="text-xs text-slate-300">
                        You scored <strong className="text-white">{submissionResult.score}</strong> out of{' '}
                        <strong className="text-white">{submissionResult.totalQuestions}</strong> (
                        {submissionResult.percentage}%).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleRetake}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {(submissionResult ? submissionResult.results : quizData.questions).map((q: any, qIdx: number) => {
                  const isSubmitted = !!submissionResult;
                  const questionResult = submissionResult ? q : null;
                  const selectedOpt = isSubmitted ? questionResult.selectedOptionIndex : selectedAnswers[q.index];

                  return (
                    <div
                      key={q.questionIndex ?? q.index}
                      className={`p-5 rounded-2xl border transition-all ${
                        isSubmitted
                          ? questionResult.isCorrect
                            ? 'bg-emerald-950/10 border-emerald-500/30'
                            : 'bg-rose-950/10 border-rose-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            {q.questionType?.replace('_', ' ') || 'Question'}
                          </span>
                        </div>
                        {isSubmitted && (
                          <div>
                            {questionResult.isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" /> Correct (+1)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                                <XCircle className="w-4 h-4" /> Incorrect (0)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-100 mb-4 leading-relaxed">
                        {q.questionText}
                      </h4>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {q.options.map((optionText: string, optIdx: number) => {
                          const isSelected = selectedOpt === optIdx;
                          let optionClasses = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700';

                          if (isSubmitted) {
                            if (optIdx === questionResult.correctAnswerIndex) {
                              optionClasses = 'border-emerald-500 bg-emerald-500/15 text-emerald-200 font-semibold';
                            } else if (isSelected && !questionResult.isCorrect) {
                              optionClasses = 'border-rose-500 bg-rose-500/15 text-rose-200 line-through';
                            } else {
                              optionClasses = 'border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60';
                            }
                          } else if (isSelected) {
                            optionClasses = 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium shadow-glow';
                          }

                          const optionLetter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectOption(q.index, optIdx)}
                              className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 text-xs sm:text-sm transition-all ${optionClasses}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {optionLetter}
                              </span>
                              <span className="flex-1">{optionText}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation (Shown post submission) */}
                      {isSubmitted && questionResult.explanation && (
                        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                          <strong className="text-emerald-400 flex items-center gap-1 mb-1">
                            <HelpCircle className="w-3.5 h-3.5" /> Explanation:
                          </strong>
                          {questionResult.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        {!submissionResult && quizData && (
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between sticky bottom-0 z-10">
            <span className="text-xs text-slate-400">
              Answered {Object.keys(selectedAnswers).length} of {quizData.questions.length} questions
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(selectedAnswers).length < quizData.questions.length}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-all shadow-glow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    Submit Quiz <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
