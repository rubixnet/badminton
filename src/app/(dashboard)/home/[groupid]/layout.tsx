export default function GroupLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode; 
}>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}