import { useMemo, useRef, useState } from "react";
import { useStudio } from "../store/useStudio";
import { assetsFromFiles, imageUrl } from "../core/assets/imageStore";
import { imageFilenamesForPage } from "../types/project";
import { useT } from "../i18n/strings";

export default function AssetManager() {
  const project = useStudio((s) => s.project);
  const images = useStudio((s) => s.images);
  const addImages = useStudio((s) => s.addImages);
  const removeImage = useStudio((s) => s.removeImage);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState("");
  const t = useT();

  const usedFilenames = useMemo(() => {
    const used = new Set<string>();
    if (project) {
      for (const page of project.pages) for (const f of imageFilenamesForPage(page)) used.add(f);
      if (project.assets.coverImage) used.add(project.assets.coverImage);
    }
    return used;
  }, [project]);

  async function handleFiles(files: Iterable<File>) {
    const outcome = await assetsFromFiles(files, images);
    await addImages(outcome.added);
    const notes: string[] = [];
    if (outcome.added.length) notes.push(t("imagesAdded", { n: outcome.added.length }));
    if (outcome.duplicates.length) notes.push(t("imagesReplaced", { n: outcome.duplicates.length }));
    if (outcome.skipped.length)
      notes.push(t("imagesSkipped", { names: outcome.skipped.slice(0, 4).join(", ") + (outcome.skipped.length > 4 ? "…" : "") }));
    setNotice(notes.join(" "));
  }

  const sorted = [...images.values()].sort((a, b) => a.filename.localeCompare(b.filename));

  return (
    <div className="p-4">
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-amber-700 bg-amber-50" : "border-stone-300 hover:border-stone-400"
        }`}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-medium text-stone-600">{t("dropImages")}</p>
        <p className="text-[11px] text-stone-400 mt-1">
          {t("dropImagesHint")}
          <br />
          {t("namingExample")}
        </p>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {notice && <p className="text-[11px] text-stone-500 mt-2">{notice}</p>}

      <div className="mt-4">
        <div className="panel-title mb-2">
          {t("uploadedN", { n: images.size })}
        </div>
        {sorted.length === 0 && <p className="text-xs text-stone-400">{t("noImagesYet")}</p>}
        <ul className="grid grid-cols-2 gap-2">
          {sorted.map((asset) => {
            const used = usedFilenames.has(asset.filename);
            return (
              <li key={asset.filename} className="rounded-md border border-stone-200 overflow-hidden group">
                <div className="aspect-[4/3] bg-stone-100">
                  <img
                    src={imageUrl(asset)}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="px-2 py-1.5">
                  <div className="text-[10px] font-mono text-stone-600 truncate" title={asset.filename}>
                    {asset.filename}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide ${
                        used ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {used ? t("inUse") : t("unused")}
                    </span>
                    <button
                      className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                      aria-label={`${asset.filename} verwijderen`}
                      onClick={() => void removeImage(asset.filename)}
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
