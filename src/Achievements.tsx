import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { Award, Medal, ShieldCheck, Star, Trophy } from 'lucide-react';

type Achievement = { userId: string; name: string; verifiedAttendance: number; points: number; badges: string[] };
type Leader = { rank: number; name: string; points: number; badges: number };

export default function Achievements() {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [scoring, setScoring] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/gamification').then(response => {
      setCurrent(response.data.current);
      setLeaderboard(response.data.leaderboard || []);
      setScoring(response.data.scoring || '');
    }).catch((e: any) => setMessage(e?.response?.data?.error || e.message || 'Could not load achievements.'));
  }, []);

  return <>
    <div className="heading">
      <div><span className="eyebrow">LEARNING RECOGNITION</span><h1>Achievements & leaderboard</h1><p>Earn points through lecturer-verified class attendance.</p></div>
      <Trophy color="#43d8c2" size={28}/>
    </div>
    {message && <p className="message">{message}</p>}
    {current && <div className="metrics">
      <div className="metric"><div><Star/></div><b>{current.points}</b><span>Your points</span><small>VERIFIED ATTENDANCE</small></div>
      <div className="metric"><div><ShieldCheck/></div><b>{current.verifiedAttendance}</b><span>Verified classes</span><small>APPROVED RECORDS</small></div>
      <div className="metric"><div><Award/></div><b>{current.badges.length}</b><span>Badges earned</span><small>ACHIEVEMENTS</small></div>
    </div>}
    <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">YOUR BADGES</span><h3>Milestones</h3></div><Award color="#43d8c2"/></div>
      {current?.badges.length ? <div className="badge-list">{current.badges.map(badge => <span className="role-tag" key={badge}><Medal size={14}/> {badge}</span>)}</div> : <div className="empty"><Award/><b>Your first badge is waiting</b><small>Complete a class and have your attendance verified by the lecturer.</small></div>}
      <p className="hint">{scoring}</p>
    </section>
    <section className="panel">
      <div className="panel-title"><div><span className="eyebrow">CAMPUS LEADERBOARD</span><h3>Top learners</h3></div><Trophy color="#43d8c2"/></div>
      {leaderboard.length ? leaderboard.map(person => <div className="audit-row" key={person.rank}><b className="rank-number">#{person.rank}</b><div><b>{person.name}</b><small>{person.badges} badges earned</small></div><strong>{person.points} pts</strong></div>) : <div className="empty"><Trophy/><b>No points recorded yet</b><small>Verified attendance creates the first leaderboard entries.</small></div>}
    </section>
  </>;
}
