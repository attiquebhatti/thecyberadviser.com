import {
  GeneratedArtifact,
  GeneratorAdapter,
  GeneratorOptions,
  MigrationIR,
  TargetVendor,
} from '@/lib/unified-migrator/types';
import { PanosGenerator } from '@/lib/unified-migrator/generators/panos';

const registry = new Map<TargetVendor, GeneratorAdapter>();
registry.set('pan-os', new PanosGenerator());

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
