export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-5xl h-[700px] shadow-2xl rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
