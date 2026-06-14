import { MetadataRoute } from 'next';

const BASE = 'https://www.thecyberadviser.com';

const blogSlugs = [
  'identity-is-the-new-security-perimeter-itdr',
  'cloud-native-application-platform-securing-from-code-to-cloud',
  'cortex-xsoar-transforming-soc-operations',
  'securing-agentic-endpoint-cortex-xdr',
  'quantum-computing-cybersecurity-readiness',
  'what-is-palo-alto-networks-cortex-cloud',
  'strata-next-gen-firewalls',
  'panorama-centralized-mastery',
  'prisma-access-sase-revolution',
  'cortex-xdr-ai-defense',
  'automating-soc-xsoar',
  'prisma-sd-wan-cloud-gen',
  'future-secops-xsiam',
  'prisma-sase-convergence',
  'legacy-vpn-to-ztna-the-migration-plan',
  'cloud-security-posture-management',
  'security-architecture-review-methodology',
];

const knowledgeBaseSlugs = [
  'prisma-split-tunneling',
  'legacy-vpn-to-prisma-ztna',
  'scaling-mobile-user-gateways',
  'advanced-dlp-prisma',
  'troubleshooting-service-connections',
  'mpls-to-broadband-sdwan',
  'app-fabric-routing-deep-dive',
  'ion-device-high-availability',
  'qos-traffic-shaping-sdwan',
  'integrating-sdwan-prisma-access',
  'phishing-triage-playbook',
  'automating-endpoint-isolation',
  'custom-api-threat-intel',
  'ransomware-containment-workflows',
  'mastering-xsoar-war-room',
  'tuning-xdr-biocs',
  'threat-hunting-xql',
  'deploying-xdr-scale',
  'analyzing-causality-chains',
  'integrating-identity-context',
  'expedition-tool-migration',
  'ssl-decryption-at-scale',
  'ha-cluster-engineering',
  'optimizing-appid-userid',
  'threat-prevention-tuning',
  'maestro-hyperscale-architecture',
  'upgrading-mdsm',
  'clusterxl-deployments',
  'automating-management-api',
  'troubleshooting-securexl-corexl',
  'identity-awareness-ida',
  'ips-profile-tuning',
  'cisco-asa-to-checkpoint',
  'vpn-interoperability',
  'optimizing-gaia-os',
  'fortigate-sdwan-sla-routing',
  'fortinet-ha-security-fabric',
  'fortianalyzer-fortimanager-workflows',
  'fortios-ssl-inspection',
  'fortinet-vdom-architecture',
  'implementing-ztna-fortigate',
  'troubleshooting-bgp-ipsec',
  'automating-fortigate-terraform',
  'fortigate-ips-ics-scada',
  'fortigate-cloud-vs-onpremise',
  'zero-trust-roi',
  'micro-segmentation-east-west',
  'hybrid-cloud-connectivity',
  'pci-dss-architecture-patterns',
  'sase-convergence-edge',
  'ot-it-convergence-security',
  'bgp-route-hijacking-prevention',
  'dns-security-c2-prevention',
  'spine-leaf-security-topologies',
  'developing-cspm-strategy',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                           lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/about`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/services`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/contact`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/knowledge-base`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/blogs`,                lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/portfolio`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/tools`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/tools/unified-migration`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/tools/prisma-access-sizing`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/tools/siem-sizing`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/tools/cyberquiz`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map(slug => ({
    url: `${BASE}/blogs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const knowledgeBasePages: MetadataRoute.Sitemap = knowledgeBaseSlugs.map(slug => ({
    url: `${BASE}/knowledge-base/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...knowledgeBasePages];
}
