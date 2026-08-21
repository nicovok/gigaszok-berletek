import { Group, Stack, Text, Badge } from "@mantine/core";
import type { LedgerEntry } from "../../backend/schema";

export function LedgerRow({ row }: { row: LedgerEntry }) {
  const isTopup = row.type === "topup";
  return (
    <Group justify="space-between" wrap="nowrap" gap="xs" style={{
      padding: "6px 8px", borderRadius: 6,
      background: isTopup ? "#f0faf0" : "#fafafa",
      border: `1px solid ${isTopup ? "#c3e6cb" : "#eee"}`,
    }}>
      <Group gap={8} style={{ flex: 1, minWidth: 0 }}>
        <Text size="xs" fw={700} c={isTopup ? "green" : "red"} style={{ minWidth: 24, textAlign: "right" }}>
          {row.change > 0 ? `+${row.change}` : row.change}
        </Text>
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" lineClamp={1}>{row.label}</Text>
          <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
            {new Date(row.timestamp).toLocaleString("hu-HU")}
          </Text>
        </Stack>
      </Group>
      <Badge size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>{row.balance_after} alk.</Badge>
    </Group>
  );
}
