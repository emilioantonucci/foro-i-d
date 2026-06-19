import { Compass } from "lucide-react";
import Button from "@/components/ui/Button";
import FullState from "@/components/ui/FullState";

export default function NotFound() {
  return (
    <FullState
      icon={Compass}
      title="No encontramos eso"
      desc="El contenido que buscás no existe o fue movido. Puede que se haya archivado o que el enlace esté desactualizado."
    >
      <Button href="/radar">Volver al radar</Button>
    </FullState>
  );
}
