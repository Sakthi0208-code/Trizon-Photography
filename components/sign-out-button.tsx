export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="w-full text-left"
      >
        Sign out
      </button>
    </form>
  );
}