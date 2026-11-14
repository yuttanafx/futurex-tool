"use client";

import { useEffect, useRef, useState } from "react";
import { saveTemplate, deleteTemplate, sendTemplate } from "./actions";

function fmtPrice(p) {
  const n = String(p || "").replace(/[^0-9]/g, "");
  return n ? "฿" + Number(n).toLocaleString("th-TH") : "";
}

// ปุ่มคัดลอกทั้งหมด: ชื่อ+ราคา, แคปชัน, เลข อย. (ถ้ามี), แฮชแท็ก (รายละเอียดสินค้าไม่รวม)
function fullText(t) {
  const head = t.name + (fmtPrice(t.price) ? " " + fmtPrice(t.price) : "");
  const fda = t.fda_no ? "เลข อย. " + t.fda_no : "";
  return [head, t.caption, fda, t.tags].filter(Boolean).join("\n\n");
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  document.body.removeChild(ta);
  return ok;
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

export default function TemplateManager({ items, canSend = false }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [sureId, setSureId] = useState(null);
  const [q, setQ] = useState("");
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function later(fn, ms) {
    timers.current.push(setTimeout(fn, ms));
  }
  function flash(msg) {
    setToast(msg);
    later(() => setToast(""), 1600);
  }

  async function copy(text, label, id) {
    if (!text) return flash("ช่องนี้ยังว่าง");
    const ok = await writeClipboard(text);
    flash(ok ? `คัดลอก${label}แล้ว` : "คัดลอกไม่สำเร็จ ลองกดค้างที่ข้อความแล้วเลือกคัดลอก");
    if (ok && label === "ทั้งหมด") {
      setCopiedId(id);
      later(() => setCopiedId(null), 1400);
    }
  }

  async function send(id) {
    flash("กำลังส่ง...");
    const r = await sendTemplate(id);
    flash(r.message);
  }

  async function onSubmit(fd) {
    await saveTemplate(fd);
    setEditing(null);
    setShowForm(false);
    setFormKey((k) => k + 1);
    flash("บันทึกแล้ว");
  }

  function startEdit(it) {
    setEditing(it);
    setShowForm(true);
    setFormKey((k) => k + 1);
  }

  function cancel() {
    setEditing(null);
    setShowForm(false);
    setFormKey((k) => k + 1);
  }

  async function remove(id) {
    if (sureId !== id) {
      setSureId(id);
      later(() => setSureId((cur) => (cur === id ? null : cur)), 2500);
      return;
    }
    await deleteTemplate(id);
    setSureId(null);
    flash("ลบสินค้าแล้ว");
  }

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? items.filter((it) => (it.name + " " + it.tags).toLowerCase().includes(needle))
    : items;

  return (
    <>
      <details
        className="fold"
        open={showForm}
        onToggle={(e) => setShowForm(e.currentTarget.open)}
      >
        <summary>{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</summary>
        <form key={formKey} className="body" action={onSubmit} autoComplete="off">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label htmlFor="f-name">ชื่อสินค้า
            <input id="f-name" name="name" required maxLength={120}
              defaultValue={editing?.name ?? ""} placeholder="เช่น เซรั่มวิตามินซี 30 มล." />
          </label>
          <label htmlFor="f-price">ราคา (บาท)
            <input id="f-price" name="price" inputMode="numeric" maxLength={9}
              defaultValue={editing?.price ?? ""} placeholder="เช่น 259" />
          </label>
          <label htmlFor="f-caption">แคปชัน
            <textarea id="f-caption" name="caption" maxLength={2000}
              defaultValue={editing?.caption ?? ""} placeholder="ข้อความที่ใช้โพสต์คู่กับคลิป" />
          </label>
          <label htmlFor="f-tags">แฮชแท็ก
            <input id="f-tags" name="tags" maxLength={300}
              defaultValue={editing?.tags ?? ""} placeholder="#รีวิวของดี #tiktokshop" />
          </label>
          <label htmlFor="f-fda">เลข อย. (ถ้ามี)
            <input id="f-fda" name="fda_no" maxLength={40}
              defaultValue={editing?.fda_no ?? ""} placeholder="เช่น 10-1-12345-1-0001" />
          </label>
          <label htmlFor="f-details">รายละเอียดสินค้า (ส่วนผสม ขนาด วิธีใช้ ไม่รวมในปุ่มคัดลอกทั้งหมด)
            <textarea id="f-details" name="details" maxLength={3000}
              defaultValue={editing?.details ?? ""} placeholder={"ส่วนประกอบ: …\nขนาดบรรจุ: …\nวิธีทาน: …"} />
          </label>
          <label htmlFor="f-source">ลิงก์หน้าสินค้าต้นทาง (ถ้ามี)
            <input id="f-source" name="source_url" type="url" maxLength={500}
              defaultValue={editing?.source_url ?? ""} placeholder="https://" />
          </label>
          <div className="row">
            <button className="btn primary" type="submit">
              {editing ? "บันทึกการแก้ไข" : "บันทึกสินค้า"}
            </button>
            {editing && (
              <button className="btn ghost" type="button" onClick={cancel}>ยกเลิกการแก้ไข</button>
            )}
          </div>
        </form>
      </details>

      {items.length > 3 && (
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาสินค้า"
          aria-label="ค้นหาสินค้า"
        />
      )}

      {items.length === 0 ? (
        <div className="empty">ยังไม่มีสินค้า กดเพิ่มสินค้าใหม่ด้านบนเพื่อสร้างเทมเพลตแรก</div>
      ) : shown.length === 0 ? (
        <div className="empty">ไม่พบสินค้าที่ตรงกับ "{q}"</div>
      ) : (
        <ul className="list">
          {shown.map((it) => (
            <li className="card" key={it.id}>
              <div className="head">
                <h2 className="name">{it.name}</h2>
                {fmtPrice(it.price) && <span className="price">{fmtPrice(it.price)}</span>}
              </div>
              <div className="row">
                {it.fda_no
                  ? <span className="pill ok">อย. {it.fda_no}</span>
                  : <span className="pill">ยังไม่ใส่เลข อย.</span>}
              </div>
              {it.caption && <p className="caption">{it.caption}</p>}
              {it.tags && <p className="hashtags">{it.tags}</p>}

              {it.details && (
                <details className="more">
                  <summary>รายละเอียดสินค้า</summary>
                  <div className="body">
                    <p className="caption">{it.details}</p>
                    <div className="row">
                      <button className="btn sm" onClick={() => copy(it.details, "รายละเอียด", it.id)}>
                        คัดลอกรายละเอียด
                      </button>
                      {it.source_url && (
                        <a className="btn sm ghost" href={it.source_url} target="_blank" rel="noopener noreferrer">
                          ดูหน้าสินค้าต้นทาง
                        </a>
                      )}
                    </div>
                  </div>
                </details>
              )}

              <button
                className={"btn primary wide" + (copiedId === it.id ? " done" : "")}
                onClick={() => copy(fullText(it), "ทั้งหมด", it.id)}
              >
                {copiedId === it.id ? "คัดลอกแล้ว" : "คัดลอกทั้งหมด"}
              </button>
              {canSend && (
                <button className="btn wide" onClick={() => send(it.id)}>ส่งไป TikTok</button>
              )}
              <div className="copy3">
                <button className="btn sm" onClick={() => copy(it.name, "ชื่อสินค้า", it.id)}>ชื่อสินค้า</button>
                <button className="btn sm" onClick={() => copy(it.caption, "แคปชัน", it.id)}>แคปชัน</button>
                <button className="btn sm" onClick={() => copy(it.tags, "แฮชแท็ก", it.id)}>แฮชแท็ก</button>
              </div>
              <div className="row end">
                <button className="btn sm ghost" onClick={() => startEdit(it)}>แก้ไข</button>
                <button
                  className={"btn sm ghost" + (sureId === it.id ? " danger" : "")}
                  onClick={() => remove(it.id)}
                >
                  {sureId === it.id ? "กดอีกครั้งเพื่อลบ" : "ลบ"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
