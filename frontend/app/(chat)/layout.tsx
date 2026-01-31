import ChatLayout from "@/components/ChatLayout";

export default function ChatRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatLayout>{children}</ChatLayout>;
}
