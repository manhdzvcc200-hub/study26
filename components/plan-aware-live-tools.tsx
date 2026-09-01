'use client';
import { useState } from 'react';
import { useParticipants, useRoomContext } from '@livekit/components-react';

type Props={roomId:string;features:Record<string,boolean>};
export default function PlanAwareLiveTools({roomId,features}:Props){
 const room=useRoomContext(); const participants=useParticipants(); const [raised,setRaised]=useState(false); const [open,setOpen]=useState(false); const [notice,setNotice]=useState('');
 async function toggleHand(){if(!features.hand_raise)return;const next=!raised;setRaised(next);await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({type:'study26-hand',raised:next})),{reliable:true});}
 async function kick(identity:string){setNotice('Đang kick…');const r=await fetch('/api/live/kick',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({roomId,identity})});const d=await r.json();setNotice(r.ok?'Đã kick người dùng.':d.error||'Không thể kick.');}
 return <div className="fixed left-5 bottom-5 z-40 flex flex-col gap-2">{features.hand_raise&&<button onClick={toggleHand} className={`rounded-xl px-4 py-2 font-black shadow ${raised?'bg-amber-400':'bg-white'}`}>{raised?'✋ Đã giơ tay':'✋ Giơ tay'}</button>}{features.kick&&<><button onClick={()=>setOpen(v=>!v)} className="rounded-xl bg-white px-4 py-2 font-black shadow">👥 Quản lý người tham gia</button>{open&&<div className="w-72 rounded-2xl bg-white p-3 shadow-2xl">{participants.filter(p=>p.identity!==room.localParticipant.identity).map(p=><div key={p.identity} className="flex items-center justify-between gap-2 border-b py-2 last:border-0"><span className="truncate text-sm font-bold">{p.name||p.identity}</span><button onClick={()=>kick(p.identity)} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-black text-red-600">Kick</button></div>)}</div>}</>}{notice&&<div className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">{notice}</div>}</div>
}
