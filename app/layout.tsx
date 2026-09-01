import './globals.css'; import type {Metadata} from 'next';
export const metadata:Metadata={title:'Study26',description:'Nền tảng học trực tuyến'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
