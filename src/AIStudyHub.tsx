import { FormEvent, useState } from 'react';
import { api } from '@appdeploy/client';
import { Bot, BookOpenCheck, Send, Sparkles } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string };

export default function AIStudyHub() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hello. I can explain academic topics, help you plan study sessions and answer questions using the AFAMS records available to your account.' },
  ]);
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('');
  const [material, setMaterial] = useState('');
  const [count, setCount] = useState('5');
  const [quiz, setQuiz] = useState('');
  const [busy, setBusy] = useState(false);
  const [quizBusy, setQuizBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [engagementReview, setEngagementReview] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  async function ask(e: FormEvent) {
    e.preventDefault();
    const prompt = question.trim();
    if (!prompt || busy) return;
    setMessages(old => [...old, { role: 'user', text: prompt }]);
    setQuestion('');
    setBusy(true);
    setMessage('');
    try {
      const response = await api.post('/api/ai/assistant', { question: prompt });
      setMessages(old => [...old, { role: 'assistant', text: response.data.answer || 'No answer was returned.' }]);
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Assistant request failed.');
    } finally {
      setBusy(false);
    }
  }

  async function runEngagementReview() {
    setReviewBusy(true);
    setMessage('');
    setEngagementReview('');
    try {
      const response = await api.post('/api/ai/engagement-review', {});
      setEngagementReview(response.data.review || 'No review was returned.');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Engagement review failed.');
    } finally {
      setReviewBusy(false);
    }
  }

  async function generateQuiz(e: FormEvent) {
    e.preventDefault();
    setQuizBusy(true);
    setMessage('');
    setQuiz('');
    try {
      const response = await api.post('/api/ai/quiz', { topic, material, count: Number(count) });
      setQuiz(response.data.quiz || 'No quiz was returned.');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Quiz generation failed.');
    } finally {
      setQuizBusy(false);
    }
  }

  return <>
    <div className="heading">
      <div><span className="eyebrow">AI-POWERED LEARNING</span><h1>AI Study Hub</h1><p>Academic guidance and practice questions, supported by your available AFAMS records.</p></div>
      <span className="live"><Sparkles size={15}/> AI ASSISTANT</span>
    </div>
    {message && <p className="message">{message}</p>}
    <div className="columns">
      <section className="panel ai-chat">
        <div className="panel-title"><div><span className="eyebrow">ACADEMIC ASSISTANT</span><h3>Ask a study question</h3></div><Bot color="#43d8c2"/></div>
        <div className="ai-messages">{messages.map((item, index) => <div className={'ai-message ' + item.role} key={index}><b>{item.role === 'user' ? 'You' : 'AFAMS AI'}</b><p>{item.text}</p></div>)}{busy && <div className="ai-message assistant"><b>AFAMS AI</b><p>Thinking…</p></div>}</div>
        <form onSubmit={ask}><label>Your question<textarea required rows={3} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Explain recursion, help me prepare for a database exam..."/></label><button className="primary" disabled={busy || !question.trim()}><Send size={16}/>{busy ? 'Working…' : 'Ask assistant'}</button></form>
        <small className="hint">AI guidance is advisory. It cannot change attendance or official academic records.</small>
      </section>
      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">PRACTICE GENERATOR</span><h3>Build a quiz</h3></div><BookOpenCheck color="#43d8c2"/></div>
        <form onSubmit={generateQuiz}>
          <label>Topic<input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Data structures and algorithms"/></label>
          <label>Course notes / material<textarea rows={6} value={material} onChange={e => setMaterial(e.target.value)} placeholder="Paste course notes or learning objectives (optional)..."/></label>
          <label>Number of questions<select value={count} onChange={e => setCount(e.target.value)}>{[3,5,7,10].map(n => <option key={n} value={n}>{n} questions</option>)}</select></label>
          <button className="primary" disabled={quizBusy || !topic.trim()}><Sparkles size={16}/>{quizBusy ? 'Generating…' : 'Generate practice quiz'}</button>
        </form>
      </section>
    </div>
    <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">EARLY-WARNING REVIEW</span><h3>Review my academic engagement</h3></div><Bot color="#43d8c2"/></div>
      <p className="hint">Uses your recorded attendance, focus interruptions and enrollments only. It does not have access to grades or assignment results.</p>
      <button className="primary" disabled={reviewBusy} onClick={runEngagementReview}><Sparkles size={16}/>{reviewBusy ? 'Reviewing…' : 'Generate engagement review'}</button>
      {engagementReview && <pre className="ai-quiz-result">{engagementReview}</pre>}
    </section>
    {quiz && <section className="panel ai-quiz-result"><div className="panel-title"><div><span className="eyebrow">GENERATED PRACTICE</span><h3>{topic}</h3></div><BookOpenCheck color="#43d8c2"/></div><pre>{quiz}</pre></section>}
  </>;
}
