use crate::docker::models::{CreateNetworkOptions as CreateNetworkOpts, NetworkContainer};
use crate::docker::{client::DockerClient, models::NetworkSummary};
use anyhow::{Context, Result};
use bollard::{
    models::Ipam,
    network::{CreateNetworkOptions, ListNetworksOptions},
};

const DEFAULT_NETWORKS: &[&str] = &["bridge", "host", "none"];

pub struct NetworkOps<'a> {
    client: &'a DockerClient,
}

impl<'a> NetworkOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    pub async fn list(&self) -> Result<Vec<NetworkSummary>> {
        let docker = self.client.get().await?;
        let raw = docker
            .list_networks(None::<ListNetworksOptions<String>>)
            .await
            .context("Failed to list networks")?;

        let summaries = raw
            .into_iter()
            .map(|n| {
                let id = n.id.unwrap_or_default();
                let short_id = id.chars().take(12).collect();
                let name = n.name.unwrap_or_default();
                let is_default = DEFAULT_NETWORKS.contains(&name.as_str());

                let (subnet, gateway, ip_range) = n
                    .ipam
                    .as_ref()
                    .and_then(|i| i.config.as_ref())
                    .and_then(|c| c.first())
                    .map(|cfg| {
                        (
                            cfg.subnet.clone().unwrap_or_else(|| "—".into()),
                            cfg.gateway.clone().unwrap_or_else(|| "—".into()),
                            cfg.ip_range.clone().unwrap_or_else(|| "—".into()),
                        )
                    })
                    .unwrap_or_else(|| ("—".into(), "—".into(), "—".into()));

                let containers: Vec<NetworkContainer> = n
                    .containers
                    .unwrap_or_default()
                    .into_iter()
                    .map(|(_, c)| NetworkContainer {
                        name: c.name.unwrap_or_default(),
                        ip: c
                            .ipv4_address
                            .unwrap_or_default()
                            .split('/')
                            .next()
                            .unwrap_or_default()
                            .to_string(),
                        mac_address: c.mac_address.unwrap_or_default(),
                    })
                    .collect();

                NetworkSummary {
                    id,
                    short_id,
                    name,
                    driver: n.driver.unwrap_or_default(),
                    scope: n.scope.unwrap_or_default(),
                    subnet,
                    gateway,
                    ip_range,
                    internal: n.internal.unwrap_or(false),
                    attachable: n.attachable.unwrap_or(false),
                    created: n.created.unwrap_or_default(),
                    labels: n.labels.unwrap_or_default(),
                    is_default,
                    containers,
                }
            })
            .collect();

        Ok(summaries)
    }

    pub async fn create(&self, opts: CreateNetworkOpts) -> Result<String> {
        let docker = self.client.get().await?;

        let ipam_config = if let Some(subnet) = &opts.subnet {
            Some(bollard::models::IpamConfig {
                subnet: Some(subnet.clone()),
                gateway: opts.gateway.clone(),
                ip_range: opts.ip_range.clone(),
                ..Default::default()
            })
        } else {
            None
        };

        let ipam = Ipam {
            config: ipam_config.map(|c| vec![c]),
            ..Default::default()
        };

        let create_opts = CreateNetworkOptions {
            name: opts.name.as_str(),
            driver: opts.driver.as_str(),
            internal: opts.internal,
            attachable: opts.attachable,
            labels: opts
                .labels
                .iter()
                .map(|(k, v)| (k.as_str(), v.as_str()))
                .collect(),
            ipam,
            ..Default::default()
        };

        let response = docker
            .create_network(create_opts)
            .await
            .context("Failed to create network")?;

        Ok(response.id)
    }

    pub async fn remove(&self, id: &str) -> Result<()> {
        let docker = self.client.get().await?;
        docker
            .remove_network(id)
            .await
            .context("Failed to remove network")
    }

    pub async fn connect(
        &self,
        network_id: &str,
        container_id: &str,
        ip: Option<String>,
    ) -> Result<()> {
        let docker = self.client.get().await?;
        let endpoint_config = ip.map(|addr| bollard::models::EndpointSettings {
            ipam_config: Some(bollard::models::EndpointIpamConfig {
                ipv4_address: Some(addr),
                ..Default::default()
            }),
            ..Default::default()
        });

        let opts = bollard::network::ConnectNetworkOptions {
            container: container_id,
            endpoint_config: endpoint_config.unwrap_or_default(),
        };

        docker
            .connect_network(network_id, opts)
            .await
            .context("Failed to connect container to network")
    }

    pub async fn disconnect(&self, network_id: &str, container_id: &str) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = bollard::network::DisconnectNetworkOptions {
            container: container_id,
            force: false,
        };
        docker
            .disconnect_network(network_id, opts)
            .await
            .context("Failed to disconnect container from network")
    }
}
