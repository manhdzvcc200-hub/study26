'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { createClient } from '@/lib/supabase/client';
import LiveFeatureBarRedesigned from '@/components/live-feature-bar-redesigned';
import PlanAwareWhiteboard from '@/components/plan-aware-whiteboard';
import '@livekit/components-styles';

type Props = { room: any; user: any };

export default function LiveRoomRedesigned({ room, user }: Props) {
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('student');
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [teacher, setTeacher] = useState<any>(null);
  async function connectRoom() {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role,suspended')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.suspended) throw new Error('Tài khoản đang bị khóa.');
      setRole(profile?.role || 'student');

      // V6.3: mọi công cụ cốt lõi đều có sẵn, không còn khóa theo gói.
      setFeatures({
        chat: true,
        hand_raise: true,
        kick: true,
        whiteboard: true,
        screen_share: true,
        recording: true,
      });

      const response = await fetch('/api/live/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: room.id }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Không thể vào phòng.');

      setTeacher(data.teacher || null);
      setToken(data.token);
      setServerUrl(data.serverUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể kết nối phòng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    connectRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, user.id]);

  function handleDisconnected() {
    window.location.href = '/dashboard';
  }

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl"><div className="text-5xl">⚠️</div><h1 className="mt-4 text-2xl font-black">Không thể vào phòng</h1><p className="mt-2 leading-6 text-slate-300">{error}</p><a href="/dashboard" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-black text-slate-900">Về Dashboard</a></div></main>;
  }

  if (loading || !token || !serverUrl) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" /><p className="mt-4 font-semibold text-slate-300">Đang kết nối phòng học…</p></div></main>;
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-slate-950 text-white">
      <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video data-lk-theme="default" options={{ adaptiveStream: true, dynacast: true }} onDisconnected={handleDisconnected}>
        <div className="relative h-full">
          <div className="h-full pb-[84px] sm:pb-[92px]"><VideoConference /></div>
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[70vw] sm:left-5 sm:top-5">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 shadow-xl backdrop-blur">
              <div className="h-9 w-9 overflow-hidden rounded-xl bg-indigo-500/20">{teacher?.avatarUrl ? <img src={teacher.avatarUrl} alt="Giáo viên" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center">👩‍🏫</div>}</div>
              <div className="min-w-0"><div className="truncate text-sm font-black">{teacher?.fullName || 'Giáo viên'}</div><div className="truncate text-xs text-slate-400">{room.title}</div></div>
            </div>
          </div>
          <LiveFeatureBarRedesigned role={role} features={features} roomId={room.id} roomName={room.join_code || room.id} roomTitle={room.title} onLeave={handleDisconnected} />
          {features.whiteboard && <PlanAwareWhiteboard />}
        </div>
      </LiveKitRoom>
    </main>
  );
}
