import AcceptInviteForm from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <AcceptInviteForm
      tokenHash={params.token_hash}
      error={params.error}
    />
  );
}