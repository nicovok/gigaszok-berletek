import { useState } from "react";
import { Modal, Stack, TextInput, Text, ScrollArea, Group, Checkbox, Box, Badge, Button } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { Pass } from "../../backend/schema";
import { sessionBadgeColor } from "../components/pass-ticket";

type Props = {
  opened: boolean;
  passes: Pass[];
  onClose: () => void;
  onSubmit: (name: string, passIds: string[]) => Promise<void>;
};

export function AlkalomModal({ opened, passes, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleClose = () => {
    setName("");
    setCheckedIds(new Set());
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || checkedIds.size === 0) return;
    await onSubmit(name.trim(), [...checkedIds]);
    setName("");
    setCheckedIds(new Set());
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Alkalom rögzítése" size="md">
      <Stack>
        <TextInput
          label="Alkalom neve" placeholder="pl. Haladó csoport"
          value={name}
          onChange={e => setName(e.currentTarget.value)}
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
                onClick={() => toggle(p.id)}
              >
                <Group gap={10}>
                  <Checkbox checked={checkedIds.has(p.id)} onChange={() => {}} readOnly />
                  <Box>
                    <Text fw={600} size="sm">{p.child_name}</Text>
                    <Text size="xs" c="dimmed">{p.parent_name}</Text>
                  </Box>
                </Group>
                <Badge color={sessionBadgeColor(p.remaining_sessions)} variant="light" size="sm">
                  {p.remaining_sessions} alk.
                </Badge>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || checkedIds.size === 0}
          leftSection={<IconCheck size={16} />}
          fullWidth
        >
          OK — {checkedIds.size} főtől levon 1 alkalmat
        </Button>
      </Stack>
    </Modal>
  );
}
