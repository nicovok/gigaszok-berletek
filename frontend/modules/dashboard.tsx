import { AppShell, Group, Title, Button, Image, Avatar, Text, UnstyledButton } from "@mantine/core";
import Passes from "./passes";
import logo from "../logo.png";

type User = { name: string; email: string; picture?: string };

export default function Dashboard({ token, user, onLogout }: { token: string; user: User; onLogout: () => void }) {
  const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Image src={logo} h={40} w={40} fit="contain" />
            <Title order={3}>Berletek</Title>
          </Group>
          <Group gap="sm">
            <UnstyledButton
              onClick={() => window.open("https://auth.nicoprt.xyz", "_blank")}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Avatar size="sm" radius="xl" color="blue" src={user.picture ?? undefined}>{initials}</Avatar>
              <Text size="sm" fw={500} visibleFrom="sm">{user.name}</Text>
            </UnstyledButton>
            <Button variant="subtle" color="gray" size="xs" onClick={onLogout}>Kilépés</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main maw={1100} mx="auto">
        <Passes token={token} />
      </AppShell.Main>
    </AppShell>
  );
}
