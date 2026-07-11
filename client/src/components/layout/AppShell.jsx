import TopNav from "./TopNav.jsx";

// Wraps every logged-in page: top navbar + content.
// pt-14 clears the fixed navbar so content never hides behind it.
export default function AppShell({ children, padded = true, wide = false }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main
        className={
          !padded ? "pt-14"
          : wide ? "mx-auto w-full max-w-5xl px-6 pb-10 pt-20"
          : "mx-auto max-w-md px-4 pb-10 pt-20"
        }
      >
        {children}
      </main>
    </div>
  );
}
