import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-extrabold">Unauthorized</h1>
        <p className="mt-2 text-slate-600">You don’t have access to this page.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}