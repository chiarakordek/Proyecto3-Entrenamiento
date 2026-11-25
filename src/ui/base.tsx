import clsx from 'clsx';
import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { X } from 'lucide-react';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';

export const Boton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamano?: 'md' | 'lg' | 'sm'; icono?: ReactNode }
>(function Boton({ variante = 'primario', tamano = 'md', icono, className, children, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        tamano === 'lg' && 'min-h-14 px-6 text-lg',
        tamano === 'md' && 'min-h-11 px-4 text-base',
        tamano === 'sm' && 'min-h-9 px-3 text-sm',
        variante === 'primario' && 'bg-goma text-white hover:bg-goma-700',
        variante === 'secundario' && 'border border-goma/40 bg-white text-goma hover:bg-tiza-200',
        variante === 'fantasma' && 'text-tinta-suave hover:bg-tiza-200 hover:text-tinta',
        variante === 'peligro' && 'border border-peligro/40 bg-white text-peligro hover:bg-peligro-claro',
        className,
      )}
      {...props}
    >
      {icono}
      {children}
    </button>
  );
});

interface PropsCampo {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  className?: string;
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode;
}

export function Campo({ etiqueta, error, ayuda, className, children }: PropsCampo) {
  const id = useId();
  const idDesc = `${id}-desc`;
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {etiqueta}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || ayuda ? idDesc : undefined })}
      {(error || ayuda) && (
        <p id={idDesc} className={clsx('text-sm', error ? 'text-peligro' : 'text-tinta-suave')}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}

const claseEntrada =
  'w-full rounded-xl border border-tiza-300 bg-white px-3.5 py-2.5 text-base text-tinta placeholder:text-tinta-suave/60 focus:border-goma focus:outline-none focus:ring-2 focus:ring-goma/20 aria-[invalid]:border-peligro';

export const Entrada = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Entrada(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={clsx(claseEntrada, className)} {...props} />;
});

export function Area({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(claseEntrada, 'min-h-24 resize-y', className)} {...props} />;
}

export function Selector({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(claseEntrada, 'appearance-none bg-[length:1rem] pr-9', className)} {...props}>
      {children}
    </select>
  );
}

export function Vacio({ titulo, children, accion }: { titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-tiza-300 bg-white/60 px-6 py-10 text-center">
      <p className="display text-lg">{titulo}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-tinta-suave">{children}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Errores({ errores }: { errores: { mensaje: string }[] }) {
  if (!errores.length) return null;
  return (
    <div role="alert" className="rounded-xl border border-peligro/30 bg-peligro-claro px-4 py-3 text-sm text-peligro-oscuro">
      {errores.length === 1 ? (
        errores[0].mensaje
      ) : (
        <ul className="list-disc space-y-0.5 pl-4">
          {errores.map((e, i) => (
            <li key={i}>{e.mensaje}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Diálogo modal nativo (<dialog>): foco atrapado y Escape de serie. */
export function Dialogo({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = 'max-w-lg',
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal?.();
    if (!abierto && d.open) d.close?.();
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onCancel={onCerrar}
      aria-label={titulo}
      className={clsx(
        'w-[calc(100%-2rem)] rounded-2xl border-0 bg-white p-0 text-tinta shadow-hoja backdrop:bg-goma/50',
        ancho,
      )}
    >
      {abierto && (
        <div className="aparecer">
          <div className="flex items-start justify-between gap-4 border-b border-tiza-200 px-5 py-4">
            <h2 className="text-xl">{titulo}</h2>
            <button onClick={onCerrar} className="rounded-lg p-1 text-tinta-suave hover:bg-tiza" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
