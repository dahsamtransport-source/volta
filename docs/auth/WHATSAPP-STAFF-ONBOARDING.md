# VOLTA staff authentication policy

## Initial rollout accounts

The initial administrator, supervisor, and sales-representative accounts are provisioned by a trusted administrator without phone OTP confirmation. They sign in using their assigned phone number and a strong temporary password. Temporary credentials must be delivered privately and changed on first sign-in. Never put credentials in source control, SQL seeds, browser code, APK assets, or logs.

The current connected session has no Supabase Auth Admin create/update-user action. Do not create rows directly in `auth.users`, do not set `phone_confirmed_at` using SQL, and do not bypass Auth through client-side code. Use the Supabase Auth Admin API from a protected server-side function or the Supabase Dashboard.

## All staff added after initial rollout

1. An administrator creates the Auth user and assigns trusted `app_metadata.field_sales_role` and, for representatives, `app_metadata.field_sales_representative_id`.
2. Leave the new phone unconfirmed until the employee verifies it.
3. The employee selects **دخول WhatsApp للموظفين** and requests a code.
4. The browser calls `signInWithOtp({ phone, options: { channel: "whatsapp", shouldCreateUser: false } })`.
5. The employee enters the six-digit code. The app verifies it with `verifyOtp({ phone, token, type: "sms" })`.
6. Supabase confirms the phone and creates the authenticated session. Accounts without an active role/profile remain blocked by the app's fail-closed access gate.

This intentionally disables public self-registration. An employee must be provisioned before the WhatsApp OTP can be requested.

## WhatsApp provider prerequisites

- Enable Phone authentication for the project.
- Configure Twilio or Twilio Verify as the phone provider.
- Enable the WhatsApp channel / approved WhatsApp template and set the supported WhatsApp content configuration in Supabase Auth.
- Configure appropriate Auth OTP rate limits, CAPTCHA, and expiry.
- Keep all provider credentials on the server/provider configuration; never in Vite environment variables, browser JavaScript, or Android code.

Supabase currently documents WhatsApp OTP channel support for Twilio and Twilio Verify. Other WhatsApp providers require a supported custom Send SMS Hook integration and must be separately implemented and configured.

## Current schema mapping and rollout blockers

The live `field_sales.user_profiles` constraint currently permits only `manager` and `representative`. The database helper `field_sales.is_manager()` returns true for every active `manager` profile, and multiple RLS policies use it to grant broad management access. Therefore, **never provision a supervisor as a database `manager`** merely because the application has a `supervisor` UI role. Client-side capability checks are not a substitute for RLS. Until a reviewed migration adds a separate `supervisor` profile and role-specific RLS policies, only the administrator may use the `manager` profile; supervisor onboarding remains blocked.

The live `representatives` table currently contains a representative row using phone `773934270`, which is also the requested supervisor phone. Resolve this identity conflict before assigning that number to a supervisor or creating another representative account. Do not overwrite or reassign the existing record automatically.
