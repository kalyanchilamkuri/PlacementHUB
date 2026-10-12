'use client';

import { useRef, useState, useTransition } from 'react';
import { CheckCircle2, FileSpreadsheet, XCircle } from 'lucide-react';
import { bulkRecordOffers, type BulkRowResult } from '@/lib/actions/offers';
import { Button } from '@/components/ui/kit';

const TEMPLATE =
  'rollNo,company,offerType,ctcLpa,stipend,academicYear,role,onCampus\n' +
  'LCS2022001,Google,FULL_TIME,32,,2025-26,Software Engineer,yes\n' +
  'LCS2023004,Amazon,6_MONTH_INTERN,0,60000,2026-27,SDE Intern,yes\n';

/** Small RFC 4180 parser: quoted fields, escaped quotes, CRLF. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const [head, ...body] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

export function BulkImport() {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [name, setName] = useState('');
  const [results, setResults] = useState<BulkRowResult[] | null>(null);
  const [pending, start] = useTransition();

  async function onFile(f: File | undefined) {
    setResults(null);
    if (!f) return;
    setName(f.name);
    setRows(parseCsv(await f.text()));
  }

  const done = results?.filter((r) => r.ok).length ?? 0;
  const failed = results?.filter((r) => !r.ok) ?? [];

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="niche grid size-10 place-items-center bg-blue-wash text-blue">
          <FileSpreadsheet size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Import many offers from a spreadsheet</h2>
          <p className="text-sm text-muted">
            Save your Excel sheet as CSV. Every row goes through the same update as the form.
          </p>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
          download="offers-template.csv"
          className="text-sm text-blue hover:underline"
        >
          Download template
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="text-sm file:mr-3 file:rounded-[10px] file:border file:border-line file:bg-surface-2 file:px-4 file:py-2 file:text-sm hover:file:border-blue"
        />
        {rows.length > 0 && !results && (
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await bulkRecordOffers(rows);
                setResults(r.results);
                setRows([]);
                if (input.current) input.current.value = '';
              })
            }
          >
            {pending ? 'Importing…' : `Import ${rows.length} row${rows.length === 1 ? '' : 's'}`}
          </Button>
        )}
      </div>

      {rows.length > 0 && !results && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="bg-surface-2 text-left">
              <tr>
                {Object.keys(rows[0]!).map((k) => (
                  <th key={k} className="px-3 py-2 font-medium">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {Object.values(r).map((v, j) => (
                    <td key={j} className="px-3 py-1.5">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-3 py-2 text-xs text-muted">
            {name}: showing the first {Math.min(5, rows.length)} of {rows.length} rows.
          </p>
        </div>
      )}

      {results && (
        <div className="pop mt-4 space-y-2 text-sm" role="status">
          <p className="flex items-center gap-2 text-ok">
            <CheckCircle2 size={16} /> {done} offer{done === 1 ? '' : 's'} recorded.
          </p>
          {failed.slice(0, 8).map((r) => (
            <p key={r.line} className="flex items-start gap-2 text-bad">
              <XCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                Row {r.line}: {r.message}
              </span>
            </p>
          ))}
          {failed.length > 8 && <p className="text-muted">…and {failed.length - 8} more rows had problems.</p>}
        </div>
      )}
    </section>
  );
}
