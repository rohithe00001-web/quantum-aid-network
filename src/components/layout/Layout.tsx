import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {!isMobile && <Sidebar />}
      <div className={isMobile ? "" : "ml-64"}>
        <Header />
        <main className={isMobile ? "p-4" : "p-6"}>{children}</main>
      </div>
    </div>
  );
}
