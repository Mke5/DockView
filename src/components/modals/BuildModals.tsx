import { useState } from "react";
import { Modal, ModalField, ModalInput, ModalToggleRow } from "../Modal";
import { Button } from "../Button";
import { Hammer, FileCode, Info } from "lucide-react";

export function NewBuildModal({
  onClose,
  onBuild,
}: {
  onClose: () => void;
  onBuild: (data: any) => void;
}) {
  const [imageName, setImageName] = useState("");
  const [tag, setTag] = useState("latest");
  const [dockerfile, setDockerfile] = useState("Dockerfile");
  const [useCache, setUseCache] = useState(true);

  return (
    <Modal title="Initialize Build Sequence" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand/5 border border-brand/20 shadow-sm animate-in fade-in duration-500">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-brand border border-brand/20 shadow-sm">
                <Hammer size={24} />
            </div>
            <div>
                <h3 className="text-[14px] font-black text-text-primary uppercase tracking-tight leading-none">Compile Artifact</h3>
                <span className="text-[10px] font-mono text-brand mt-2 inline-block leading-none font-bold">Buildkit Engine v24.0.x</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <ModalField label="Image Identifier" description="Base name for the output image">
                <ModalInput
                    value={imageName}
                    onChange={setImageName}
                    placeholder="e.g. edge-proxy"
                    autoFocus
                    mono
                />
            </ModalField>
            <ModalField label="Deployment Tag" description="Version specifier">
                <ModalInput
                    value={tag}
                    onChange={setTag}
                    placeholder="latest"
                    mono
                />
            </ModalField>
        </div>

        <ModalField label="Source Definition" description="Path to the Dockerfile relative to context">
            <div className="flex items-center gap-3 px-4 h-11 rounded-xl bg-surface-raised border border-border-subtle focus-within:border-brand transition-all">
                <FileCode size={16} className="text-text-disabled" />
                <input 
                    value={dockerfile}
                    onChange={e => setDockerfile(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[12px] font-mono text-text-primary"
                />
            </div>
        </ModalField>

        <div className="space-y-2">
            <ModalToggleRow 
                label="Cache Acceleration"
                description="Use previously compiled layers to reduce cycle time"
                value={useCache}
                onChange={setUseCache}
            />
        </div>

        <div className="p-4 rounded-xl bg-surface-sunken border border-border-subtle flex gap-3">
            <Info size={16} className="text-text-disabled shrink-0" />
            <p className="text-[10px] text-text-disabled leading-relaxed">Sequence will be initiated in the current working directory context. Ensure all required assets are accessible.</p>
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="secondary" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/10"
            onClick={() => {
              onBuild({ imageName, tag, dockerfile, useCache });
              onClose();
            }}
            disabled={!imageName}
          >
            Start Sequence
          </Button>
        </div>
      </div>
    </Modal>
  );
}
