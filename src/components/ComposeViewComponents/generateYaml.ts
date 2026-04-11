import { ComposeStack } from "../../store";

export function generateYaml(stack: ComposeStack): string {
  const services = stack.services
    .map((svc) => {
      const ports =
        svc.ports.length > 0
          ? `\n      ports:\n${svc.ports.map((p) => `        - "${p}"`).join("\n")}`
          : "";
      const vols =
        stack.volumes.length > 0
          ? `\n      volumes:\n        - ${stack.volumes[0]}:/data`
          : "";
      return `  ${svc.name}:\n    image: ${svc.image}${ports}${vols}`;
    })
    .join("\n\n");
  const nets = stack.networks
    .map((n) => `  ${n}:\n    external: true`)
    .join("\n");
  const vols = stack.volumes
    .map((v) => `  ${v}:\n    external: true`)
    .join("\n");
  return `version: "3.9"\n\nservices:\n${services}${nets ? `\n\nnetworks:\n${nets}` : ""}${vols ? `\n\nvolumes:\n${vols}` : ""}`;
}
