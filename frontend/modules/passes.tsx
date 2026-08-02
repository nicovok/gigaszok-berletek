import { useState } from "react";
import { renderSVG } from "uqr";
import {
  SimpleGrid, Box, Text, Group, Button, Modal, Stack,
  TextInput, Textarea, NumberInput, Checkbox,
  ScrollArea, Divider, Badge,
} from "@mantine/core";
import { IconPlus, IconEdit, IconTrash, IconCheck, IconLink, IconSearch } from "@tabler/icons-react";
import type { Pass } from "../../backend/schema";
import { PassTicket } from "../components/pass-ticket";
import { usePasses } from "../hooks/use-passes";
import { usePassDetail } from "../hooks/use-pass-detail";

function QrCode({ url }: { url: string }) {
  return (
    <div
      style={{ width: 140, height: 140, borderRadius: 6, overflow: "hidden" }}
      dangerouslySetInnerHTML={{ __html: renderSVG(url, { pixelSize: 4 }) }}
    />
  );
}

const emptyForm = {
  child_name: "", child_birth_date: "", child_notes: "",
  parent_name: "", parent_email: "", parent_phone: "",
  remaining_sessions: 0,
};

export default function Passes({ token }: { token: string }) {
  const { passes, setPasses, load, api } = usePasses(token);
  const {
    detailPass, detailUsage, quickAlkalomName, setQuickAlkalomName,
    openDetail, refreshDetail, closeDetail, handleQuickAlkalom,
  } = usePassDetail(token, setPasses);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pass | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [inlineTopupCount, setInlineTopupCount] = useState(10);
  const [deductOpen, setDeductOpen] = useState(false);
  const [deductCount, setDeductCount] = useState(1);
  const [deductNote, setDeductNote] = useState("");
  const [deletePass, setDeletePass] = useState<Pass | null>(null);
  const [alkalomOpen, setAlkalomOpen] = useState(false);
  const [alkalomName, setAlkalomName] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const openNew = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (p: Pass) => {
    setEditing(p);
    setForm({
      child_name: p.child_name, child_birth_date: p.child_birth_date, child_notes: p.child_notes ?? "",
      parent_name: p.parent_name, parent_email: p.parent_email, parent_phone: p.parent_phone,
      remaining_sessions: p.remaining_sessions,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (editing) await api.put(`/api/passes/${editing.id}`, form);
    else await api.post("/api/passes", form);
    setFormOpen(false);
    load();
  };

  const handleDeduct = async () => {
    if (!detailPass) return;
    await api.post(`/api/passes/${detailPass.id}/deduct`, { sessions: deductCount, note: deductNote || undefined });
    setDeductOpen(false);
    setDeductCount(1);
    setDeductNote("");
    await refreshDetail(detailPass.id);
    load();
  };

  const handleTopup = async (passId: string, sessions: number) => {
    await api.post(`/api/passes/${passId}/topup`, { sessions });
    await refreshDetail(passId);
    load();
  };

  const handleDelete = async () => {
    if (!deletePass) return;
    await api.del(`/api/passes/${deletePass.id}`);
    setDeletePass(null);
    closeDetail();
    load();
  };

  const handleAlkalom = async () => {
    if (!alkalomName.trim() || checkedIds.size === 0) return;
    await api.post("/api/sessions", { name: alkalomName.trim(), pass_ids: [...checkedIds] });
    setAlkalomOpen(false);
    setAlkalomName("");
    setCheckedIds(new Set());
    load();
  };

  const openAlkalom = () => { setCheckedIds(new Set()); setAlkalomName(""); setAlkalomOpen(true); };

  const toggleCheck = (id: string) =>
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const field = (key: keyof typeof emptyForm) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.currentTarget.value;
      setForm(f => ({ ...f, [key]: value }));
    },
  });

  return (
    <>
      <Group mb="lg" justify="space-between">
        <TextInput
          placeholder="Keresés név alapján…"
          leftSection={<IconSearch size={15} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 320 }}
        />
        <Group gap="xs">
          <Button onClick={openNew} leftSection={<IconPlus size={16} />}>Új bérletes</Button>
          <Button onClick={openAlkalom} leftSection={<IconCheck size={16} />} variant="light">Alkalom</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {passes.filter(p => p.child_name.toLowerCase().includes(search.toLowerCase())).map(p => (
          <PassTicket key={p.id} pass={p} onClick={() => openDetail(p)} />
        ))}
      </SimpleGrid>

      {/* Detail modal */}
      <Modal opened={!!detailPass} onClose={closeDetail} title={detailPass?.child_name} size="55rem">
        {detailPass && (
          <Group align="stretch" gap="xl" wrap="nowrap">
            {/* Left: pass info */}
            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
              {/* Feltöltés — leggyakrabban használt, legfelül */}
              <Box style={{
                background: "#f8f9ff", border: "1px solid #dde3f5",
                borderRadius: 10, padding: "14px 16px",
              }}>
                <Group justify="space-between" align="center" mb={10}>
                  <Text size="sm" fw={700} c="dimmed" tt="uppercase" lts="0.08em">Hátralévő alkalmak</Text>
                  <Badge
                    color={detailPass.remaining_sessions === 0 ? "red" : detailPass.remaining_sessions <= 3 ? "orange" : "blue"}
                    variant="filled" size="xl" radius="sm"
                    style={{ fontSize: 20, padding: "4px 14px", minWidth: 48, textAlign: "center" }}
                  >
                    {detailPass.remaining_sessions}
                  </Badge>
                </Group>
                <Text size="xs" fw={600} c="dimmed" mb={6}>Feltöltés</Text>
                <Group gap="xs" mb={8}>
                  {[5, 10, 20].map(n => (
                    <Button key={n} size="xs" variant="light" onClick={() => handleTopup(detailPass.id, n)}>
                      +{n}
                    </Button>
                  ))}
                  <NumberInput
                    size="xs" min={1} max={100} value={inlineTopupCount}
                    onChange={v => setInlineTopupCount(v as number)}
                    style={{ width: 70 }}
                  />
                  <Button size="xs" onClick={() => handleTopup(detailPass.id, inlineTopupCount)}>
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
                  onChange={e => setQuickAlkalomName(e.currentTarget.value)}
                  onKeyDown={e => e.key === "Enter" && handleQuickAlkalom()}
                  style={{ flex: 1 }}
                  size="sm"
                />
                <Button
                  size="sm"
                  disabled={!quickAlkalomName.trim() || detailPass.remaining_sessions === 0}
                  onClick={handleQuickAlkalom}
                >
                  Rögzítés
                </Button>
              </Group>
              {detailPass.remaining_sessions === 0 && (
                <Text size="xs" c="red">Nincs több alkalom — tölts fel előbb.</Text>
              )}

              <Divider my={2} />

              <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>sz. {detailPass.child_birth_date}</Text>
              {detailPass.child_notes && (
                <Text size="sm" fs="italic" c="dimmed">{detailPass.child_notes}</Text>
              )}
              <Text size="sm" fw={600}>{detailPass.parent_name}</Text>
              <Text size="sm" c="dimmed">{detailPass.parent_email}</Text>
              <Text size="sm" c="dimmed">{detailPass.parent_phone}</Text>

              <Divider my={2} />

              <Group gap="md" align="flex-start">
                <QrCode url={`${window.location.origin}/pass/${detailPass.view_token}`} />
                <Stack gap={4} justify="center">
                  <Text size="xs" c="dimmed" lh={1.4}>Szülő ezt beolvasva<br />látja a bérlet állapotát.</Text>
                  <Button
                    size="xs" variant="subtle" color="gray" p={0}
                    leftSection={<IconLink size={12} />}
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/pass/${detailPass.view_token}`)}
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
                  onClick={() => { const p = detailPass; closeDetail(); openEdit(p); }}
                >
                  Szerkesztés
                </Button>
                <Button
                  color="red" variant="light"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setDeletePass(detailPass)}
                >
                  Törlés
                </Button>
              </Group>
            </Stack>

            {/* Right: usage log */}
            <Box style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column" }}>
              <Text size="sm" fw={600} mb="xs" c="dimmed">Felhasználási napló</Text>
              <ScrollArea style={{ flex: 1 }}>
                {detailUsage.length === 0 ? (
                  <Text size="sm" c="dimmed">Még nem volt bejegyzés.</Text>
                ) : (
                  <Stack gap={6}>
                    {detailUsage.map((row, i) => (
                      <Group key={i} justify="space-between" wrap="nowrap" gap="xs" style={{
                        padding: "6px 8px", borderRadius: 6,
                        background: row.type === "topup" ? "#f0faf0" : "#fafafa",
                        border: `1px solid ${row.type === "topup" ? "#c3e6cb" : "#eee"}`,
                      }}>
                        <Group gap={8} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="xs" fw={700} c={row.type === "topup" ? "green" : "red"} style={{ minWidth: 24, textAlign: "right" }}>
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
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Box>
          </Group>
        )}
      </Modal>

      {/* Alkalom modal */}
      <Modal opened={alkalomOpen} onClose={() => setAlkalomOpen(false)} title="Alkalom rögzítése" size="md">
        <Stack>
          <TextInput
            label="Alkalom neve" placeholder="pl. Haladó csoport"
            value={alkalomName}
            onChange={e => setAlkalomName(e.currentTarget.value)}
          />
          <Text size="sm" fw={500} mt="xs">Kik voltak jelen?</Text>
          <ScrollArea h={320}>
            <Stack gap="xs">
              {passes.map(p => (
                <Group
                  key={p.id}
                  justify="space-between"
                  p="xs"
                  style={{
                    borderRadius: 6, cursor: "pointer",
                    background: checkedIds.has(p.id) ? "#f0f4ff" : "#fafafa",
                    border: `1px solid ${checkedIds.has(p.id) ? "#c0cef0" : "#e8e4de"}`,
                  }}
                  onClick={() => toggleCheck(p.id)}
                >
                  <Group gap={10}>
                    <Checkbox checked={checkedIds.has(p.id)} onChange={() => {}} readOnly />
                    <Box>
                      <Text fw={600} size="sm">{p.child_name}</Text>
                      <Text size="xs" c="dimmed">{p.parent_name}</Text>
                    </Box>
                  </Group>
                  <Badge
                    color={p.remaining_sessions === 0 ? "red" : p.remaining_sessions <= 3 ? "orange" : "blue"}
                    variant="light" size="sm"
                  >
                    {p.remaining_sessions} alk.
                  </Badge>
                </Group>
              ))}
            </Stack>
          </ScrollArea>
          <Button
            onClick={handleAlkalom}
            disabled={!alkalomName.trim() || checkedIds.size === 0}
            leftSection={<IconCheck size={16} />}
            fullWidth
          >
            OK — {checkedIds.size} főtől levon 1 alkalmat
          </Button>
        </Stack>
      </Modal>

      {/* Manual deduct confirm modal */}
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
            max={detailPass?.remaining_sessions ?? 100}
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
            Hátralévő alkalmak: <strong>{detailPass?.remaining_sessions}</strong> → <strong style={{ color: "red" }}>{Math.max(0, (detailPass?.remaining_sessions ?? 0) - deductCount)}</strong>
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeductOpen(false)}>Mégse</Button>
            <Button color="red" onClick={handleDeduct} disabled={deductCount < 1}>
              Levonás megerősítése
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete confirm modal */}
      <Modal opened={!!deletePass} onClose={() => setDeletePass(null)} title="Törlés megerősítése" size="xs">
        <Stack>
          <Text>Biztosan törlöd <strong>{deletePass?.child_name}</strong> bérletét? Ez nem visszavonható.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeletePass(null)}>Mégse</Button>
            <Button color="red" onClick={handleDelete}>Törlés</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Create / Edit modal */}
      <Modal opened={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Szerkesztés" : "Új bérletes"} size="md">
        <Stack gap="sm">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts="0.1em">Gyermek</Text>
          <TextInput label="Név" required {...field("child_name")} />
          <TextInput label="Születési dátum" placeholder="ÉÉÉÉ-HH-NN" required {...field("child_birth_date")} />
          <Textarea label="Megjegyzés" rows={2} {...field("child_notes")} />
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts="0.1em" mt="xs">Szülő</Text>
          <TextInput label="Név" required {...field("parent_name")} />
          <TextInput label="Email" type="email" required {...field("parent_email")} />
          <TextInput label="Telefon" required {...field("parent_phone")} />
          <NumberInput
            label="Kezdeti alkalmak" value={form.remaining_sessions} mt="xs"
            onChange={v => setForm(f => ({ ...f, remaining_sessions: v as number }))} min={0}
          />
          <Button onClick={handleSave} fullWidth mt="xs">{editing ? "Mentés" : "Hozzáadás"}</Button>
        </Stack>
      </Modal>
    </>
  );
}
