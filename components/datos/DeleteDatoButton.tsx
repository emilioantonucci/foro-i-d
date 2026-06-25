"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDatoAction } from "@/app/(app)/actions";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/** Visible only to the dato's author or an admin/mod. Confirms before deleting;
 *  the action redirects to /datos on success. */
export default function DeleteDatoButton({ datoId }: { datoId: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("¿Eliminar este dato? Se borran también sus comentarios y me gusta.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteDatoAction(datoId);
      // On success the action redirects; only errors return here.
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      loading={pending}
      icon={!pending ? <Trash2 size={15} aria-hidden="true" /> : undefined}
    >
      Eliminar
    </Button>
  );
}
