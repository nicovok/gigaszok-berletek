import { useEffect, useState } from "react";
import { Center, Loader, Stack, Text, Group, Box, Divider, Badge } from "@mantine/core";
import type { Pass, LedgerEntry } from "../../backend/schema";
import { PassTicket } from "../components/pass-ticket";

export default function PublicPass({ viewToken }: { viewToken: string }) {
  const [pass, setPass] = useState<Pass | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/pass-view/${viewToken}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(data => { if (data) { setPass(data.pass); setLedger(data.ledger); } setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [viewToken]);

  if (loading) return <Center h="100vh"><Loader /></Center>;
  if (notFound || !pass) return (
    <Center h="100vh"><Text c="dimmed">Bérletes nem található.</Text></Center>
  );

  return (
    <Box maw={480} mx="auto" px="md" py="xl">
      <PassTicket pass={pass} />

      {ledger.length > 0 && (
        <>
          <Divider my="xl" label="Felhasználási napló" labelPosition="left" />
          <Stack gap={6}>
            {ledger.map((row, i) => (
              <Group key={i} justify="space-between" wrap="nowrap" gap="xs" style={{
                padding: "6px 8px", borderRadius: 6,
                background: row.type === "topup" ? "#f0faf0" : "#fafafa",
                border: `1px solid ${row.type === "topup" ? "#c3e6cb" : "#eee"}`,
              }}>
                <Group gap={8} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" fw={700} c={row.type === "topup" ? "green" : "red"}
                    style={{ minWidth: 24, textAlign: "right" }}>
                    {row.change > 0 ? `+${row.change}` : row.change}
                  </Text>
                  <Text size="sm" style={{ flex: 1 }} lineClamp={1}>{row.label}</Text>
                </Group>
                <Group gap={8} style={{ flexShrink: 0 }}>
                  <Badge size="xs" variant="outline" color="gray">{row.balance_after} alk.</Badge>
                  <Text size="xs" c="dimmed" style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {new Date(row.timestamp).toLocaleString("hu-HU")}
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}
