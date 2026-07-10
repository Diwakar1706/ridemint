import TopNav from "./TopNav.jsx";

// Wraps every logged-in page: top navbar + content.
// pt-14 clears the fixed navbar so content never hides behind it.
export default function AppShell({ children, padded = true }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className={padded ? "mx-auto max-w-md px-4 pb-10 pt-20" : "pt-14"}>{children}</main>
    </div>
  );
}
