// Renders the ID card front + back by overlaying member data on the stored
// templates. Templates are 1023×1537 (≈2:3). We render at a fixed pixel size
// so html2canvas + jspdf produce a predictable, sharp PDF.
import { forwardRef } from "react";
import type { Database } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";

type Member = Database["public"]["Tables"]["members"]["Row"];

// Base card dimensions (screen). PDF is rendered at scale 2.5 → ~1050×1575.
export const CARD_W = 420;
export const CARD_H = 630;

const valueStyle: React.CSSProperties = {
  fontFamily: '"Tiro Tamil", serif',
  fontWeight: 400,
  color: "#0f3d1a",
};

function fmtDate(iso: string) {
  try {
    return format(parseISO(iso), "dd.MM.yyyy");
  } catch {
    return iso;
  }
}

export const IdCardFront = forwardRef<HTMLDivElement, { member: Member; templateUrl: string }>(
  function IdCardFront({ member, templateUrl }, ref) {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl shadow-card"
        style={{ width: CARD_W, height: CARD_H, backgroundColor: "#fff" }}
      >
        <img
          src={templateUrl}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        {/* Photo circle — center 51% / 38%, diameter ~30% of width */}
        <img
          src={member.photo_url}
          alt={member.name}
          crossOrigin="anonymous"
          className="absolute object-cover"
          style={{
            width: "30%",
            height: "20%",
            left: "36%",
            top: "28%",
            borderRadius: "50%",
          }}
        />
        {/* Value column — x ≈ 42% (after the colon) */}
        <div
          className="absolute"
          style={{ left: "42%", top: "65%", width: "55%", ...valueStyle }}
        >
          <Row text={member.name} />
          <Row text={member.position} />
          <Row text={fmtDate(member.dob)} />
          <Row text={member.member_no} />
          <Row text={member.mobile} />
        </div>
      </div>
    );
  },
);

export const IdCardBack = forwardRef<HTMLDivElement, { member: Member; templateUrl: string }>(
  function IdCardBack({ member, templateUrl }, ref) {
    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl shadow-card"
        style={{ width: CARD_W, height: CARD_H, backgroundColor: "#fff" }}
      >
        <img
          src={templateUrl}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
        />
        {/* Value column starts ~46% across, top ~23% */}
        <div
          className="absolute"
          style={{ left: "46%", top: "22.5%", width: "50%", ...valueStyle }}
        >
          <RowBack text={member.blood_group} />
          <RowBack text={member.license_no} />
          <RowBack text={fmtDate(member.renewal_date)} />
          <RowBack text={member.auto_stand} />
          <RowBack text={member.emergency_mobile} />
          <RowBack text={member.father_name} />
          <RowBack text={member.address} multiline />
        </div>
      </div>
    );
  },
);

function Row({ text }: { text: string }) {
  return (
    <div
      style={{
        height: "5.5%",
        fontSize: 12,
        lineHeight: "1.1",
        marginBottom: "0.6%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {text}
    </div>
  );
}

function RowBack({ text, multiline }: { text: string; multiline?: boolean }) {
  return (
    <div
      style={{
        minHeight: "5.2%",
        fontSize: 11,
        lineHeight: "1.2",
        marginBottom: "1.6%",
        whiteSpace: multiline ? "normal" : "nowrap",
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
}
