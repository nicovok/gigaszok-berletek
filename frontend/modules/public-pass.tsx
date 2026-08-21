import { useEffect, useState } from "react";
import { Center, Loader, Stack, Text, Box, Divider } from "@mantine/core";
import type { Pass, LedgerEntry } from "../../backend/schema";
import { PassTicket } from "../components/pass-ticket";
import { LedgerRow } from "../components/ledger-row";

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
            {ledger.map((row, i) => <LedgerRow key={i} row={row} />)}
          </Stack>
        </>
      )}
    </Box>
  );
}
