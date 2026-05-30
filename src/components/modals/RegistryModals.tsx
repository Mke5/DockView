import { useState } from "react";
import { Modal, ModalField, ModalInput } from "../Modal";
import { Button } from "../Button";
import { RegistryAccount, RegistryRepo } from "../../store";
import { Layers, Shield, Globe, Terminal, Box, Cloud } from "lucide-react";
import { Badge } from "../Badge";

export function AddRegistryModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (acc: any) => void;
}) {
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [type, setType] = useState<any>("dockerhub");

  return (
    <Modal title="Add Registry Node" onClose={onClose}>
      <div className="space-y-6">
        <ModalField label="Provider Endpoint" description="Select the registry host service">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "dockerhub", label: "Docker Hub", icon: <Cloud size={14} /> },
              { id: "ghcr", label: "GitHub CR", icon: <Box size={14} /> },
              { id: "ecr", label: "AWS ECR", icon: <Layers size={14} /> },
              { id: "custom", label: "Self-Hosted", icon: <Terminal size={14} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  type === t.id
                    ? "bg-brand/10 border-brand text-brand"
                    : "bg-surface-sunken border-border-subtle text-text-disabled hover:border-border-strong hover:text-text-secondary"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </ModalField>

        <ModalField label="Display Name" description="Internal identifier for this node">
          <ModalInput
            value={name}
            onChange={setName}
            placeholder="e.g. Production Cluster"
            autoFocus
          />
        </ModalField>

        <ModalField label="Namespace / Organization" description="Your primary scope on this registry">
          <ModalInput
            value={namespace}
            onChange={setNamespace}
            placeholder="e.g. acme-corp"
            mono
          />
        </ModalField>

        <div className="pt-4 flex gap-3">
          <Button variant="secondary" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest"
            onClick={() => {
              onAdd({ name, namespace, type });
              onClose();
            }}
            disabled={!name || !namespace}
          >
            Authorize Node
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function PushImageModal({
  onClose,
  accounts,
  onPushed,
}: {
  onClose: () => void;
  accounts: RegistryAccount[];
  onPushed: (accountId: string, repo: any) => void;
}) {
  const [selectedAcc, setSelectedAcc] = useState(accounts[0]?.id || "");
  const [imageName, setImageName] = useState("");

  return (
    <Modal title="Push Image To Registry" onClose={onClose}>
      <div className="space-y-6">
        <ModalField label="Target Node" description="Registry where the image will be stored">
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAcc(acc.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  selectedAcc === acc.id
                    ? "bg-brand/5 border-brand/40"
                    : "bg-surface-sunken border-border-subtle hover:border-border-strong"
                }`}
              >
                <div className="flex items-center gap-3">
                    <Cloud size={16} className={selectedAcc === acc.id ? "text-brand" : "text-text-disabled"} />
                    <span className={`text-[12px] font-bold ${selectedAcc === acc.id ? "text-brand" : "text-text-primary"}`}>{acc.name}</span>
                </div>
                <Badge variant="gray" className="text-[8px] font-black">{acc.namespace}</Badge>
              </button>
            ))}
          </div>
        </ModalField>

        <ModalField label="Repository Name" description="Final path in the registry">
          <ModalInput
            value={imageName}
            onChange={setImageName}
            placeholder="e.g. web-api"
            mono
          />
        </ModalField>

        <div className="p-4 rounded-xl bg-surface-sunken border border-border-subtle flex gap-3">
            <Shield size={16} className="text-brand shrink-0" />
            <p className="text-[10px] text-text-disabled leading-relaxed">Ensure you have the required permissions to push to this namespace. Deployment tags will be requested in the next step.</p>
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="secondary" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest"
            onClick={() => {
              onPushed(selectedAcc, { name: imageName });
              onClose();
            }}
            disabled={!selectedAcc || !imageName}
          >
            Initiate Push
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function PullImageModal({
  onClose,
  repo,
  account,
}: {
  onClose: () => void;
  repo: RegistryRepo;
  account: RegistryAccount;
}) {
  const [selectedTag, setSelectedTag] = useState(repo.tags[0]?.name || "latest");

  return (
    <Modal title="Pull From Registry" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-sunken border border-border-subtle">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-text-disabled border border-border-subtle shadow-sm rotate-2">
                <Box size={24} />
            </div>
            <div>
                <h3 className="text-[14px] font-black text-text-primary uppercase tracking-tight leading-none">{repo.name}</h3>
                <span className="text-[10px] font-mono text-text-disabled mt-2 inline-block leading-none">{account.namespace}</span>
            </div>
        </div>

        <ModalField label="Version Mapping" description="Select the specific image tag to pull">
          <div className="grid grid-cols-1 gap-2">
            {repo.tags.map((tag) => (
                <button 
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    selectedTag === tag.name 
                      ? "bg-brand/10 border-brand shadow-sm" 
                      : "bg-surface border-border-subtle hover:border-border-strong"
                  }`}
                >
                    <span className={`text-[12px] font-mono font-bold ${selectedTag === tag.name ? "text-brand" : "text-text-primary"}`}>{tag.name}</span>
                    <span className="text-[10px] font-mono text-text-disabled">{tag.size}</span>
                </button>
            ))}
          </div>
        </ModalField>

        <div className="pt-4 flex gap-3">
          <Button variant="secondary" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest"
            onClick={onClose}
          >
            Pull Local
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function CreateRepoModal({
  onClose,
  account,
  onCreated,
}: {
  onClose: () => void;
  account: RegistryAccount;
  onCreated: (repo: any) => void;
}) {
    const [name, setName] = useState("");
    const [isPrivate, setIsPrivate] = useState(true);

    return (
        <Modal title="Initialize Repository" onClose={onClose}>
            <div className="space-y-6">
                <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 flex gap-3">
                    <Cloud size={16} className="text-brand shrink-0" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand uppercase tracking-widest">Scoped to</p>
                        <p className="text-[12px] font-bold text-text-primary leading-none">{account.name} / {account.namespace}</p>
                    </div>
                </div>

                <ModalField label="Repository Slug" description="Final URI segment for the container artifact">
                    <ModalInput
                        value={name}
                        onChange={setName}
                        placeholder="e.g. core-engine"
                        mono
                        autoFocus
                    />
                </ModalField>

                <ModalField label="Visibility Architecture" description="Configure manifest accessibility scope">
                   <div className="flex gap-2">
                        <button 
                            onClick={() => setIsPrivate(true)}
                            className={`flex items-center gap-2 px-4 py-3 flex-1 rounded-xl border text-[11px] font-bold transition-all ${isPrivate ? "bg-brand/10 border-brand text-brand" : "bg-surface-sunken border-border-subtle text-text-disabled hover:text-text-secondary"}`}
                        >
                            <Shield size={14} /> Private
                        </button>
                        <button 
                            onClick={() => setIsPrivate(false)}
                            className={`flex items-center gap-2 px-4 py-3 flex-1 rounded-xl border text-[11px] font-bold transition-all ${!isPrivate ? "bg-brand/10 border-brand text-brand" : "bg-surface-sunken border-border-subtle text-text-disabled hover:text-text-secondary"}`}
                        >
                            <Globe size={14} /> Public
                        </button>
                   </div>
                </ModalField>

                <div className="pt-4 flex gap-3">
                    <Button variant="secondary" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest" 
                        disabled={!name}
                        onClick={() => onCreated({ name, isPrivate })}
                    >
                        Initialize
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
