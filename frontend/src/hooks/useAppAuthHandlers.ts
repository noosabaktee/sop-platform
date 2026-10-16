import { useEffect } from "react";
import { api, csrf } from "../api/client";
import { useAuth } from "../app/AuthContext";
import type { GridBridge } from "../api/gridBridge";
import type { ModuleStateBridge } from "../api/moduleStateBridge";

export function useAppAuthHandlers(
  bridge: GridBridge | null,
  modules: ModuleStateBridge | null,
  setStatus: (status: string) => void,
  signedInRef: React.MutableRefObject<boolean>,
) {
  const { login, verifyTwoFactor, logout } = useAuth();

  useEffect(() => {
    const handleFormSubmit = (event: Event) => {
      const form = (event.target as HTMLElement).closest<HTMLFormElement>(
        '[data-form="login"],[data-form="forgot"],[data-form="2fa"]',
      );
      if (!form) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const button = form.querySelector<HTMLButtonElement>(
        'button[type="submit"]',
      );

      // 1. Two-Factor Authentication Submission
      if (form.dataset.form === "2fa") {
        const code = [
          ...form.querySelectorAll<HTMLInputElement>("[data-otp] input"),
        ]
          .map((input) => input.value)
          .join("");
        const error = form.querySelector<HTMLElement>('[data-err="otp"]');
        if (error) error.textContent = "";

        if (!/^\d{6}$/.test(code)) {
          if (error) error.textContent = "Masukkan 6 digit kode";
          return;
        }

        if (button) button.disabled = true;
        setStatus("Memverifikasi authenticator...");

        void verifyTwoFactor(code)
          .then(() => {
            signedInRef.current = true;
            sessionStorage.setItem("sop_authenticated", "1");
            location.hash = "#/my-workspace";
            window.location.reload();
          })
          .catch(() => {
            setStatus("");
            if (error) error.textContent = "Kode authenticator tidak valid.";
          })
          .finally(() => {
            if (button) button.disabled = false;
          });
        return;
      }

      // 2. Forgot Password Request
      if (form.dataset.form === "forgot") {
        const email =
          form.querySelector<HTMLInputElement>("#femail")?.value.trim() || "";
        const error = form.querySelector<HTMLElement>('[data-err="femail"]');
        if (error) error.textContent = "";

        if (!/^\S+@\S+\.\S+$/.test(email)) {
          if (error) error.textContent = "Masukkan email yang valid";
          return;
        }

        if (button) button.disabled = true;
        setStatus("Mengirim tautan reset...");

        void csrf()
          .then(() => api.post("/api/forgot-password", { email }))
          .then(() => {
            const root = form.closest<HTMLElement>('[data-page-id="login"]');
            root
              ?.querySelectorAll<HTMLElement>("[data-panel]")
              .forEach((panel) => {
                panel.hidden = panel.dataset.panel !== "done";
              });

            const tabs = root?.querySelector<HTMLElement>("[data-login-tabs]");
            if (tabs) tabs.style.display = "none";

            const title = root?.querySelector<HTMLElement>("[data-done-title]");
            if (title) title.textContent = "Tautan reset dikirim";

            const sub = root?.querySelector<HTMLElement>("[data-done-sub]");
            if (sub) {
              sub.textContent = `Jika ${email} terdaftar, periksa inbox untuk tautan yang berlaku 30 menit.`;
            }
          })
          .catch(() => {
            if (error) {
              error.textContent =
                "Tautan belum dapat dikirim. Periksa koneksi atau konfigurasi email.";
            }
          })
          .finally(() => {
            setStatus("");
            if (button) button.disabled = false;
          });
        return;
      }

      // 3. Standard Login Submission
      const email =
        form.querySelector<HTMLInputElement>("#email")?.value.trim() || "";
      const password =
        form.querySelector<HTMLInputElement>("#password")?.value || "";

      if (button) button.disabled = true;
      setStatus("Mengautentikasi akun...");

      void login(email, password)
        .then((requiresTwoFactor) => {
          if (requiresTwoFactor) {
            setStatus("");
            const root = form.closest<HTMLElement>('[data-page-id="login"]');
            root
              ?.querySelectorAll<HTMLElement>("[data-panel]")
              .forEach((panel) => {
                panel.hidden = panel.dataset.panel !== "2fa";
              });
            root
              ?.querySelector<HTMLInputElement>('[data-panel="2fa"] input')
              ?.focus();
            return;
          }

          signedInRef.current = true;
          sessionStorage.setItem("sop_authenticated", "1");
          location.hash = "#/my-workspace";
          window.location.reload();
        })
        .catch((err: unknown) => {
          setStatus("");
          const errObj = err as {
            response?: { status?: number; data?: { message?: string } };
            message?: string;
          };
          const code = errObj.response?.status;
          const message =
            code === 419
              ? "Sesi telah kedaluwarsa, silakan muat ulang halaman."
              : code === 422
                ? "Email atau password salah."
                : code === 423
                  ? "Akun terkunci sementara. Tunggu 15 menit atau reset password."
                  : code === 401
                    ? "Akses ditolak, periksa email/password Anda."
                    : code === 429
                      ? "Terlalu banyak percobaan login. Silakan tunggu beberapa saat."
                      : code === undefined
                        ? "Tidak dapat terhubung ke server. Pastikan layanan backend aktif."
                        : `Login gagal (${code}). Silakan hubungi administrator.`;

          const errEl = form.querySelector<HTMLElement>(
            '[data-err="password"]',
          );
          if (errEl) errEl.textContent = message;
          console.error("Login HTTP status:", code || "network error");
        })
        .finally(() => {
          if (button) button.disabled = false;
        });
    };

    const handleLogout = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile="logout"]')) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const persistOps = [
        bridge?.persistDirty() ?? Promise.resolve(),
        modules?.persist() ?? Promise.resolve(),
      ];

      void Promise.all(persistOps)
        .then(() => logout())
        .then(() => {
          signedInRef.current = false;
          sessionStorage.removeItem("sop_authenticated");
          location.hash = "#/login";
          window.location.reload();
        })
        .catch(() => {
          window.alert(
            "Logout di server gagal. Periksa koneksi backend lalu coba lagi.",
          );
        });
    };

    document.addEventListener("submit", handleFormSubmit, true);
    document.addEventListener("click", handleLogout, true);

    return () => {
      document.removeEventListener("submit", handleFormSubmit, true);
      document.removeEventListener("click", handleLogout, true);
    };
  }, [bridge, modules, login, verifyTwoFactor, logout, setStatus, signedInRef]);
}

export { useAppAuthHandlers as usePrototypeAuthHandlers };

