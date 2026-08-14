import AdminApp from "../../components/AdminApp";
import { isAuthed } from "../../lib/auth";

export default async function Page() {
  return <AdminApp authed={await isAuthed()} />;
}
