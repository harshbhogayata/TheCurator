/** Default left-panel brand for auth screens without a custom hero. */
export function AuthBrandPanel() {
  return (
    <div className="pointer-events-none flex w-full max-w-sm flex-col gap-3 text-center lg:text-left">
      <p className="font-[family-name:var(--font-headline)] text-lg italic text-on-surface-variant">
        The Curator
      </p>
      <h1 className="font-[family-name:var(--font-headline)] text-4xl italic leading-[1.12] tracking-tight text-on-surface lg:text-5xl">
        The World,
        <br />
        Distilled.
      </h1>
      <p className="text-base leading-relaxed text-on-surface-variant">
        Ten global perspectives, one essential narrative.
      </p>
    </div>
  );
}
