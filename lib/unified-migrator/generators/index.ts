import {
  GeneratedArtifact,
  GeneratorAdapter,
  GeneratorOptions,
  MigrationIR,
  TargetVendor,
} from '@/lib/unified-migrator/types';
import { PanosGenerator } from '@/lib/unified-migrator/generators/panos';
import {
  FortigateGenerator,
  CiscoAsaGenerator,
  CheckpointGenerator,
  PrismaAccessGenerator,
} from '@/lib/unified-migrator/generators/others';

const registry = new Map<TargetVendor, GeneratorAdapter>();
registry.set('pan-os', new PanosGenerator());
registry.set('fortigate', new FortigateGenerator());
registry.set('cisco-asa', new CiscoAsaGenerator());
registry.set('checkpoint', new CheckpointGenerator());
registry.set('prisma-access', new PrismaAccessGenerator());

export function getGenerator(target: TargetVendor): GeneratorAdapter {
  const gen = registry.get(target);
  if (!gen) {
    throw new Error(
      `No generator registered for target vendor: ${target}. ` +
        `Available targets: ${[...registry.keys()].join(', ')}`
    );
  }
  return gen;
}

export function listTargetVendors(): TargetVendor[] {
  return [...registry.keys()];
}
