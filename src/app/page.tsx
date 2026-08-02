import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-bold text-gray-900 text-xl tracking-tight">Unlock</span>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          Smart links for creators
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight max-w-2xl mb-6">
          A link that{" "}
          <span className="text-indigo-600">works for you</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
          Put a link anywhere. Before it sends someone to your destination, make something happen — capture an email, grow your community, or just track every click.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/sign-up"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors"
          >
            Create your first link →
          </Link>
          <Link
            href="/sign-in"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-8 py-4 rounded-2xl text-base transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-400">Free to start. No credit card required.</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🔗",
                title: "Paste your URL",
                desc: "Drop in any destination — a YouTube video, course, newsletter, product page. Anything.",
              },
              {
                step: "02",
                icon: "⚡",
                title: "Choose what happens",
                desc: "Capture an email, require a community join, or just track the click. You decide.",
              },
              {
                step: "03",
                icon: "📊",
                title: "Share and track",
                desc: "Put your smart link anywhere. Every click and unlock is tracked in real time.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-indigo-400 tracking-widest">{item.step}</span>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unlock modes */}
      <section className="px-6 py-20 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Three ways to unlock
        </h2>
        <p className="text-center text-gray-500 text-sm mb-12">
          Pick the mode that fits your goal. Switch any time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: "📧",
              mode: "Email gate",
              color: "bg-indigo-50 border-indigo-100",
              badge: "bg-indigo-100 text-indigo-700",
              desc: "Visitor enters their email. You capture a subscriber. They get the content.",
            },
            {
              icon: "🎮",
              mode: "Community gate",
              color: "bg-purple-50 border-purple-100",
              badge: "bg-purple-100 text-purple-700",
              desc: "Visitor joins your Discord, Telegram, or WhatsApp. You grow your community.",
            },
            {
              icon: "⚡",
              mode: "Instant",
              color: "bg-green-50 border-green-100",
              badge: "bg-green-100 text-green-700",
              desc: "No gate. A tracked smart link that handles Instagram and TikTok browsers automatically.",
            },
          ].map((m) => (
            <div
              key={m.mode}
              className={`rounded-2xl border p-6 flex flex-col gap-3 ${m.color}`}
            >
              <div className="text-3xl">{m.icon}</div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${m.badge}`}>
                {m.mode}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to make your links work?
        </h2>
        <p className="text-indigo-200 mb-8 text-base max-w-sm mx-auto">
          Set up your first smart link in under 2 minutes.
        </p>
        <Link
          href="/sign-up"
          className="inline-block bg-white hover:bg-gray-50 text-indigo-600 font-bold px-8 py-4 rounded-2xl text-base transition-colors"
        >
          Get started free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center">
        <span className="font-bold text-gray-900 text-sm">Unlock</span>
        <p className="text-xs text-gray-400 mt-1">A smart link that works for you.</p>
      </footer>
    </div>
  );
}
