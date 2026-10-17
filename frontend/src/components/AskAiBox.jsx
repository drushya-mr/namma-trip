import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Users, Send, CheckCircle, ThumbsUp, AlertCircle, ExternalLink, Sparkles, MessageCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AskAiBox({ placeId, place }) {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'community'

  // AI Tab State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Community Tab State
  const [communityQuestion, setCommunityQuestion] = useState('');
  const [communityQuestions, setCommunityQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Community Answer Input Map
  const [replyTextMap, setReplyTextMap] = useState({});

  useEffect(() => {
    loadCommunityQuestions();
  }, [placeId]);

  const loadCommunityQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.getQuestions(placeId);
      if (res.success) {
        setCommunityQuestions(res.questions || []);
      }
    } catch (e) {
      console.warn('Failed to load questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.askAi(placeId, aiQuestion.trim(), i18n.language);
      if (res.success) {
        setAiResponse(res);
      }
    } catch (err) {
      alert(err.message || 'Failed to get answer from AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePostCommunityQuestion = async (e) => {
    e.preventDefault();
    if (!communityQuestion.trim()) return;

    setSubmittingQuestion(true);
    try {
      const res = await api.askQuestion(placeId, communityQuestion.trim(), currentUser?.id || 'demo-user-id');
      if (res.success && res.question) {
        setCommunityQuestions(prev => [res.question, ...prev]);
        setCommunityQuestion('');
      }
    } catch (err) {
      alert(err.message || 'Failed to post question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    const text = replyTextMap[questionId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.answerQuestion(questionId, text.trim(), currentUser?.id || 'demo-user-id');
      if (res.success && res.answer) {
        setCommunityQuestions(prev => prev.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              answers: [...(q.answers || []), res.answer]
            };
          }
          return q;
        }));
        setReplyTextMap(prev => ({ ...prev, [questionId]: '' }));
      }
    } catch (err) {
      alert(err.message || 'Failed to submit answer');
    }
  };

  const handleVote = async (answerId) => {
    try {
      const res = await api.voteAnswer(answerId, currentUser?.id || 'demo-user-id', 1);
      if (res.success) {
        setCommunityQuestions(prev => prev.map(q => ({
          ...q,
          answers: (q.answers || []).map(a => a.id === answerId ? { ...a, votes_count: res.votes_count } : a)
        })));
      }
    } catch (err) {
      console.warn('Vote failed:', err);
    }
  };

  const handleAccept = async (questionId, answerId) => {
    try {
      const res = await api.acceptAnswer(questionId, answerId, currentUser?.id || 'demo-user-id');
      if (res.success) {
        setCommunityQuestions(prev => prev.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              accepted_answer_id: answerId,
              answers: (q.answers || []).map(a => ({ ...a, is_accepted: a.id === answerId }))
            };
          }
          return q;
        }));
      }
    } catch (err) {
      alert(err.message || 'Only the question author can accept an answer');
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 max-w-sm mb-5">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Bot className="w-4 h-4 text-amber-600" />
          <span>{t('place.askAiTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'community'
              ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>{t('place.askCommunityTab')} ({communityQuestions.length})</span>
        </button>
      </div>

      {/* TAB 1: ASK AI (STRICT GROUNDING) */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <form onSubmit={handleAskAi} className="flex gap-2">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder={t('place.askAiPlaceholder')}
              className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 hover:opacity-95 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {aiLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('place.askAiButton')}</span>
            </button>
          </form>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => setAiQuestion(i18n.language === 'kn' ? 'ಪ್ರವೇಶ ಶುಲ್ಕ ಮತ್ತು ಸಮಯ ಎಷ್ಟು?' : 'What is the entry fee and timings?')}
              className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-stone-700 hover:bg-amber-100 transition-colors"
            >
              💰 {i18n.language === 'kn' ? 'ಶುಲ್ಕ & ಸಮಯ' : 'Fees & Timings'}
            </button>
            <button
              onClick={() => setAiQuestion(i18n.language === 'kn' ? 'ಭೇಟಿ ನೀಡಲು ಅತ್ಯುತ್ತಮ ತಿಂಗಳು ಯಾವುದು?' : 'What is the best time to visit?')}
              className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-stone-700 hover:bg-amber-100 transition-colors"
            >
              ⛅ {i18n.language === 'kn' ? 'ಉತ್ತಮ ಕಾಲ' : 'Best Season'}
            </button>
            <button
              onClick={() => setAiQuestion(i18n.language === 'kn' ? 'ಇಲ್ಲಿಗೆ ತಲುಪುವುದು ಹೇಗೆ?' : 'How to reach here?')}
              className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-stone-700 hover:bg-amber-100 transition-colors"
            >
              🚗 {i18n.language === 'kn' ? 'ಮಾರ್ಗ' : 'How to Reach'}
            </button>
          </div>

          {/* AI Response Display */}
          {aiResponse && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-600" />
                  {t('place.askAiTab')}
                </span>
                {aiResponse.is_verified ? (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    {t('place.verifiedOn')} {aiResponse.verified_on?.split(' ')[0]}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    {t('place.verifyBeforeTravel')}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line leading-relaxed">
                {aiResponse.answer}
              </p>

              {/* Citations and Official Sources */}
              {aiResponse.sources && aiResponse.sources.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                  <span className="font-semibold block">{t('place.sourcesUsed')}:</span>
                  {aiResponse.sources.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span>•</span>
                      {s.startsWith('http') ? (
                        <a href={s} target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1">
                          {s} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span>{s}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASK THE COMMUNITY */}
      {activeTab === 'community' && (
        <div className="space-y-5">
          {/* Ask community input */}
          <form onSubmit={handlePostCommunityQuestion} className="flex gap-2">
            <input
              type="text"
              value={communityQuestion}
              onChange={(e) => setCommunityQuestion(e.target.value)}
              placeholder={t('place.askCommunityPlaceholder')}
              className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={submittingQuestion || !communityQuestion.trim()}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t('place.postQuestionButton')}</span>
            </button>
          </form>

          {/* List of Questions & Answers */}
          <div className="space-y-4">
            {communityQuestions.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-500 dark:text-stone-400">
                {t('place.noAnswersYet')} — {t('place.beFirstToAnswer')}
              </div>
            ) : (
              communityQuestions.map((q) => (
                <div key={q.id} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                      Q: {q.question_text}
                    </h5>
                    <span className="text-[10px] text-stone-400 shrink-0">
                      {q.user?.display_name || 'ಪ್ರವಾಸಿಗ'}
                    </span>
                  </div>

                  {/* Answers thread */}
                  <div className="space-y-2 pl-3 border-l-2 border-amber-300 dark:border-stone-700">
                    {(q.answers || []).map((ans) => (
                      <div
                        key={ans.id}
                        className={`p-3 rounded-xl text-xs space-y-1.5 ${
                          ans.is_accepted
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {ans.user?.display_name || 'ಪ್ರವಾಸಿಗ'}
                          </span>
                          <div className="flex items-center gap-2">
                            {ans.is_accepted && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                <CheckCircle className="w-3 h-3" />
                                {t('place.acceptedAnswer')}
                              </span>
                            )}
                            <span className="text-stone-400 text-[10px]">
                              {t('place.communityNotice')}
                            </span>
                          </div>
                        </div>

                        <p className="text-stone-800 dark:text-stone-200 leading-relaxed">
                          {ans.answer_text}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          {/* Upvote button */}
                          <button
                            onClick={() => handleVote(ans.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-100 transition-colors font-medium"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{ans.votes_count || 0} {t('place.upvote')}</span>
                          </button>

                          {/* Accept button for question owner */}
                          {!q.accepted_answer_id && q.user_id === currentUser?.id && (
                            <button
                              onClick={() => handleAccept(q.id, ans.id)}
                              className="text-amber-700 hover:underline font-semibold"
                            >
                              {t('place.markAccepted')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Answer submission input */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={replyTextMap[q.id] || ''}
                        onChange={(e) => setReplyTextMap(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={t('place.yourAnswerPlaceholder')}
                        className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
                      />
                      <button
                        onClick={() => handleAnswerSubmit(q.id)}
                        disabled={!replyTextMap[q.id]?.trim()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-40"
                      >
                        {t('place.submitAnswer')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
