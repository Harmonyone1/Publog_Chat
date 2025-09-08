import AppSidebar from '../../components/AppSidebar';
import AppHeader from '../../components/AppHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
