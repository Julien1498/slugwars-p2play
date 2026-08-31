import { SlugWarsActionType } from '../protocol';
import { NetworkActionDefinition } from './actionRegistryTypes';
import { LIFECYCLE_ACTION_REGISTRY } from './actionRegistryLifecycle';
import { GAMEPLAY_ACTION_REGISTRY } from './actionRegistryGameplay';

export const NETWORK_ACTION_REGISTRY: Record<SlugWarsActionType, NetworkActionDefinition<any>> = {
  ...(LIFECYCLE_ACTION_REGISTRY as any),
  ...(GAMEPLAY_ACTION_REGISTRY as any),
};
