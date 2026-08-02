"use client";

interface EmailRow {
  id: string;
  email: string;
  country: string | null;
  capturedAt: string; // ISO string — serialized from Date on server
}

export default function EmailsTable({ emails }: { emails: EmailRow[] }) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        No emails captured yet. Share your link to start collecting.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">#</th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">Email</th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">Country</th>
            <th className="text-left text-xs font-semibold text-gray-400 pb-2">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {emails.map((row, i) => (
            <tr key={row.id}>
              <td className="py-2.5 pr-4 text-gray-400 text-xs">{i + 1}</td>
              <td className="py-2.5 pr-4 text-gray-900 font-mono text-xs">{row.email}</td>
              <td className="py-2.5 pr-4 text-gray-500 text-xs">{row.country ?? "—"}</td>
              <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">
                {new Date(row.capturedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
