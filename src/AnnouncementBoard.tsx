import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { Bell, Megaphone, Plus, RefreshCw, Trash2 } from 'lucide-react';

type Role = 'student' | 'lecturer' | 'administrator' | 'super_admin';
type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: number;
  createdBy: string;
  authorName: string;
};

const stamp = (value: number) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function AnnouncementBoard({ role }: { role: Role }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canPublish = ['lecturer', 'administrator', 'super_admin'].includes(role);

  async function load() {
    const response = await api.get('/api/announcements');
    setItems(response.data.announcements || []);
  }

  useEffect(() => {
    load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load announcements.'));
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/announcements', form);
      setForm({ title: '', body: '', audience: 'all' });
      setMessage('Announcement published.');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not publish announcement.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Announcement) {
    if (!window.confirm('Delete this announcement?')) return;
    setBusy(true);
    try {
      await api.delete('/api/announcements/' + encodeURIComponent(item.id));
      setMessage('Announcement deleted.');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not delete announcement.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="heading">
      <div><span className="eyebrow">CAMPUS COMMUNICATION</span><h1>Announcements</h1><p>Important academic updates and messages for your campus community.</p></div>
      <button className="outline" onClick={() => load()}><RefreshCw size={16}/> Refresh</button>
    </div>
    {canPublish && <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">PUBLISH UPDATE</span><h3>New announcement</h3></div><Plus color="#43d8c2"/></div>
      <form onSubmit={publish}>
        <label>Title<input required minLength={3} maxLength={120} value={form.title} onChange={e => setForm(old => ({ ...old, title: e.target.value }))} placeholder="Announcement title"/></label>
        <label>Message<textarea required minLength={5} maxLength={3000} rows={4} value={form.body} onChange={e => setForm(old => ({ ...old, body: e.target.value }))} placeholder="Write the announcement..."/></label>
        <label>Audience<select value={form.audience} onChange={e => setForm(old => ({ ...old, audience: e.target.value }))}><option value="all">Everyone</option><option value="students">Students</option><option value="lecturers">Lecturers</option><option value="staff">Lecturers & administrators</option></select></label>
        <button className="primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish announcement'}</button>
      </form>
    </section>}
    {message && <p className="message">{message}</p>}
    {items.length ? items.map(item => <article className="panel announcement-card" key={item.id}>
      <div className="panel-title"><div><span className="eyebrow">{item.audience.toUpperCase()} · {stamp(item.createdAt)}</span><h3>{item.title}</h3></div><Megaphone color="#43d8c2"/></div>
      <p>{item.body}</p>
      <div className="announcement-meta"><small>Published by {item.authorName || 'Campus staff'}</small><button className="icon" disabled={busy} onClick={() => remove(item)} title="Delete announcement"><Trash2 size={16}/></button></div>
    </article>) : <section className="panel"><div className="empty"><Bell/><b>No announcements yet</b><small>Published campus updates will appear here.</small></div></section>}
  </>;
}
