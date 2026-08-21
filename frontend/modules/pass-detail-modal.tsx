import { useState } from "react";
import { renderSVG } from "uqr";
import {
  Modal, Group, Stack, Box, Text, Badge, Button,
  NumberInput, TextInput, Divider, ScrollArea,
} from "@mantine/core";
import { IconEdit, IconTrash, IconLink } from "@tabler/icons-react";
import type { Pass, LedgerEntry } from "../../backend/schema";
import { LedgerRow } from "../components/ledger-row";
import { sessionBadgeColor } from "../components/pass-ticket";

function QrCode({ url }: { url: string }) {
  return (
    <div
      style={{ width: 140, height: 140, borderRadius: 6, overflow: "hidden" }}
      dangerouslySetInnerHTML={{ __html: renderSVG(url, { pixelSize: 4 }) }}
    />
  );
}

type Props = {
  pass: Pass | null;
  usage: LedgerEntry[];
  quickAlkalomName: string;
  onQuickAlkalomNameChange: (v: string) => void;
  onClose: () => void;
  onTopup: (passId: string, sessions: number) => Promise<void>;
  onDeduct: (passId: string, sessions: number, note?: string) => Promise<void>;
  onQuickAlkalom: () => void;
  onEdit: (pass: Pass) => void;
  onDelete: (passId: string) => Promise<void>;
};

