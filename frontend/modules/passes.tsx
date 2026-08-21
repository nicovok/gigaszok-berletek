import { useState, useMemo } from "react";
import {
  SimpleGrid, Group, Button, Modal, Stack,
  TextInput, Textarea, NumberInput, Text,
} from "@mantine/core";
import { IconPlus, IconCheck, IconSearch } from "@tabler/icons-react";
import type { Pass } from "../../backend/schema";
import { PassTicket } from "../components/pass-ticket";
import { usePasses } from "../hooks/use-passes";
import { usePassDetail } from "../hooks/use-pass-detail";
import { PassDetailModal } from "./pass-detail-modal";
import { AlkalomModal } from "./alkalom-modal";

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
  const [alkalomOpen, setAlkalomOpen] = useState(false);

  const filteredPasses = useMemo(
    () => passes.filter(p => p.child_name.toLowerCase().includes(search.toLowerCase())),
    [passes, search],
  );

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

  const handleTopup = async (passId: string, sessions: number) => {
    await api.post(`/api/passes/${passId}/topup`, { sessions });
    await refreshDetail(passId);
    load();
  };

  const handleDeduct = async (passId: string, sessions: number, note?: string) => {
    await api.post(`/api/passes/${passId}/deduct`, { sessions, note });
    await refreshDetail(passId);
    load();
  };

  const handleDelete = async (passId: string) => {
    await api.del(`/api/passes/${passId}`);
    load();
  };

  const handleAlkalom = async (name: string, passIds: string[]) => {
    await api.post("/api/sessions", { name, pass_ids: passIds });
    load();
  };

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
          <Button onClick={() => setAlkalomOpen(true)} leftSection={<IconCheck size={16} />} variant="light">Alkalom</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {filteredPasses.map(p => (
          <PassTicket key={p.id} pass={p} onClick={() => openDetail(p)} />
        ))}
      </SimpleGrid>

      <PassDetailModal
        pass={detailPass}
        usage={detailUsage}
        quickAlkalomName={quickAlkalomName}
        onQuickAlkalomNameChange={setQuickAlkalomName}
        onClose={closeDetail}
        onTopup={handleTopup}
        onDeduct={handleDeduct}
        onDelete={handleDelete}
        onEdit={p => { closeDetail(); openEdit(p); }}
        onQuickAlkalom={handleQuickAlkalom}
      />

      <AlkalomModal
        opened={alkalomOpen}
        passes={passes}
        onClose={() => setAlkalomOpen(false)}
        onSubmit={async (name, passIds) => { await handleAlkalom(name, passIds); setAlkalomOpen(false); }}
      />

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
