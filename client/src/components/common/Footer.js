import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600 flex flex-col md:flex-row gap-2 justify-between">
        <div>© {new Date().getFullYear()} NexaMed</div>
        <div className="flex gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </div>
    </footer>
  );
}