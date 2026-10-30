import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { BadgeCheck, Building2, CheckCircle2, Clock3, RefreshCw, ShieldCheck, UserCheck, XCircle } from 'lucide-react';

type Role = 'student' | 'lecturer' | 'class_rep' | 'administrator' | 'super_admin';
type Institution = { name: string; code: string; campus?: string; status?: string };
type Identity = { identityStatus: string; registrationNumber?: string | null; verifiedAt?: number | null };
type Request = { id: string; userId: string; registrationNumber: string; requestedProgramme?: string; status: string; submittedAt: number; studentName: string; studentEmail: string };

const stamp = (value?: number) => value ? new Date(value).toLocaleString() : '—';

export default function InstitutionIdentity({ role }: { role: Role }) {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [identity, setIdentity] = useState<Identity>({ identityStatus: 'not_submitted' });
  const [requests, setRequests] = useState<Request[]>([]);
  const [canConfigure, setCanConfigure] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', campus: '' });
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [programme, setProgramme] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const response = await api.get('/api/institution');
    const data = response.data;
    setInstitution(data.institution || null);
    setIdentity(data.profile || { identityStatus: 'not_submitted' });
    setCanConfigure(Boolean(data.canConfigure));
    setCanReview(Boolean(data.canReview));
    if (data.institution) setForm({ name: data.institution.name || '', code: data.institution.code || '', campus: data.institution.campus || '' });
    if (data.canReview) {
      const queue = await api.get('/api/identity/requests');
      setRequests(queue.data.requests || []);
    }
  }

  useEffect(() => {
    load().catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load institution records.'));
  }, []);

  async function saveInstitution(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/institution', form);
      setMessage('Institution registry settings saved.');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not save institution settings.');
    } finally { setBusy(false); }
  }

  async function submitIdentity(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/identity/request', { registrationNumber, programme });
      setMessage('Registration details submitted. An administrator must verify them.');
      setRegistrationNumber('');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not submit verification request.');
    } finally { setBusy(false); }
  }

  async function review(item: Request, status: 'verified' | 'rejected') {
    const note = reason.trim();
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/identity/' + encodeURIComponent(item.id) + '/review', { status, reason: note });
      setMessage('Identity request ' + status + '.');
      setReason('');
      await load();
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e.message || 'Could not review identity request.');
    } finally { setBusy(false); }
  }

  return <>
    <div className="heading">
      <div><span className="eyebrow">IDENTITY & INSTITUTION</span><h1>Institution registry</h1><p>Configure the institution record and verify student registration details before treating an account as institution-verified.</p></div>
      <button className="outline" onClick={() => load()} disabled={busy}><RefreshCw size={16}/> Refresh</button>
    </div>

    <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">INSTITUTION RECORD</span><h3>{institution?.name || 'Institution not configured'}</h3></div><Building2 color="#43d8c2"/></div>
      {institution ? <div className="audit-row"><ShieldCheck/><div><b>{institution.code}</b><small>{institution.campus || 'Main campus'} · {institution.status || 'active'}</small></div><span className="verified"><CheckCircle2 size={14}/> Registry active</span></div> : <p className="hint">The platform owner must configure the institution registry before students can submit identity verification.</p>}
      {canConfigure && <form onSubmit={saveInstitution}>
        <label>Official institution name<input required minLength={3} maxLength={140} value={form.name} onChange={e => setForm(old => ({ ...old, name: e.target.value }))} placeholder="Enter official institution name"/></label>
        <label>Institution code<input required minLength={2} maxLength={24} value={form.code} onChange={e => setForm(old => ({ ...old, code: e.target.value.toUpperCase() }))} placeholder="e.g. MWECAU"/></label>
        <label>Main campus<input maxLength={100} value={form.campus} onChange={e => setForm(old => ({ ...old, campus: e.target.value }))} placeholder="e.g. Moshi Campus"/></label>
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : institution ? 'Update institution registry' : 'Create institution registry'}</button>
      </form>}
      {!canConfigure && !canReview && <p className="hint">Institution registry details are read-only for this account.</p>}
    </section>

    {role === 'student' && <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">STUDENT VERIFICATION</span><h3>Registration identity</h3></div><BadgeCheck color="#43d8c2"/></div>
      {identity.identityStatus === 'verified' ? <div className="audit-row"><CheckCircle2/><div><b>Institution identity verified</b><small>{identity.registrationNumber} · Verified {stamp(identity.verifiedAt || undefined)}</small></div></div> : <>
        <p className="hint">Submit your official registration number. Your account remains unverified until an authorized administrator reviews it.</p>
        {identity.identityStatus === 'pending' && <div className="audit-row"><Clock3/><div><b>Verification pending</b><small>Your request is waiting for institutional review. You cannot submit another request while it is pending.</small></div></div>}
        {identity.identityStatus !== 'pending' && <form onSubmit={submitIdentity}>
          <label>Official registration number<input required minLength={4} maxLength={30} value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value.toUpperCase())} placeholder="Enter your registration number"/></label>
          <label>Programme / course of study<input maxLength={120} value={programme} onChange={e => setProgramme(e.target.value)} placeholder="Optional programme name"/></label>
          <button className="primary" disabled={busy || !institution}>{busy ? 'Submitting…' : 'Submit for verification'}</button>
        </form>}
        {identity.identityStatus === 'rejected' && <p className="hint">Your previous request was rejected. Check your registration details and submit a corrected request.</p>}
      </>}
    </section>}

    {canReview && <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">REGISTRAR WORKFLOW</span><h3>Student verification queue · {requests.filter(x => x.status === 'pending').length} pending</h3></div><UserCheck color="#43d8c2"/></div>
      <label>Review note (optional)<input maxLength={240} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection or verification note"/></label>
      {requests.filter(x => x.status === 'pending').length ? requests.filter(x => x.status === 'pending').map(item => <div className="audit-row" key={item.id}>
        <UserCheck/>
        <div><b>{item.studentName}</b><small>{item.studentEmail} · {item.registrationNumber}{item.requestedProgramme ? ' · ' + item.requestedProgramme : ''} · Submitted {stamp(item.submittedAt)}</small></div>
        <button className="icon" title="Verify student" disabled={busy} onClick={() => review(item, 'verified')}><CheckCircle2 color="#43d8c2"/></button>
        <button className="icon" title="Reject request" disabled={busy} onClick={() => review(item, 'rejected')}><XCircle color="#ff7777"/></button>
      </div>) : <div className="empty"><ShieldCheck/><b>No pending identity requests</b><small>New student submissions will appear here for review.</small></div>}
    </section>}

    {message && <p className="message">{message}</p>}
  </>;
}