export function PassDetailModal({
  pass, usage, quickAlkalomName, onQuickAlkalomNameChange,
  onClose, onTopup, onDeduct, onQuickAlkalom, onEdit, onDelete,
}: Props) {
  const [inlineTopupCount, setInlineTopupCount] = useState(10);
  const [deductOpen, setDeductOpen] = useState(false);
  const [deductCount, setDeductCount] = useState(1);
  const [deductNote, setDeductNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeduct = async () => {
    if (!pass) return;
    await onDeduct(pass.id, deductCount, deductNote || undefined);
    setDeductOpen(false);
    setDeductCount(1);
    setDeductNote("");
  };

  const handleDelete = async () => {
    if (!pass) return;
    await onDelete(pass.id);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Modal opened={!!pass} onClose={onClose} title={pass?.child_name} size="55rem">
        {pass && (
          <Group align="stretch" gap="xl" wrap="nowrap">
            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
              <Box style={{
                background: "#f8f9ff", border: "1px solid #dde3f5",
                borderRadius: 10, padding: "14px 16px",
              }}>
                <Group justify="space-between" align="center" mb={10}>
                  <Text size="sm" fw={700} c="dimmed" tt="uppercase" lts="0.08em">Hátralévő alkalmak</Text>
                  <Badge
                    color={sessionBadgeColor(pass.remaining_sessions)}
                    variant="filled" size="xl" radius="sm"
                    style={{ fontSize: 20, padding: "4px 14px", minWidth: 48, textAlign: "center" }}
                  >
                    {pass.remaining_sessions}
                  </Badge>
                </Group>
                <Text size="xs" fw={600} c="dimmed" mb={6}>Feltöltés</Text>
                <Group gap="xs" mb={8}>
                  {[5, 10, 20].map(n => (
                    <Button key={n} size="xs" variant="light" onClick={() => onTopup(pass.id, n)}>
                      +{n}
                    </Button>
                  ))}
                  <NumberInput
                    size="xs" min={1} max={100} value={inlineTopupCount}
                    onChange={v => setInlineTopupCount(v as number)}
                    style={{ width: 70 }}
                  />
                  <Button size="xs" onClick={() => onTopup(pass.id, inlineTopupCount)}>
                    Feltölt
                  </Button>
                </Group>
                <Button
                  size="xs" color="red" variant="subtle" mt={4}
                  onClick={() => { setDeductCount(1); setDeductNote(""); setDeductOpen(true); }}
                >
                  Manuális levonás…
                </Button>
              </Box>

              <Divider my={2} label="Alkalom rögzítése" labelPosition="left" />

              <Group gap="xs">
                <TextInput
                  placeholder="Alkalom neve"
                  value={quickAlkalomName}
                  onChange={e => onQuickAlkalomNameChange(e.currentTarget.value)}
                  onKeyDown={e => e.key === "Enter" && onQuickAlkalom()}
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Button
                  size="sm"
                  disabled={!quickAlkalomName.trim() || pass.remaining_sessions === 0}
                  onClick={onQuickAlkalom}
                >
                  Rögzítés
                </Button>
              </Group>
              {pass.remaining_sessions === 0 && (
                <Text size="xs" c="red">Nincs több alkalom — tölts fel előbb.</Text>
              )}

              <Divider my={2} />

              <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>sz. {pass.child_birth_date}</Text>
              {pass.child_notes && (
                <Text size="sm" fs="italic" c="dimmed">{pass.child_notes}</Text>
              )}
              <Text size="sm" fw={600}>{pass.parent_name}</Text>
              <Text size="sm" c="dimmed">{pass.parent_email}</Text>
              <Text size="sm" c="dimmed">{pass.parent_phone}</Text>

              <Divider my={2} />

              <Group gap="md" align="flex-start">
                <QrCode url={`${window.location.origin}/pass/${pass.view_token}`} />
                <Stack gap={4} justify="center">
                  <Text size="xs" c="dimmed" lh={1.4}>Szülő ezt beolvasva<br />látja a bérlet állapotát.</Text>
                  <Button
                    size="xs" variant="subtle" color="gray" p={0}
                    leftSection={<IconLink size={12} />}
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/pass/${pass.view_token}`)}
                  >
                    Link másolása
                  </Button>
                </Stack>
              </Group>

              <Divider my={2} />

              <Group justify="space-between">
                <Button
                  variant="light"
                  leftSection={<IconEdit size={14} />}
                  onClick={() => { onClose(); onEdit(pass); }}
                >
                  Szerkesztés
                </Button>
                <Button
                  color="red" variant="light"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setConfirmDelete(true)}
                >
                  Törlés
                </Button>
              </Group>
            </Stack>

            <Box style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column" }}>
              <Text size="sm" fw={600} mb="xs" c="dimmed">Felhasználási napló</Text>
              <ScrollArea style={{ flex: 1 }}>
                {usage.length === 0 ? (
                  <Text size="sm" c="dimmed">Még nem volt bejegyzés.</Text>
                ) : (
                  <Stack gap={6}>
                    {usage.map((row, i) => <LedgerRow key={i} row={row} />)}
                  </Stack>
                )}
              </ScrollArea>
            </Box>
          </Group>
        )}
      </Modal>

      <Modal
        opened={deductOpen}
        onClose={() => setDeductOpen(false)}
        title="Manuális levonás"
        size="sm"
      >
        <Stack gap="md">
          <Box style={{ background: "#fff5f5", border: "1px solid #ffc9c9", borderRadius: 8, padding: "12px 14px" }}>
            <Text size="sm" fw={700} c="red" mb={4}>Figyelem — csak végszükség esetén!</Text>
            <Text size="sm" c="dimmed">Ez közvetlenül csökkenti az egyenleget, nem köthető edzéshez. A levonás naplózva lesz.</Text>
          </Box>
          <NumberInput
            label="Levonandó alkalmak száma"
            min={1}
            max={pass?.remaining_sessions ?? 100}
            value={deductCount}
            onChange={v => setDeductCount(v as number)}
          />
          <TextInput
            label="Indoklás (opcionális)"
            placeholder="pl. korrekció, dupla rögzítés…"
            value={deductNote}
            onChange={e => setDeductNote(e.currentTarget.value)}
          />
          <Text size="sm" c="dimmed">
            Hátralévő alkalmak: <strong>{pass?.remaining_sessions}</strong> → <strong style={{ color: "red" }}>{Math.max(0, (pass?.remaining_sessions ?? 0) - deductCount)}</strong>
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeductOpen(false)}>Mégse</Button>
            <Button color="red" onClick={handleDeduct} disabled={deductCount < 1}>
              Levonás megerősítése
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={confirmDelete} onClose={() => setConfirmDelete(false)} title="Törlés megerősítése" size="xs">
        <Stack>
          <Text>Biztosan törlöd <strong>{pass?.child_name}</strong> bérletét? Ez nem visszavonható.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmDelete(false)}>Mégse</Button>
            <Button color="red" onClick={handleDelete}>Törlés</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
