import EmailSignUp from "@/components/auth/email-sign-up";
import { getIsFirstUser } from "lib/auth/server";

// Force dynamic rendering to avoid database queries during static generation
export const dynamic = "force-dynamic";

export default async function EmailSignUpPage() {
  const isFirstUser = await getIsFirstUser();
  return <EmailSignUp isFirstUser={isFirstUser} />;
}
