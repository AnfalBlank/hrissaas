import { BottomNav } from "@/components/employee/BottomNav";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-ink-50 pb-36 safe-bottom">
      <div className="relative">{children}</div>
      <BottomNav />
    </div>
  );
}
