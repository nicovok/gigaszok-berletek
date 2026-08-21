import { Box, Text, Group } from "@mantine/core";
import type { Pass } from "../../backend/schema";

export const PAGE_BG = "#d4cbbf";
const NOTCH_BORDER = "#b8ac9c";

export function sessionBadgeColor(n: number): "red" | "orange" | "blue" {
  if (n === 0) return "red";
  if (n <= 3) return "orange";
  return "blue";
}

export function stubColor(n: number) {
  if (n === 0) return { bg: "#8b1a2a", stripe: "rgba(0,0,0,0.12)" };
  if (n <= 3)  return { bg: "#9c4d10", stripe: "rgba(0,0,0,0.10)" };
  return          { bg: "#1e3d6b", stripe: "rgba(255,255,255,0.04)" };
}

export function PassTicket({ pass, onClick }: { pass: Pass; onClick?: () => void }) {
  const { bg, stripe } = stubColor(pass.remaining_sessions);

  return (
    <Box
      onClick={onClick}
      style={{ position: "relative", padding: "10px 0", cursor: onClick ? "pointer" : "default" }}
    >
      {["top", "bottom"].map(pos => (
        <Box key={pos} style={{
          position: "absolute", [pos]: 0, left: "calc(72% - 11px)",
          width: 22, height: 22, borderRadius: "50%",
          background: PAGE_BG, border: `1px solid ${NOTCH_BORDER}`, zIndex: 10,
        }} />
      ))}

      <Box style={{
        display: "flex", borderRadius: 6, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)", border: "1px solid #ddd8d0",
        transition: "box-shadow 0.15s ease",
      }}>
        <Box style={{ flex: 1, background: "#ffffff", padding: "18px 20px 16px" }}>
          <Group gap={8} mb={14}>
            {[0, 1].map(i => (
              <Box key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#d0ccc8", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
              }} />
            ))}
          </Group>

          <Text style={{
            fontSize: 21, fontWeight: 700, color: "#1a2840",
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "-0.01em", lineHeight: 1.2,
          }}>
            {pass.child_name}
          </Text>
          <Text style={{
            fontSize: 11, color: "#8a7860", marginTop: 3,
            fontFamily: "'Courier New', Courier, monospace", letterSpacing: "0.06em",
          }}>
            sz. {pass.child_birth_date}
          </Text>
          {pass.child_notes && (
            <Text style={{ fontSize: 11, color: "#9a8468", marginTop: 4, fontStyle: "italic" }}>
              {pass.child_notes}
            </Text>
          )}

          <Box style={{ margin: "14px 0 12px", borderTop: "1.5px dashed #d8d0c8" }} />

          <Text style={{ fontSize: 13, fontWeight: 600, color: "#2a3a50" }}>{pass.parent_name}</Text>
          <Text style={{ fontSize: 11, color: "#7a6c58", marginTop: 2 }}>{pass.parent_email}</Text>
          <Text style={{ fontSize: 11, color: "#7a6c58" }}>{pass.parent_phone}</Text>
        </Box>

        <Box style={{
          width: 1, flexShrink: 0,
          background: "repeating-linear-gradient(to bottom, #c4b080 0px, #c4b080 5px, transparent 5px, transparent 11px)",
        }} />

        <Box style={{
          width: 108, flexShrink: 0,
          background: bg,
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${stripe} 8px, ${stripe} 16px)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "16px 8px",
        }}>
          <Text style={{
            fontSize: 52, fontWeight: 900, color: "white",
            fontFamily: "Georgia, serif", lineHeight: 1,
          }}>
            {pass.remaining_sessions}
          </Text>
          <Text style={{
            fontSize: 9, color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3,
          }}>
            alkalom
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
